using Azure;
using AIbotAdmin.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AIbotAdmin.Server.Controllers;

[ApiController]
[Route("api/config")]
public class ConfigController : Controller
{
    private readonly ILogger _logger;
    private readonly IConfiguration _config;

    public ConfigController(ILogger<AuthController> logger, IConfiguration config, IOptions<Message> messageOptions)
    {
        _logger = logger;
        _config = config;
    }

    [HttpGet]
    [Route("get-note-and-link")]
    public IActionResult GetNoteAndLink()
    {
        try
        {
            if (HttpContext.User.Identity != null && HttpContext.User.Identity.IsAuthenticated)
            {
                try
                {
                    var result = _config.GetSection("NoteAndLink").Get<Dictionary<string, string>>();
                    return Ok(new
                    {
                        status = "ok",
                        data = result
                    });
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
}