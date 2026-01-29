using AIbotAdmin.Server.Common;
using AIbotAdmin.Server.Models;
using AIbotAdmin.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AIbotAdmin.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/document")]
public class DocumentController : Controller
{
    private readonly ILogger _logger;
    private readonly IDocumentService _service;

    public DocumentController(ILogger<DocumentController> logger, IDocumentService service, IConfiguration config, IOptions<Message> messageOptions)
    {
        _logger = logger;
        _service = service;

    }

    [HttpGet]
    [Route("get-list")]
    public IActionResult GetList([FromQuery] int bukken_cd)
    {
        try
        {
            if (HttpContext.User.Identity != null && HttpContext.User.Identity.IsAuthenticated)
            {
                try
                {
                    List<T_Document>? listDocument = _service.GetList(bukken_cd);
                    return Ok(new
                    {
                        status = "ok",
                        data = listDocument
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

    [HttpGet]
    [Route("view")]
    public IActionResult ViewFile([FromQuery] string doc_cd)
    {
        try
        {
            if (HttpContext.User.Identity != null && HttpContext.User.Identity.IsAuthenticated)
            {
                try
                {
                    T_Document? document = _service.GetData(doc_cd);
                    if (
                        document != null &&
                        !string.IsNullOrEmpty(document.physical_path) &&
                        !string.IsNullOrWhiteSpace(document.physical_path) &&
                        !string.IsNullOrEmpty(document.physical_name) &&
                        !string.IsNullOrWhiteSpace(document.physical_name)
                    )
                    {
                        return this.GetPhysicalFile(document.physical_path, document.physical_name, document.doc_name);
                    }
                    return NotFound("ファイルが存在しません。");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex.Message);
                    Response.StatusCode = 400;
                    return Forbid(ex.Message);
                }
            }
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            Response.StatusCode = 400;
            return new ForbidResult();
        }
    }

    [HttpGet]
    [Route("download")]
    public IActionResult DownloadFile([FromQuery] string doc_cd)
    {
        try
        {
            if (HttpContext.User.Identity != null && HttpContext.User.Identity.IsAuthenticated)
            {
                try
                {
                    T_Document? document = _service.GetData(doc_cd);
                    if (
                        document != null &&
                        !string.IsNullOrEmpty(document.physical_path) &&
                        !string.IsNullOrWhiteSpace(document.physical_path) &&
                        !string.IsNullOrEmpty(document.physical_name) &&
                        !string.IsNullOrWhiteSpace(document.physical_name)
                    )
                    {
                        return this.GetPhysicalFile(document.physical_path, document.physical_name, document.doc_name, true);
                    }
                    return NotFound();
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
            return new ForbidResult();
        }
    }
}
