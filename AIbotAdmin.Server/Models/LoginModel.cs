using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.ComponentModel.DataAnnotations;

namespace AIbotAdmin.Server.Models;

public class LoginModel
{
    [Required()]
    public string? LoginId { get; set; }

    [Required()]
    [DataType(DataType.Password)]
    public string? Password { get; set; }

    public bool RememberMe { get; set; }
    public string? Token { get; set; }
    public int user_cd { get; set; }
}