using AIbotAdmin.Server.Extensions;
using AIbotAdmin.Server.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using System.Text.Json;

namespace AIbotAdmin.Server.Common;

public class AppSignInManager : ISignManager
{
    IConfiguration _config;

    public AppSignInManager(IConfiguration config)
    {
        _config = config;
    }

    public async Task SignIn(HttpContext HttpContext, string userCD, string userName, string userRole, bool isPersistent = false)
    {
        ClaimsIdentity identity = new ClaimsIdentity(this.GetUserClaims(userCD, userName, userRole), CookieAuthenticationDefaults.AuthenticationScheme);
        ClaimsPrincipal principal = new ClaimsPrincipal(identity);
        AuthenticationProperties authenticationProperties = new AuthenticationProperties() { IsPersistent = isPersistent };
        await HttpContext.SignInAsync(
          CookieAuthenticationDefaults.AuthenticationScheme, principal, authenticationProperties
        );
    }

    public async Task SignIn(HttpContext HttpContext, string userCD, string userName, string userRole, string authenticationScheme, bool isPersistent = false)
    {
        ClaimsIdentity identity = new ClaimsIdentity(this.GetUserClaims(userCD, userName, userRole), CookieAuthenticationDefaults.AuthenticationScheme);
        ClaimsPrincipal principal = new ClaimsPrincipal(identity);
        AuthenticationProperties authenticationProperties = new AuthenticationProperties() { IsPersistent = isPersistent };
        await HttpContext.SignInAsync(
          authenticationScheme, principal, authenticationProperties
        );
    }

    public async Task SignIn(HttpContext HttpContext, string userCD, string userName, string userRole, object loginInfo, bool isPersistent = false)
    {
        ClaimsIdentity identity = new ClaimsIdentity(this.GetUserClaims(userCD, userName, userRole, loginInfo), CookieAuthenticationDefaults.AuthenticationScheme);
        ClaimsPrincipal principal = new ClaimsPrincipal(identity);
        AuthenticationProperties authenticationProperties = new AuthenticationProperties() { IsPersistent = isPersistent };
        await HttpContext.SignInAsync(
          CookieAuthenticationDefaults.AuthenticationScheme, principal, authenticationProperties
        );
    }

    public async Task SignIn(HttpContext HttpContext, string userCD, string userName, string userRole, List<string> permissions, object loginInfo, bool isPersistent = false)
    {
        ClaimsIdentity identity = new ClaimsIdentity(this.GetUserClaims(userCD, userName, userRole, loginInfo, permissions), CookieAuthenticationDefaults.AuthenticationScheme);
        ClaimsPrincipal principal = new ClaimsPrincipal(identity);
        AuthenticationProperties authenticationProperties = new AuthenticationProperties() { IsPersistent = isPersistent };
        await HttpContext.SignInAsync(
          CookieAuthenticationDefaults.AuthenticationScheme, principal, authenticationProperties
        );
    }

    public async Task SignIn(HttpContext HttpContext, string userCD, string userName, string userRole, object loginInfo, string authenticationScheme, bool isPersistent = false)
    {
        int loginTimeOut = 0;
        var rs = int.TryParse(_config["Security:LoginTimeOut"], out loginTimeOut);
        ClaimsIdentity identity = new ClaimsIdentity(this.GetUserClaims(userCD, userName, userRole, loginInfo), CookieAuthenticationDefaults.AuthenticationScheme);
        ClaimsPrincipal principal = new ClaimsPrincipal(identity);
        AuthenticationProperties authenticationProperties = new AuthenticationProperties() { IsPersistent = isPersistent, ExpiresUtc = DateTime.UtcNow.AddMinutes(loginTimeOut) };
        await HttpContext.SignInAsync(
          authenticationScheme, principal, authenticationProperties
        );
        HttpContext.User = principal;
    }

    public async Task SignOut(HttpContext HttpContext)
    {
        LoginUnLock(HttpContext);
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    }

    public async Task SignOut(HttpContext HttpContext, string authenticationScheme)
    {
        LoginUnLock(HttpContext);
        await HttpContext.SignOutAsync(authenticationScheme);
    }

    public SignInLock LoginLocked(HttpContext HttpContext)
    {
        bool SupportsUserLockout = false;
        var rs = bool.TryParse(_config!["Security:SupportsUserLockout"], out SupportsUserLockout);
        int loginTimeLock = 0;
        int loginCountLock = 0;
        if (SupportsUserLockout)
        {
            rs = int.TryParse(_config["Security:LockoutTimeSpan"], out loginTimeLock);
            rs = int.TryParse(_config["Security:LockoutMaxFailedAccessAttempts"], out loginCountLock);
            if (loginTimeLock > 0)
            {
                var LoginTime = HttpContext.Session.GetDateTime("LoginTimeLock");
                if (LoginTime != null)
                {
                    DateTime CurrentTime = DateTime.Now;
                    TimeSpan c = CurrentTime.Subtract(DateTime.Parse(LoginTime.ToString()!));
                    if (c.TotalMinutes <= loginTimeLock)
                    {
                        return new SignInLock()
                        {
                            IsLock = true,
                            TimeLock = loginCountLock,
                            TimeUnLock = ((loginTimeLock - c.TotalMinutes) * 60) + 15
                        };
                    }
                }
            }
        }
        return new SignInLock()
        {
            IsLock = false,
            TimeLock = loginCountLock,
            TimeUnLock = 0
        };
    }

    public bool LoginLock(HttpContext HttpContext)
    {
        bool SupportsUserLockout = false;
        var rs = bool.TryParse(_config!["Security:SupportsUserLockout"], out SupportsUserLockout);
        if (SupportsUserLockout)
        {
            int loginCountLock = 0;
            rs = int.TryParse(_config["Security:LockoutMaxFailedAccessAttempts"], out loginCountLock);
            int loginFail = HttpContext.Session.Get<int>("LoginFail");
            if (loginFail >= loginCountLock)
                loginFail = 0;
            loginFail++;
            HttpContext.Session.Set("LoginFail", loginFail);
            if (loginFail >= loginCountLock)
            {
                HttpContext.Session.Set("LoginTimeLock", DateTime.Now);
                HttpContext.Session.Set("LoginTime", string.Empty);
                return true;
            }
        }
        return false;
    }

    public void LoginUnLock(HttpContext HttpContext)
    {
        HttpContext.Session.Set("LoginFail", 0);
        HttpContext.Session.Set("LoginTimeLock", string.Empty);
        HttpContext.Session.Set("LoginTime", DateTime.Now);
    }

    public int GetCurrentUserId(HttpContext HttpContext)
    {
        if (!HttpContext.User.Identity!.IsAuthenticated)
            return -1;

        Claim? claim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);

        if (claim == null)
            return -1;

        int currentUserId;

        if (!int.TryParse(claim.Value, out currentUserId))
            return -1;

        return currentUserId;
    }

    public string GetCurrentRole(HttpContext HttpContext)
    {
        if (!HttpContext.User.Identity!.IsAuthenticated)
            return "";

        Claim? claim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);

        if (claim == null)
            return "";


        return claim.Value;
    }

    private IEnumerable<Claim> GetUserClaims(string userCD, string userName, string userRole)
    {
        List<Claim> claims = new List<Claim> {
            new Claim(ClaimTypes.NameIdentifier, userCD),
            new Claim(ClaimTypes.Name, userName),
            new Claim(ClaimTypes.Role, userRole)
        };
        return claims;
    }

    //private IEnumerable<Claim> GetUserClaims(string userCD, string userName, string userRole, List<string> permissions)
    //{
    //    List<Claim> claims = new List<Claim>();

    //    claims.Add(new Claim(ClaimTypes.NameIdentifier, userCD));
    //    claims.Add(new Claim(ClaimTypes.Name, userName));
    //    claims.Add(new Claim(ClaimTypes.Role, userRole));
    //    List<Claim> claimPermissions = new List<Claim>();
    //    foreach (string permission in permissions)
    //    {
    //        claims.Add(new Claim("Permission", permission));
    //    }
    //    claims.AddRange(claimPermissions);
    //    return claims;
    //}

    private IEnumerable<Claim> GetUserClaims(string userCD, string userName, string userRole, object loginInfo)
    {
        List<Claim> claims = new List<Claim> {
            new Claim(ClaimTypes.NameIdentifier, userCD),
            new Claim(ClaimTypes.Name, userName),
            new Claim(ClaimTypes.UserData, JsonSerializer.Serialize(loginInfo)),
            new Claim(ClaimTypes.Role, userRole)
        };
        return claims;
    }

    private IEnumerable<Claim> GetUserClaims(string userCD, string userName, string userRole, object loginInfo, List<string> permissions)
    {
        List<Claim> claims = new List<Claim>{
            new Claim(ClaimTypes.NameIdentifier, userCD),
            new Claim(ClaimTypes.Name, userName),
            new Claim(ClaimTypes.UserData, JsonSerializer.Serialize(loginInfo)),
            new Claim(ClaimTypes.Role, userRole),
        };
        List<Claim> claimPermissions = new List<Claim>();
        foreach (string permission in permissions)
        {
            claims.Add(new Claim("Permission", permission));
        }
        claims.AddRange(claimPermissions);
        return claims;
    }

    public M_AdminUser? UserData(HttpContext HttpContext)
    {
        if (!HttpContext.User.Identity!.IsAuthenticated)
            return null;

        Claim? claim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.UserData);

        if (claim == null)
            return null;

        return JsonSerializer.Deserialize<M_AdminUser>(claim.Value);
    }
}