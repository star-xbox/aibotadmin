using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AIbotAdmin.Server.Models;

public class T_Bukken
{	
	[Key]
	public int bukken_cd { get; set; }
	public string? bukken_name { get; set; }
	public int? DocumentClassFlg { get; set; }
	public int? DocumentTypeCD { get; set; }
	public int? DocumentMediaCD { get; set; }
	public int? DocumentDetailsCD { get; set; }
	public string? RelatedDocument { get; set; }
	public string? TerminatedDocument { get; set; }
	public int? CompanyTypeFlg { get; set; }
	public int? GroupTypeFlg { get; set; }
	public string? CompanyName { get; set; }
	public string? BranchName { get; set; }
	public string? DivisionName { get; set; }
	public string? tanto_division { get; set; }
	public int? UnitCD { get; set; }
	public int? DimgRegisteredFlg { get; set; }
	public int? kbn1_cd { get; set; }
	public int? kbn2_cd { get; set; }
	public string? contract_start { get; set; }
	public string? contract_end { get; set; }
    [Column("create_date")]
    public DateTime? create_date { get; set; }
	public string? tanto_name { get; set; }
	public string? b_characters { get; set; }
	public int? amount { get; set; }
	public string? remarks { get; set; }
	public int? display_flg { get; set; }
	public int? parent { get; set; }
	public int? b_generation { get; set; }
	public int? other_party { get; set; }
	public int? storage_location { get; set; }
	public string? storage_id { get; set; }
	public string? management_division { get; set; }
	public int? mediatech_team { get; set; }
	public int? bukken_type { get; set; }
	public string? KNumber { get; set; }
	public int? FinishKbn { get; set; }
	public int? del_flg { get; set; }
	public int? CreateUserCD { get; set; }
	public string? CreateUserName { get; set; }
    [Column("CreateDate")]
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