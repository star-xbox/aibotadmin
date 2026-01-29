using System.ComponentModel.DataAnnotations;

namespace AIbotAdmin.Server.Models;

public class T_Bukken_Search
{
    public string? userCD { get; set; }
    public string? bukken_name { get; set; }
    public string? document_type { get; set; }
    public string? start_date { get; set; }
    public string? end_date { get; set; }
    public bool? isDIMGRegistration { get; set; }
}