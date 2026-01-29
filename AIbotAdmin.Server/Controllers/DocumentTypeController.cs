using AIbotAdmin.Server.Models;
using AIbotAdmin.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AIbotAdmin.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/document-type")]
public class DocumentTypeController : Controller
{
    private readonly ILogger _logger;
    private readonly IDocumentTypeService _service;

    public DocumentTypeController(ILogger<DocumentTypeController> logger, IDocumentTypeService service, IConfiguration config, IOptions<Message> messageOptions)
    {
        _logger = logger;
        _service = service;

    }

    [HttpGet]
    [Route("get-list")]
    public IActionResult GetList([FromQuery] int classFlg)
    {
        try
        {
            if (HttpContext.User.Identity != null && HttpContext.User.Identity.IsAuthenticated)
            {
                try
                {
                    List<M_DocumentType>? listDocument = _service.GetList(classFlg);
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
}
