using System.ComponentModel.DataAnnotations;

namespace AIbotAdmin.Server.Models;

public class T_Document
{	
	[Key]
	public int doc_cd { get; set; }
	public int? bukken_cd { get; set; }	
	public int? s_cd { get; set; }
    public int? doc_type { get; set; }
    public string? doc_name { get; set; }	
	public int? kbn1_cd { get; set; }
	public int? kbn2_cd { get; set; }	
	public int? sort_order { get; set; }	
	public DateTime? create_date { get; set; }
	public DateTime? contract_start { get; set; }
	public DateTime? contract_end { get; set; }	
	public string? d_characters { get; set; }
	public string? remarks { get; set; }
	public int? size1 { get; set; }	
	public string? extension1 { get; set; }
	public int? display_flg { get; set; }
	public string? physical_name { get; set; }	
	public string? physical_path { get; set; }	
	public string? authority { get; set; }	
	public int? del_flg { get; set; }
	public int? CreateUserCD { get; set; }
	public string? CreateUserName { get; set; }
	public DateTime? CreateDate { get; set; }
	public int? ModifyUserCD { get; set; }
	public string? ModifyUserName { get; set; }
	public DateTime? ModifyDate { get; set; }
	public int? regist_usr_cd { get; set; }
	public string? regist_usr_name { get; set; }
	public DateTime? regist_date { get; set; }
	public int? update_usr_cd { get; set; }
	public string? update_usr_name { get; set; }
	public DateTime? update_date { get; set; }
}