using System.ComponentModel.DataAnnotations;

namespace AIbotAdmin.Server.Models;

public class T_Bukken_List : T_Bukken
{	
	public int? Id { get; set; }
	public string? doc_name { get; set; }
    public string? physical_path { get; set; }
}