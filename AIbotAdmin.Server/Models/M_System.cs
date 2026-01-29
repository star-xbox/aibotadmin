using System.ComponentModel.DataAnnotations;

namespace AIbotAdmin.Server.Models;

public class M_System
{	
	[Key]
	public int SystemCD { get; set; }
	public int? ParamKey { get; set; }
	public int? ParamNo { get; set; }
	public string? ParamName { get; set; }
	public string? ParamValue { get; set; }
	public int? Sort { get; set; }
	public string? Category { get; set; }
	public int? CreateUserCD { get; set; }
	public int? ModifyUserCD { get; set; }
	public DateTime? CreateDate { get; set; }
	public DateTime? ModifyDate { get; set; }
	public int? DelFlg { get; set; }
}