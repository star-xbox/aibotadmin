using Microsoft.AspNetCore.Mvc.Filters;

namespace AIbotAdmin.Server.Attributes;

public class IgnoreInvalidModelStateAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        base.OnActionExecuting(context);
    }
}