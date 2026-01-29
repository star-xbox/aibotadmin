using AIbotAdmin.Server.Attributes;
using AIbotAdmin.Server.Common;
using AIbotAdmin.Server.Extensions;
using AIbotAdmin.Server.Models;
using AIbotAdmin.Server.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.MicrosoftAccount;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace AIbotAdmin.Server.Controllers;

[ApiController]
[Route("api/auth")]
[Authorize]
public class AuthController : Controller
{
    private readonly ILogger _logger;
    private readonly Message _messages;
    private readonly IAdminUserService _service;
    private readonly IConfiguration _config;
    private readonly ISignManager SignInManager;

    public AuthController(ILogger<AuthController> logger, IAdminUserService service, IConfiguration config, IOptions<Message> messageOptions)
    {
        _config = config;
        _logger = logger;
        _service = service;
        _messages = messageOptions.Value;
        SignInManager = new AppSignInManager(_config);
    }

    [AllowAnonymous]
    [HttpPost]
    [Route("login")]
    [IgnoreInvalidModelState]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        try
        {
            string msg_error = "";
            if (ModelState.IsValid)
            {
                M_AdminUser? user = _service.Login(model);
                if (user != null)
                {
                    var userApi = await LoginApi(model.LoginId, model.Password);
                    var isAccess = false;
                    if (userApi != null)
                    {
                        string? office_number = _config.GetSection("Security:jinji_seihin_kbn_cd").Get<string>();
                        var lstOfficeAccess = office_number == null ? [] : office_number.Split(',');

                        for (var i = 0; i < lstOfficeAccess.Length; i++)
                        {
                            if (lstOfficeAccess[i] == userApi.jinji_seihin_kbn_cd)
                            {
                                isAccess = true;
                                break;
                            }
                        }
                    }
                    if (isAccess)
                    {
                        //var userModel = new M_AdminUser
                        //{
                        //    UserCD = user.UserCD,
                        //    LoginID = model.LoginId,
                        //    LoginType = 1,
                        //    UserName = userApi!.user_name,
                        //    UserNameKana = userApi.user_name_kana,
                        //    UserTel = userApi.gaisen,
                        //    UserNaisen = userApi.naisen,
                        //    UserMail = userApi.mail_address,
                        //    EstName = userApi.jigyousyo_name,
                        //    OfcName = userApi.eigyousyo_name,
                        //    BuSoshikName = userApi.bu_soshiki_name,
                        //    KaSoshikiName = userApi.ka_soshiki_name,
                        //    KanriKigyouCD = userApi.kanri_kigyou_cd,
                        //    UserKengen = user.UserKengen,
                        //    DelFlg = 0
                        //};
                        user.Password = "";
                        return await LoginBase(user);
                    }
                    else
                    {
                        msg_error = _messages.M0004;
                    }
                    SignInManager.LoginLock(HttpContext);
                }
                else
                {
                    msg_error = _messages.M0003;
                }
            }
            else
            {
                if (string.IsNullOrEmpty(model.LoginId) || string.IsNullOrEmpty(model.Password))
                {
                    msg_error = _messages.M0001;
                }
                else
                {
                    msg_error = _messages.M0002;
                }
            }
            if (!string.IsNullOrEmpty(msg_error))
            {
                _logger.LogWarning("Login failed for user {LoginId}: {Message}", model.LoginId, msg_error);
            }
            SignInLock signInLock = SignInManager.LoginLocked(HttpContext);
            if (signInLock.IsLock)
            {
                return Ok(new
                {
                    status = "locked",
                    LoginLock = signInLock.IsLock,
                    LoginCountFail = signInLock.TimeLock,
                    TimeUnLock = signInLock.TimeUnLock,
                    message = msg_error
                });
            }
            else
            {
                return Ok(new
                {
                    status = "error",
                    message = msg_error
                });
            }

        }
        catch (Exception ex)
        {
            Response.StatusCode = 400;
            _logger.LogError(ex.Message);
            return new JsonResult(new { message = ex.Message });
        }
    }

    [ApiExplorerSettings(IgnoreApi = true)]
    private async Task<IActionResult> LoginBase(M_AdminUser user)
    {
        if (user != null)
        {
            user.LastAccess = DateTime.Now;
            string[] managerKengen = { "1111", "1523" };
            string[] accKengen = { "0111" };
            bool isAdmin = false;
            bool isAcc = false;
            if (managerKengen.Contains(user.AdminUserKengen))
            {
                isAdmin = true;
            }
            if (accKengen.Contains(user.AdminUserKengen))
            {
                isAcc = true;
            }
            await SignInManager.SignIn(HttpContext, user.LoginID!, user.AdminUserName!, user.AdminUserKengen!, user, false);
            return Ok(new
            {
                status = "ok",
                isAdmin,
                isAcc,
                user
            });
        }
        else
        {
            bool isLock = SignInManager.LoginLock(HttpContext);
            if (isLock)
            {
                return Ok(new
                {
                    status = "locked"
                });
            }
            else
            {
                return Ok(new
                {
                    status = "error",
                    message = _messages.M0003
                });
            }
        }

    }

    [ApiExplorerSettings(IgnoreApi = true)]
    private async Task<UserApiItem?> LoginApi(string? userId, string? password)
    {
        string? login_api_url = _config.GetSection("Security:login_api_url").Get<string>();
        string? login_api_hash = _config.GetSection("Security:login_api_hash").Get<string>();

        string? loginApi = await LoginApi(userId, password, login_api_url, login_api_hash);
        if (!string.IsNullOrEmpty(loginApi) && !loginApi.Contains("\"results\":false"))
        {
            loginApi = loginApi.Replace("callback(", "");
            loginApi = loginApi.Replace(");", "");
            UserApi? userApi = JsonSerializer.Deserialize<UserApi>(loginApi);
            return userApi!.results;
        }
        return null;
    }


    [ApiExplorerSettings(IgnoreApi = true)]
    private async Task<string?> LoginApi(string? userId, string? password, string? login_api_url, string? login_api_hash)
    {
        try
        {
            string hashSeed = DateTime.Now.ToString("yyyyMd") + login_api_hash;
            var bytes = Encoding.UTF8.GetBytes((password + hashSeed));
            string pass = Convert.ToBase64String(bytes);

            string query = "?id=" + userId + "&pass=" + pass + "&format=jsonp&callback=callback&mode=login";
            using (HttpClient client = new HttpClient())
            {
                var content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("id", userId!),
                    new KeyValuePair<string, string>("pass", pass),
                    new KeyValuePair<string, string>("format", "jsonp"),
                    new KeyValuePair<string, string>("callback", "callback"),
                    new KeyValuePair<string, string>("mode", "login")
                });
                var result = await client.PostAsync(login_api_url + query, content);
                string resultContent = await result.Content.ReadAsStringAsync();
                return resultContent;
            }
        }
        catch
        {
            return null;
        }
    }

    [HttpGet]
    [Route("whoami")]
    [Authorize]
    public IActionResult Whoami()
    {
        try
        {
            if (HttpContext.User.Identity != null && HttpContext.User.Identity.IsAuthenticated)
            {
                try
                {
                    var userLogin = SignInManager.UserData(HttpContext);
                    if (userLogin != null)
                    {
                        return Ok(new
                        {
                            status = "ok",
                            userLogin
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex.Message);
                    Response.StatusCode = 400;
                    return new JsonResult(new { Message = ex.Message });
                }
            }
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            Response.StatusCode = 400;
            return new JsonResult(new { Message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpGet]
    [Route("locked")]
    public IActionResult CheckLocked()
    {
        try
        {
            SignInLock signInLock = SignInManager.LoginLocked(HttpContext);

            return Ok(new
            {
                status = "ok",
                LoginLock = signInLock.IsLock,
                LoginCountFail = signInLock.TimeLock,
                TimeUnLock = signInLock.TimeUnLock,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            Response.StatusCode = 400;
            return new JsonResult(new { Message = ex.Message });
        }
    }

    [HttpGet]
    [Route("logout")]
    public async Task<IActionResult> Logout()
    {
        try
        {
            await SignInManager.SignOut(HttpContext);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            Response.StatusCode = 400;
            return new JsonResult(new { Message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpGet("login-microsoft")]
    [IgnoreInvalidModelState]
    public IActionResult LoginMicrosoft([FromQuery] string returnUrl = "/")
    {
        Console.WriteLine("LoginMicrosoft");
        var props = new AuthenticationProperties
        {
            RedirectUri = Url.Action("Callback", "Auth", new { returnUrl })!
            //RedirectUri = "/api/auth/callback" //returnUrl   // ví dụ "/" hoặc "/login-success"
        };

        return Challenge(props, MicrosoftAccountDefaults.AuthenticationScheme);
    }

    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback()
    {
        // Lấy thông tin user sau khi Microsoft trả về
        Console.WriteLine("call back");
        var result = await HttpContext.AuthenticateAsync(MicrosoftAccountDefaults.AuthenticationScheme);

        if (!result.Succeeded || result.Principal == null)
        {
            _logger.LogWarning("Login failed for user: {Message}",  "!result.Succeeded || result.Principal == null");
            return LocalRedirect($"~/loginerr");
        }

        var claims = result.Principal.Claims;

        var id = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
        try
        {
            var loginModel = new LoginModel
            {
                LoginId = email!,
                Password = id
            };
            M_AdminUser? user = _service.Login(loginModel);

            if (user != null && user.LoginType == 2)
            {
                user.Password = "";
                await LoginBase(user);
            }
            else
            {
                _logger.LogWarning("Login failed for user: {LoginId}: {Message}", email, "LoginBase(user)");
                return LocalRedirect($"~/loginerr");
            }
        }
        catch (Exception e)
        {
            _logger.LogWarning("Login Exception failed for user: {LoginId}: {Message}", email, e.Message);
            return LocalRedirect($"~/loginerr");            
        }
        var basePath = Request.PathBase.HasValue ? Request.PathBase.Value : string.Empty;
        return LocalRedirect($"{basePath}/home");
    }
}