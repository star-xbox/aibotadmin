using AIbotAdmin.Server.Models;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

namespace AIbotAdmin.Server.Services
{
    public interface IActionLogService
    {
        Task LogAsync(
            string actionType,
            string targetType,
            string targetPath,
            object? extra = null
        );
    }
    public class ActionLogService : IActionLogService
    {
        private readonly ApplicationDbContext _db;
        private readonly IHttpContextAccessor _http;

        public ActionLogService(ApplicationDbContext db, IHttpContextAccessor http)
        {
            _db = db;
            _http = http;
        }

        public async Task LogAsync(
            string actionType,
            string targetType,
            string targetPath,
            object? extra = null)
        {
            var ctx = _http.HttpContext;

            var user = ctx?.User;

            var log = new T_ActionLog
            {
                ActionType = actionType,
                TargetType = targetType,
                TargetPath = targetPath,

                UserId = user?.FindFirst("sub")?.Value
                      ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value,

                UserName = user?.Identity?.Name,

                ClientIp = ctx?.Connection?.RemoteIpAddress?.ToString(),
                UserAgent = ctx?.Request?.Headers["User-Agent"].ToString(),

                ExtraData = extra == null
                    ? null
                    : JsonSerializer.Serialize(extra)
            };

            _db.T_ActionLogs.Add(log);
            await _db.SaveChangesAsync();
        }
    }

}
