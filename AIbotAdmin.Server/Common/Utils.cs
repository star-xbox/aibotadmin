using Box.Sdk.Gen.Schemas;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Org.BouncyCastle.Utilities;
using System.IO;
using System.Net;
using System.Net.Http.Headers;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace AIbotAdmin.Server.Common;

public static class Utils
{
    public static string GetSha256Hash(string rawData)
    {
        // Create a SHA256   
        using (SHA256 sha256Hash = SHA256.Create())
        {
            // ComputeHash - returns byte array  
            byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));

            // Convert byte array to a string   
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < bytes.Length; i++)
            {
                builder.Append(bytes[i].ToString("x2"));
            }
            return builder.ToString();
        }
    }

    public static string Pretty(string modelKey)
    {
        if (string.IsNullOrWhiteSpace(modelKey)) return modelKey;
        var segs = modelKey.Split('.', StringSplitOptions.RemoveEmptyEntries).ToList();

        // đổi 0-based sang 1-based để dễ đọc
        segs[0] = Regex.Replace(segs[0], @"Items\[(\d+)\]", m =>
        {
            int idx = int.Parse(m.Groups[1].Value);
            return $"Items[{idx + 1}]";
        });

        if (segs.Count > 1)
            segs[^1] = segs[^1].ToUpperInvariant();

        return string.Join('.', segs);
    }

    public static FieldCategory GetFieldCategoryFromPath(Type rootType, string fieldPath)
    {
        if (TryResolveProperty(rootType, fieldPath, out var prop))
        {
            var t = Nullable.GetUnderlyingType(prop!.PropertyType) ?? prop.PropertyType;
            return FieldKinds.Classify(t);
        }
        return FieldCategory.OtherNonString;
    }

    private static bool TryResolveProperty(Type rootType, string fieldPath, out PropertyInfo? prop)
    {
        prop = null;
        if (rootType == null || string.IsNullOrWhiteSpace(fieldPath)) return false;

        // Chuẩn hoá key: $.items[0].foo -> items[0].foo
        var path = fieldPath.StartsWith("$.") ? fieldPath[2..] : fieldPath;
        var segments = path.Split('.', StringSplitOptions.RemoveEmptyEntries);

        var curType = rootType;
        for (int i = 0; i < segments.Length; i++)
        {
            var seg = Regex.Replace(segments[i], @"\[\d+\]$", ""); // items[0] -> items

            prop = curType.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                          .FirstOrDefault(p => p.Name.Equals(seg, StringComparison.OrdinalIgnoreCase));
            if (prop == null) return false;

            if (i == segments.Length - 1) return true;

            // nếu property là IEnumerable<T> thì lấy element type
            var next = GetElementType(prop.PropertyType);
            curType = next ?? (Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType);
        }
        return prop != null;
    }

    private static Type? GetElementType(Type t)
    {
        if (t == typeof(string)) return null;

        if (t.IsArray)
            return t.GetElementType();

        if (typeof(System.Collections.IEnumerable).IsAssignableFrom(t) && t.IsGenericType)
            return t.GetGenericArguments().FirstOrDefault();

        return null;
    }

    public static IActionResult GetPhysicalFile(this ControllerBase controller, string physical_path, string physical_name, string? doc_name, bool isDownload = false)
    {
        var downloadsFolder = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Upload", physical_path);
        var filePath = System.IO.Path.Combine(downloadsFolder, physical_name);
        if (!filePath.StartsWith(downloadsFolder + System.IO.Path.DirectorySeparatorChar))
            return controller.Forbid();
        if (!System.IO.File.Exists(filePath))
            return controller.NotFound("ファイルが存在しません。");
        var provider = new FileExtensionContentTypeProvider();
        provider.TryGetContentType(filePath, out var mimeType);
        mimeType ??= "application/octet-stream";
        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        if (!isDownload)
        {
            controller.Response.Headers.Append(
                "Content-Disposition",
                $"inline; filename=\"{doc_name}\"; filename*=UTF-8''{Uri.EscapeDataString(doc_name!)}"
            );
        }

        return controller.File(stream, mimeType, isDownload ? doc_name : null, enableRangeProcessing: true);
    }
}
