namespace AIbotAdmin.Server.Models;

public class BoxException
{
    public string type { get; set; } = string.Empty;
    public int status { get; set; }
    public string code { get; set; } = string.Empty;
    public BoxInfoException context_info { get; set; } = new BoxInfoException();
    public string help_url { get; set; } = string.Empty;
    public string message { get; set; } = string.Empty;
    public string request_id { get; set; } = string.Empty;
}

public class BoxInfoException
{
    public BoxInfoConflictException conflicts { get; set; } = new BoxInfoConflictException();
}

public class BoxInfoConflictException
{
    public string type { get; set; } = string.Empty;
    public string id { get; set; } = string.Empty;
    public BoxInfoFileVersionException file_version { get; set; } = new BoxInfoFileVersionException();
    public string sequence_id { get; set; } = string.Empty;
    public string etag { get; set; } = string.Empty;
    public string sha1 { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
}

public class BoxInfoFileVersionException
{
    public string type { get; set; } = string.Empty;
    public string id { get; set; } = string.Empty;
    public string sha1 { get; set; } = string.Empty;
}

