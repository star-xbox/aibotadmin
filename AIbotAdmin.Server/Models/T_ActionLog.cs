namespace AIbotAdmin.Server.Models
{
    public class T_ActionLog
    {
        public long Id { get; set; }

        public string ActionType { get; set; } = default!;
        public string TargetType { get; set; } = default!;
        public string TargetPath { get; set; } = default!;

        public string? UserId { get; set; }
        public string? UserName { get; set; }

        public string? ClientIp { get; set; }
        public string? UserAgent { get; set; }

        public string? ExtraData { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
    public static class ActionTypes
    {
        public const string Create = "CREATE";
        public const string Update = "UPDATE";
        public const string Delete = "DELETE";
        public const string Download = "DOWNLOAD";
        public const string Upload = "UPLOAD";
    }

    public static class TargetTypes
    {
        public const string File = "file";
        public const string Folder = "folder";
    }

}
