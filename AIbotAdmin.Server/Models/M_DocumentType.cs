using System.ComponentModel.DataAnnotations;

namespace AIbotAdmin.Server.Models;

public class M_DocumentType
{	
	[Key]	
	public int DocumentTypeCD { get; set; }
    public string DocumentTypeCDStr { get { return DocumentTypeCD.ToString(); } }
    public string? DocumentTypeName { get; set; }
	public int? DocumentClassFlg { get; set; }
	public int? DocumentSendCD { get; set; }
	public int? DisplayOrder { get; set; }
	public DateTime? CreateDate { get; set; }
	public int? CreateUserCD { get; set; }
	public string? CreateUserName { get; set; }
}