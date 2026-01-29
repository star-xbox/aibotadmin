namespace AIbotAdmin.Server.Models;

public class T_BlobComment
{
    public long Id { get; set; }
    public byte TargetType { get; set; } // 1=file,2=folder
    public string TargetPath { get; set; } = default!;
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

