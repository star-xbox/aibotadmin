namespace AIbotAdmin.Server.Models;

public class BukkenCreate
{
    public string? bukken_name { get; set; }
    public int? documentClassFlg { get; set; }
    public int? documentTypeCD { get; set; }
	public int? documentMediaCD { get; set; }
	public int? documentDetailsCD { get; set; }
	public string? relatedDocument { get; set; }
	public string? terminatedDocument { get; set; }
	public int? companyTypeFlg { get; set; }
	public int? groupTypeFlg { get; set; }
	public string? companyName { get; set; }
	public string? branchName { get; set; }
	public string? divisionName { get; set; }
	public int? unitCD { get; set; }
	public string? contract_start { get; set; }
	public string? contract_end { get; set; }
	public DateTime? create_date { get; set; }
	public string? tanto_name { get; set; }
	public string? b_characters { get; set; }
	public int? amount { get; set; }
	public string? remarks { get; set; }
	public string? knumber { get; set; }
	public IFormFile[]? mediaFiles { get; set; }
	public IFormFile[]? otherFiles { get; set; }
}

public class BukkenUpdate: BukkenCreate
{
    public string? bukken_cd { get; set; }
    public string? storage_id { get; set; }
    public int? dimgRegisteredFlg { get; set; }
    public string[]? removeMediaFiles { get; set; }
    public string[]? removeOtherFiles { get; set; }
    public Dictionary<string, int>? mediaFileOrders { get; set; }
    public Dictionary<string, int>? otherFileOrders { get; set; }
}

public class BukkenSetDimg
{
    public string? bukken_cd { get; set; }
    public string? storage_id { get; set; }
    public int? dimgRegisteredFlg { get; set; }
}