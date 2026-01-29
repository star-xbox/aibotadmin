namespace AIbotAdmin.Server.Common;

public class SignInLock
{
    public bool IsLock { get; set; }
    public int TimeLock { get; set; }
    public double TimeUnLock { get; set; }
}
