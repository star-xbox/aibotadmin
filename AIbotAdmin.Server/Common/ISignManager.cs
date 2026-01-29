using AIbotAdmin.Server.Models;

namespace AIbotAdmin.Server.Common;

public interface ISignManager
{
    SignInLock LoginLocked(HttpContext HttpContext);
    Task SignIn(HttpContext HttpContext, string userCD, string userName, string userRole, bool isPersistent = false);
    Task SignIn(HttpContext HttpContext, string userCD, string userName, string userRole, object loginInfo, bool isPersistent = false);
    Task SignIn(HttpContext HttpContext, string userCD, string userName, string userRole, List<string> permissions, object loginInfo, bool isPersistent = false);
    M_AdminUser? UserData(HttpContext HttpContext);
    Task SignOut(HttpContext HttpContext);
    int GetCurrentUserId(HttpContext HttpContext);
    string GetCurrentRole(HttpContext HttpContext);
    bool LoginLock(HttpContext HttpContext);
    void LoginUnLock(HttpContext HttpContext);
}