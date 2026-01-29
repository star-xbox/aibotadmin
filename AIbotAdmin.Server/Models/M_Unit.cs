using System.ComponentModel.DataAnnotations;

namespace AIbotAdmin.Server.Models;

public class M_Unit
{
    [Key]
    public int? UnitCD { get; set; }
    public string? UnitName { get; set; }
}