namespace AIbotAdmin.Server.Models;

public class UserApi
{
    public UserApiItem? results { get; set; }
}

public class UserApiItem
{

    public string? user_id { get; set; }
    public string? user_name { get; set; }
    public string? mail_address { get; set; }
    public string? naisen { get; set; }
    public string? gaisen { get; set; }
    public string? jigyousyo_name { get; set; }
    public string? soshiki_name { get; set; }
    public string? jinji_seihin_kbn_cd { get; set; }
    public string? kanri_kigyou_cd { get; set; }
    public string? kanri_kigyou_name { get; set; }
    public string? todoufuken { get; set; }
    public string? shikutyouson { get; set; }
    public string? oaza { get; set; }
    public string? tyoumoku { get; set; }
    public string? syozoku_kigyou_cd { get; set; }
    public string? shikaku_kyu { get; set; }
    public string? yakusyoku_name { get; set; }
    public string? syokusyu_name { get; set; }
    public string? jigyousyo_soshiki_cd { get; set; }
    public string? eigyousyo_soshiki_cd { get; set; }
    public string? jigyousyo_soshiki_name { get; set; }
    public string? eigyousyo_soshiki_name { get; set; }
    public string? banchi { get; set; }
    public string? buil_mansion_name { get; set; }
    public string? user_name_kana { get; set; }
    public string? jigyousyo_cd { get; set; }
    public string? eigyousyo_cd { get; set; }
    public string? level_soshiki_name { get; set; }
    public string? zip { get; set; }
    public string? bu_soshiki_cd { get; set; }
    public string? bu_soshiki_name { get; set; }
    public string? ka_soshiki_cd { get; set; }
    public string? ka_soshiki_name { get; set; }
    public string? eigyousyo_name { get; set; }
}