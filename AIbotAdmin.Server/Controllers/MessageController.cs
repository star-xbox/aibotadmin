using AIbotAdmin.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace AIbotAdmin.Server.Controllers;

[ApiController]
[Route("api/messages")]
public class MessageController : Controller
{
    private readonly Message _messages;
    private readonly JsonSerializerOptions _pascalCaseOptions = new()
    {
        PropertyNamingPolicy = null,
        DictionaryKeyPolicy = null,
    };
    public MessageController(IOptions<Message> messageOptions)
    {
        _messages = messageOptions.Value;
    }

    [HttpGet]
    public IActionResult Index()
    {
        string json = JsonSerializer.Serialize(_messages, _pascalCaseOptions);
        return Content(json, "application/json");
    }
}
