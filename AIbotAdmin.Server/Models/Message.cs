namespace AIbotAdmin.Server.Models;

public class Message
{
    public string L0001 { get; set; } = "従業員番号";
    public string L0002 { get; set; } = "パスワード";
    public string L0003 { get; set; } = "ログイン";
    public string L0004 { get; set; } = "戻る";
    public string L0005 { get; set; } = "Uploadしてください";
    public string L0006 { get; set; } = "ここにドラッグしてください";
    public string L0007 { get; set; } = "BtoB　BOX用請求書アップロードシステム";
    public string L0008 { get; set; } = "ログアウト";
    public string L0009 { get; set; } = "Menu";
    public string L0010 { get; set; } = "Upload";

    public string M0001 { get; set; } = "【0001】従業員番号が必須です。";
    public string M0002 { get; set; } = "【0002】パスワードが必須です。";
    public string M0003 { get; set; } = "【0003】ログインに失敗しました。従業員番号とパスワードをご確認ください。";
    public string M0004 { get; set; } = "【0004】共有フォルダに接続するエラーが発生しました。設定ファイルを確認してください。";
    public string M0005 { get; set; } = "【0005】APIログインのリンクが存在しません。";
    public string M0006 { get; set; } = "【0006】※Jで始まる受注管理番号のファイル名で入れてください。";
    public string M0007 { get; set; } = "【0007】データベースに接続できません。設定ファイルを確認してください。";
    public string M0008 { get; set; } = "【0008】ファイルアップロードが完了しました。";
    public string M0009 { get; set; } = "【0009】保存先のフォルダにファイルを保存でエラーが発生しました。ログファイルを確認してください。";
    public string M0010 { get; set; } = "【0010】アップロードできるのは１度に最大100ファイルです。";
    public string M0011 { get; set; } = "【0011】この形式のファイルはアップロードできません。";
}
