using AIbotAdmin.Server.Models;
using AIbotAdmin.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIbotAdmin.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly ILogger<ChatController> _logger;
        private readonly IChatService _chatService;

        public ChatController(ILogger<ChatController> logger, IChatService chatService)
        {
            _logger = logger;
            _chatService = chatService;
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetChatSessions([FromQuery] ChatListRequest request)
        {
            try
            {
                if (!User.Identity?.IsAuthenticated ?? true)
                    return Unauthorized(new { status = "error", message = "Unauthorized" });

                _logger.LogInformation("Getting chat sessions with filters: {@Request}", request);

                var result = await _chatService.GetChatSessions(request);

                return Ok(new
                {
                    status = "ok",
                    items = result.Items,
                    totalCount = result.TotalCount,
                    pageNumber = result.PageNumber,
                    pageSize = result.PageSize,
                    totalPages = result.TotalPages,
                    hasPrevious = result.HasPrevious,
                    hasNext = result.HasNext
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat sessions");
                return StatusCode(500, new
                {
                    status = "error",
                    message = "Failed to retrieve chat sessions",
                    error = ex.Message
                });
            }
        }

        [HttpGet("sessions/{sessionId}")]
        public async Task<IActionResult> GetChatSessionDetail(string sessionId)
        {
            try
            {
                if (!User.Identity?.IsAuthenticated ?? true)
                    return Unauthorized(new { status = "error", message = "Unauthorized" });

                if (string.IsNullOrWhiteSpace(sessionId))
                    return BadRequest(new { status = "error", message = "Session ID is required" });

                _logger.LogInformation("Getting session detail for {SessionId}", sessionId);

                var session = await _chatService.GetChatSessionDetail(sessionId);

                if (session == null)
                    return NotFound(new
                    {
                        status = "error",
                        message = $"Session {sessionId} not found"
                    });

                return Ok(new { status = "ok", data = session });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat session detail for {SessionId}", sessionId);
                return StatusCode(500, new
                {
                    status = "error",
                    message = "Failed to retrieve session detail",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("sessions/{sessionId}")]
        public async Task<IActionResult> DeleteChatSession(string sessionId)
        {
            try
            {
                if (!User.Identity?.IsAuthenticated ?? true)
                    return Unauthorized(new { status = "error", message = "Unauthorized" });

                if (string.IsNullOrWhiteSpace(sessionId))
                    return BadRequest(new { status = "error", message = "Session ID is required" });

                _logger.LogInformation("Deleting session {SessionId}", sessionId);

                var success = await _chatService.DeleteChatSession(sessionId);

                if (!success)
                    return StatusCode(500, new
                    {
                        status = "error",
                        message = "Failed to delete session"
                    });

                return Ok(new
                {
                    status = "ok",
                    message = $"Session {sessionId} deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting chat session {SessionId}", sessionId);
                return StatusCode(500, new
                {
                    status = "error",
                    message = "Failed to delete session",
                    error = ex.Message
                });
            }
        }

        [HttpPost("export")]
        public async Task<IActionResult> ExportChatSessions([FromBody] ChatExportRequest request)
        {
            try
            {
                if (!User.Identity?.IsAuthenticated ?? true)
                    return Unauthorized(new { status = "error", message = "Unauthorized" });

                if (request == null)
                    return BadRequest(new { status = "error", message = "Export request is required" });

                // Validate format
                var format = request.Format?.ToLower() ?? "csv";
                if (!new[] { "csv", "excel", "pdf" }.Contains(format))
                    return BadRequest(new { status = "error", message = "Invalid format. Use 'csv', 'excel', or 'pdf'" });

                _logger.LogInformation("Exporting chat sessions to {Format} with filters: {@Request}", format, request);

                var data = await _chatService.ExportChatSessions(request);

                var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
                var (contentType, extension) = format switch
                {
                    "excel" => ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"),
                    "pdf" => ("application/pdf", "pdf"),
                    _ => ("text/csv", "csv")
                };

                var fileName = $"chat-sessions-{timestamp}.{extension}";

                return File(data, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting chat sessions");
                return StatusCode(500, new
                {
                    status = "error",
                    message = "Failed to export sessions",
                    error = ex.Message
                });
            }
        }

        [HttpGet("export/{sessionId}")]
        public async Task<IActionResult> ExportSingleSession(string sessionId)
        {
            try
            {
                if (!User.Identity?.IsAuthenticated ?? true)
                    return Unauthorized(new { status = "error", message = "Unauthorized" });

                if (string.IsNullOrWhiteSpace(sessionId))
                    return BadRequest(new { status = "error", message = "Session ID is required" });

                _logger.LogInformation("Exporting single session {SessionId}", sessionId);

                var content = await _chatService.ExportSingleSession(sessionId);
                var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
                var fileName = $"chat-sessions-{timestamp}.txt";
                var encodedFileName = System.Net.WebUtility.UrlEncode(fileName);
                Response.Headers["Content-Disposition"] = $"attachment; filename=\"{fileName}\"; filename*=UTF-8''{encodedFileName}";

                return File(System.Text.Encoding.UTF8.GetBytes(content), "text/plain", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting chat session {SessionId}", sessionId);

                if (ex.Message.Contains("not found"))
                    return NotFound(new
                    {
                        status = "error",
                        message = ex.Message
                    });

                return StatusCode(500, new
                {
                    status = "error",
                    message = "Failed to export session",
                    error = ex.Message
                });
            }
        }
    }
}