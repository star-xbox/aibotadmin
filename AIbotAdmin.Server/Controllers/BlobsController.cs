using AIbotAdmin.Server.Models;
using AIbotAdmin.Server.Services;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Serilog;
using System;
using Path = System.IO.Path;

namespace AIbotAdmin.Server.Controllers
{
    public record BlobFileDto(
     string Name,
     long? Size,
     string? ContentType,
     DateTimeOffset? LastModified,
     Uri Url,
     string? Comment
 );

    public record UploadConfigDto(List<string> AllowedExtensions, long MaxFileSizeMB);
    public record FolderDto(string Path, string? Comment);
    public record BlobListResponse(List<BlobFileDto> Files, Dictionary<string, string?> FolderComments, List<string> FolderPaths, string ManagedRoot, UploadConfigDto UploadConfig);

    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class BlobsController : ControllerBase
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _db;
        private readonly IActionLogService _log;

        public BlobsController(BlobServiceClient blobServiceClient, IConfiguration config, ApplicationDbContext db, IActionLogService log)
        {
            _blobServiceClient = blobServiceClient;
            _config = config;
            _db = db;
            _log = log;
        }

        private BlobContainerClient Container()
        {
            var containerName = _config["AzureBlob:Container"];
            return _blobServiceClient.GetBlobContainerClient(containerName);
        }

        [HttpGet("list")]
        public async Task<ActionResult<List<BlobFileDto>>> List([FromQuery] string? prefix = null, [FromQuery] int take = 200)
        {
            if (take is < 1 or > 2000) take = 200;

            var containerName = _config["AzureBlob:Container"];
            if (string.IsNullOrWhiteSpace(containerName))
                return Problem("Missing AzureBlob:Container in configuration.");

            var container = _blobServiceClient.GetBlobContainerClient(containerName);

            // --------------------
            // 1) Lấy blob trong container
            // --------------------
            var blobItems = new List<(BlobItem item, Uri uri)>(take);
            var managedPrefix = CombineWithRoot(prefix);

            await foreach (var item in container.GetBlobsAsync(
                traits: BlobTraits.Metadata,
                states: BlobStates.None,
                prefix: managedPrefix))
            {
                var uri = container.GetBlobClient(item.Name).Uri;
                blobItems.Add((item, uri));
                if (blobItems.Count >= take) break;
            }

            var blobNames = blobItems.Select(x => x.item.Name).ToList();

            // --------------------
            // 2) Comment của FILE
            // --------------------
            var fileCommentMap = await _db.T_BlobComments
                .Where(x => x.TargetType == 1 && blobNames.Contains(x.TargetPath))
                .ToDictionaryAsync(x => x.TargetPath, x => x.Comment);

            // --------------------
            // 3) Build danh sách FILE DTO
            // --------------------
            var results = blobItems.Select(x =>
            {
                fileCommentMap.TryGetValue(x.item.Name, out var cmt);
                return new BlobFileDto(
                    Name: x.item.Name,
                    Size: x.item.Properties.ContentLength,
                    ContentType: x.item.Properties.ContentType,
                    LastModified: x.item.Properties.LastModified,
                    Url: x.uri,
                    Comment: cmt
                );
            }).ToList();

            // --------------------
            // 4) Tạo folder từ blob
            // --------------------
            var folderPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var name in blobNames)
            {
                var parts = name.Split('/', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length <= 1) continue;

                for (int i = 0; i < parts.Length - 1; i++)
                {
                    var folder = string.Join('/', parts.Take(i + 1));
                    folderPaths.Add(folder);
                }
            }

            // --------------------
            // 5) Lấy folder từ DB (TargetType = 2)
            // --------------------
            var root = ManagedRoot();

            var dbFolderPaths = await _db.T_BlobComments
                .Where(x =>
                    x.TargetType == 2 &&
                    (
                        x.TargetPath == root ||
                        x.TargetPath.StartsWith(root + "/")
                    )
                )
                .Select(x => x.TargetPath)
                .ToListAsync();


            // --------------------
            // 6) AUTO sinh folder cha từ DB
            // --------------------
            foreach (var fp in dbFolderPaths)
            {
                if (!IsInsideRoot(fp)) continue;

                var relative = fp.Substring(root.Length).Trim('/');
                if (string.IsNullOrEmpty(relative))
                {
                    folderPaths.Add(root);
                    continue;
                }

                var parts = relative.Split('/', StringSplitOptions.RemoveEmptyEntries);

                var current = root;
                folderPaths.Add(current);

                foreach (var part in parts)
                {
                    current = $"{current}/{part}";
                    folderPaths.Add(current);
                }
            }

            // --------------------
            // 7) Lấy comment cho toàn bộ folderPaths
            // --------------------
            var folderCommentMap = await _db.T_BlobComments
                .Where(x => x.TargetType == 2 && folderPaths.Contains(x.TargetPath))
                .ToDictionaryAsync(x => x.TargetPath, x => x.Comment);

            // --------------------
            // 8) TRẢ VỀ ĐẦY ĐỦ CHO FE
            // --------------------
            var uploadConfig = new UploadConfigDto(GetAllowedExtensions().ToList(), GetMaxFileSize() / (1024 * 1024));
            return Ok(new BlobListResponse(
                results,
                folderCommentMap,
                folderPaths.ToList(), // <--- FE dùng để build full cây thư mục
                root,
                uploadConfig
            ));

        }

        public class UploadBlobRequest
        {
            public IFormFile File { get; set; } = default!;
        }

        [HttpPost("upload")]
        //[Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload([FromForm] UploadBlobRequest req, [FromQuery] string? path = null)
        {
            var file = req.File;
            if (file == null || file.Length == 0) return BadRequest("File is empty.");

            // 🔐 validate size
            var maxSize = GetMaxFileSize();
            if (file.Length > maxSize)
                return BadRequest($"File exceeds max size {maxSize / (1024 * 1024)}MB");

            // 🔐 validate extension
            var allowedExts = GetAllowedExtensions();
            var ext = Path.GetExtension(file.FileName)?.ToLower();

            if (string.IsNullOrEmpty(ext) || !allowedExts.Contains(ext))
                return BadRequest($"File type '{ext}' is not allowed.");

            var container = Container();
            await container.CreateIfNotExistsAsync(PublicAccessType.None);

            var safeFileName = Path.GetFileName(file.FileName);
            var blobName = string.IsNullOrWhiteSpace(path)
                ? CombineWithRoot(safeFileName)
                : CombineWithRoot(path + "/" + safeFileName);

            if (!IsInsideRoot(blobName))
                return Forbid();

            var blob = container.GetBlobClient(blobName);

            await using var stream = file.OpenReadStream();

            var headers = new BlobHttpHeaders
            {
                ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType
            };

            await blob.UploadAsync(stream, new BlobUploadOptions { HttpHeaders = headers });
            await _log.LogAsync(ActionTypes.Upload, TargetTypes.File, blobName, new { FileName = safeFileName, Size = file.Length });


            return Ok(new
            {
                status = "ok",
                name = blobName,
                url = blob.Uri.ToString()
            });
        }

        [HttpDelete("delete-prefix")]
        public async Task<IActionResult> DeletePrefix([FromQuery] string prefix)
        {
            if (string.IsNullOrWhiteSpace(prefix)) return BadRequest("prefix required.");

            prefix = prefix.Replace("\\", "/").Trim().Trim('/');

            var container = Container();

            int deletedCount = 0;
            await foreach (var item in container.GetBlobsAsync(prefix: prefix + "/"))
            {
                await container.DeleteBlobIfExistsAsync(item.Name);
                deletedCount++;
            }

            // cũng xóa luôn comment nếu có
            await _db.T_BlobComments
              .Where(x =>
                  (x.TargetType == 2 && x.TargetPath == prefix) ||
                  (x.TargetPath.StartsWith(prefix + "/"))
               )
              .ExecuteDeleteAsync();

            return Ok(new { status = "ok", prefix, deletedCount });
        }


        // ✅ XÓA: Delete file, nếu là file cuối cùng thì xóa luôn comment folder & folder rỗng cha
        // DELETE /api/Blobs/delete?name=folder/a.png
        [HttpDelete("delete")]
        public async Task<IActionResult> Delete([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return BadRequest("name required.");

            name = NormalizePath(name);
            if (!IsInsideRoot(name))
                return Forbid("Access outside managed folder is not allowed.");

            var container = Container();
            var blob = container.GetBlobClient(name);

            // 1. Xóa blob
            var deleted = await blob.DeleteIfExistsAsync();
            var oldComment = await _db.T_BlobComments
                    .Where(x => x.TargetType == 1 && x.TargetPath == name)
                    .Select(x => x.Comment)
                    .FirstOrDefaultAsync();

            await _log.LogAsync(ActionTypes.Delete, TargetTypes.File, name, new { Comment = oldComment ?? "" });

            // 2. Xóa comment của file
            await _db.T_BlobComments
                .Where(x => x.TargetType == 1 && x.TargetPath == name)
                .ExecuteDeleteAsync();

            // 3. Tìm folder cha và cleanup nếu rỗng
            //var lastSlash = name.LastIndexOf('/');
            //if (lastSlash > 0)
            //{
            //    var folderPath = name.Substring(0, lastSlash);
            //    await CleanupEmptyFoldersAsync(folderPath, container);
            //}

            return Ok(new { status = "ok", name, deleted });
        }

        private string NormalizePath(string path)
        {
            return path.Replace("\\", "/").Trim().Trim('/');
        }

        /// <summary>
        /// Xóa comment của folder + .keep nếu folder rỗng,
        /// sau đó đi ngược lên folder cha, lặp lại cho tới khi gặp folder còn file hoặc hết cấp.
        /// </summary>
        private async Task CleanupEmptyFoldersAsync(string? folderPath, BlobContainerClient container)
        {
            while (!string.IsNullOrWhiteSpace(folderPath))
            {
                bool hasRealBlob = false;

                // Kiểm tra trong folder đó còn blob “thật” nào không (bỏ qua .keep)
                await foreach (var item in container.GetBlobsAsync(prefix: folderPath + "/"))
                {
                    if (!item.Name.Equals(folderPath + "/.keep", StringComparison.OrdinalIgnoreCase))
                    {
                        hasRealBlob = true;
                        break;
                    }
                }

                // Nếu còn file thì dừng, không xóa folder này và không đi lên nữa
                if (hasRealBlob)
                    break;

                // Không còn file nào -> xóa comment folder
                await _db.T_BlobComments
                    .Where(x => x.TargetType == 2 && x.TargetPath == folderPath)
                    .ExecuteDeleteAsync();
                // Đi lên folder cha
                var lastSlash = folderPath.LastIndexOf('/');
                if (lastSlash <= 0)
                {
                    // không còn cấp cha nữa (hoặc là top-level)
                    break;
                }

                folderPath = folderPath.Substring(0, lastSlash);
            }
        }


        public record UpsertCommentRequest(byte TargetType, string TargetPath, string? Comment);

        [HttpPost("comment")]
        public async Task<IActionResult> UpsertComment([FromBody] UpsertCommentRequest req)
        {
            if (req.TargetType is not (1 or 2)) return BadRequest("TargetType must be 1(file) or 2(folder).");
            if (string.IsNullOrWhiteSpace(req.TargetPath)) return BadRequest("TargetPath required.");

            //var path = req.TargetPath.Replace("\\", "/").Trim().Trim('/');
            var path = NormalizePath(req.TargetPath);
            if (!IsInsideRoot(path))
                return Forbid();

            var row = await _db.T_BlobComments
                .FirstOrDefaultAsync(x => x.TargetType == req.TargetType && x.TargetPath == path);

            if (row == null)
            {
                row = new T_BlobComment
                {
                    TargetType = req.TargetType,
                    TargetPath = path,
                    Comment = req.Comment,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.Add(row);
            }
            else
            {
                row.Comment = req.Comment;
                row.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return Ok(new { status = "ok" });
        }
        [HttpGet("download")]
        public async Task<IActionResult> Download([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return BadRequest("name required.");
            if (!IsInsideRoot(name))
                return Forbid();

            var container = Container();
            var blob = container.GetBlobClient(name);

            if (!await blob.ExistsAsync()) return NotFound("Blob not found.");

            var resp = await blob.DownloadStreamingAsync();
            var contentType = resp.Value.Details.ContentType ?? "application/octet-stream";
            var fileName = Path.GetFileName(name);
            var oldComment = await _db.T_BlobComments
                    .Where(x => x.TargetType == 1 && x.TargetPath == name)
                    .Select(x => x.Comment)
                    .FirstOrDefaultAsync();

            await _log.LogAsync(ActionTypes.Download, TargetTypes.File, name, new { Comment = oldComment ?? "" });

            return File(resp.Value.Content, contentType, fileName);
        }
        //--------------------------------------
        // Functions for managed root path
        private string ManagedRoot()
        {
            var root = _config["AzureBlob:ManagedRoot"] ?? "";
            return root.Replace("\\", "/").Trim('/');
        }

        private string CombineWithRoot(string? subPath)
        {
            var root = ManagedRoot();
            if (string.IsNullOrWhiteSpace(subPath))
                return root;

            subPath = subPath.Replace("\\", "/").Trim('/');
            return string.IsNullOrEmpty(root) ? subPath : $"{root}/{subPath}";
        }

        private bool IsInsideRoot(string path)
        {
            var root = ManagedRoot();
            path = path.Replace("\\", "/").Trim('/');

            return string.IsNullOrEmpty(root) ||
                   path.Equals(root, StringComparison.OrdinalIgnoreCase) ||
                   path.StartsWith(root + "/", StringComparison.OrdinalIgnoreCase);
        }
        //--------------------------------------
        // Functions for upload validation
        private HashSet<string> GetAllowedExtensions()
        {
            var exts = _config
                .GetSection("Upload:AllowedExtensions")
                .Get<string[]>() ?? Array.Empty<string>();

            return exts
                .Select(e => e.StartsWith('.') ? e.ToLower() : "." + e.ToLower())
                .ToHashSet();
        }

        private long GetMaxFileSize()
        {
            var mb = _config.GetValue<long>("Upload:MaxFileSizeMB", 50);
            return mb * 1024 * 1024;
        }
    }
}