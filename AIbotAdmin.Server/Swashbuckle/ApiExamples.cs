using Swashbuckle.AspNetCore.Filters;

namespace AIbotAdmin.Server.Swashbuckle;

public class FieldError
{
    public string Field { get; set; } = "";
    public string Message { get; set; } = "";
}

public record ApiErrorResponse(string error);

public class Api401ResponseExample : IExamplesProvider<ApiErrorResponse>
{
    public ApiErrorResponse GetExamples() =>
        new("Invalid API key.");
}

public class Api403ResponseExample : IExamplesProvider<ApiErrorResponse>
{
    public ApiErrorResponse GetExamples() =>
        new("API key is missing.");
}

public class Api500ResponseExample : IExamplesProvider<ApiErrorResponse>
{
    public ApiErrorResponse GetExamples() =>
        new("Something went wrong. Please try again later.");
}