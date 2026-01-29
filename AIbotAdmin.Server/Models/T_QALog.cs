using System.ComponentModel.DataAnnotations;

namespace AIbotAdmin.Server.Models
{
    public class T_QALog
    {
        public long QALogCD { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public int TurnNo { get; set; }
        public long? UserCD { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string AnswerText { get; set; } = string.Empty;
        public int? ResolvedTurnNo { get; set; }
        public DateTime? RegisteredAt { get; set; }
    }

    public class ChatSessionSummary
    {
        public string SessionId { get; set; } = string.Empty;
        public long? UserCD { get; set; }
        public string UserName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int TurnCount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string LastQuestion { get; set; } = string.Empty;
        public string LastAnswer { get; set; } = string.Empty;
    }

    public class ChatSession
    {
        public string SessionId { get; set; } = string.Empty;
        public long? UserCD { get; set; }
        public string UserName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int TurnCount { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<T_QALog> QALogs { get; set; } = new List<T_QALog>();
    }

    public class ChatListRequest : PagedRequest
    {
        public string? SessionId { get; set; }
        public long? UserCD { get; set; }
        public string? UserName { get; set; }
        public string? Status { get; set; }
        public DateTime? SelectedDate { get; set; }      // Ngày được chọn
        public TimeSpan? StartTime { get; set; }         // Giờ bắt đầu (HH:mm)
        public TimeSpan? EndTime { get; set; }           // Giờ kết thúc (HH:mm)
        public string? SearchText { get; set; }
        public string? SortColumn { get; set; } = "StartTime";
        public string? SortDirection { get; set; } = "DESC";
    }

    public class ChatExportRequest
    {
        public string? SessionId { get; set; }
        public long? UserCD { get; set; }
        public string? UserName { get; set; }
        public string? Status { get; set; }
        public DateTime? SelectedDate { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public string? SearchText { get; set; }
        public string Format { get; set; } = "csv";
    }
}