using BipVnCommon.Utility;
using AIbotAdmin.Server.Attributes;
using AIbotAdmin.Server.Common;
using Microsoft.AspNetCore.Mvc.Controllers;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AIbotAdmin.Server.Extensions;

public static class JsonBodyAuditMiddleware
{
    public static IApplicationBuilder UseJsonBodyAudit(this IApplicationBuilder app)
    {
        return app.Use(async (ctx, next) =>
        {
            var endpoint = ctx.GetEndpoint();
            var _logger = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
            var requireApiKey = endpoint?.Metadata.GetMetadata<RequireApiKeyAttribute>() != null;
            if (requireApiKey)
            {
                var headers = ctx.Request.Headers;
                if (!headers.Keys.Contains("api-key"))
                {
                    ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                    _logger.LogError(JsonSerializer.Serialize(headers));
                    _logger.LogError("API key is missing.");
                    ctx.Response.ContentType = "application/json";

                    var result = JsonSerializer.Serialize(new
                    {
                        error = "API key is missing."
                    });

                    await ctx.Response.WriteAsync(result);
                    return;
                }
                string? apiKey = headers["api-key"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                    _logger.LogError(JsonSerializer.Serialize(headers));
                    _logger.LogError("API key is missing.");
                    ctx.Response.ContentType = "application/json";

                    var result = JsonSerializer.Serialize(new
                    {
                        error = "API key is missing."
                    });

                    await ctx.Response.WriteAsync(result);
                    return;
                }
                try
                {
                    string? decryptKey = BipVnSecurity.DecryptASCII(apiKey, "sd_bugdet", true);
                    if (decryptKey != "sd_bugdet_api_key@1!")
                    {
                        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        _logger.LogError("api-key: " + apiKey);
                        _logger.LogError("Invalid API key.");
                        ctx.Response.ContentType = "application/json";

                        var result = JsonSerializer.Serialize(new
                        {
                            error = "Invalid API key."
                        });

                        await ctx.Response.WriteAsync(result);
                        return;
                    }
                }
                catch
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    _logger.LogError("api-key: " + apiKey);
                    _logger.LogError("Invalid API key.");
                    ctx.Response.ContentType = "application/json";

                    var result = JsonSerializer.Serialize(new
                    {
                        error = "Invalid API key."
                    });

                    await ctx.Response.WriteAsync(result);
                    return;
                }
            }
            if (ctx.Request.Method == "POST")
            {

                if (ctx.Request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true)
                {
                    ctx.Request.EnableBuffering();
                    string raw;
                    using (var sr = new StreamReader(ctx.Request.Body, Encoding.UTF8, leaveOpen: true))
                        raw = await sr.ReadToEndAsync();
                    ctx.Request.Body.Position = 0;

                    var fixed1 = Regex.Replace(raw, @"(:\s*),", ": null,", RegexOptions.Compiled);
                    fixed1 = Regex.Replace(fixed1, @"(:\s*)(\})", ": null$2", RegexOptions.Compiled);
                    fixed1 = Regex.Replace(fixed1, @"(:\s*)(\])", ": null$2", RegexOptions.Compiled);
                    fixed1 = Regex.Replace(
                        fixed1,
                        @"""(?<field>[A-Za-z0-9_]+)""\s*:\s*(?<val>-?[0-9A-Za-z_\.]+)(?=\s*[,\}\]])",
                        m =>
                        {
                            var val = m.Groups["val"].Value;

                            if (val.Equals("null", StringComparison.OrdinalIgnoreCase) ||
                                val.Equals("true", StringComparison.OrdinalIgnoreCase) ||
                                val.Equals("false", StringComparison.OrdinalIgnoreCase) ||
                                decimal.TryParse(val, out _))
                            {
                                return m.Value;
                            }

                            if (Regex.IsMatch(val, "[A-Za-z_]"))
                            {
                                return $"{m.Value.Replace(val, $"\"{val}\"")}";
                            }

                            return m.Value;
                        },
                        RegexOptions.Compiled
                    );

                    Type? rootType = null;
                    var cad = endpoint?.Metadata.GetMetadata<ControllerActionDescriptor>();
                    if (cad != null)
                    {
                        rootType = cad.Parameters
                            .FirstOrDefault(p => (p.ParameterType != null))?.ParameterType;
                    }

                    var badType = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    var required = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                    if (rootType != null)
                    {
                        try
                        {
                            using var doc = JsonDocument.Parse(fixed1);
                            Traverse(doc.RootElement, rootType, "$", badType, required);
                        }
                        catch { }
                    }

                    var bytes = Encoding.UTF8.GetBytes(fixed1);
                    ctx.Request.Body = new MemoryStream(bytes);
                    ctx.Request.ContentLength = bytes.Length;

                    ctx.Items["JsonBadTypePaths"] = badType;
                    ctx.Items["JsonRequiredPaths"] = required;
                }
            }
            await next();
        });
    }

    private static void Traverse(JsonElement el, Type type, string path,
        HashSet<string> badType, HashSet<string> req)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;

        if (el.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in el.EnumerateObject())
            {
                var targetProp = type.GetProperties().FirstOrDefault(p =>
                    p.Name.Equals(prop.Name, StringComparison.OrdinalIgnoreCase));
                if (targetProp == null) continue;

                var t = Nullable.GetUnderlyingType(targetProp.PropertyType) ?? targetProp.PropertyType;
                var nextPath = $"{path}.{prop.Name}";

                if (typeof(System.Collections.IEnumerable).IsAssignableFrom(t) && t != typeof(string) && t.IsGenericType)
                {
                    var elemType = t.GetGenericArguments()[0];
                    if (prop.Value.ValueKind == JsonValueKind.Array)
                    {
                        int idx = 0;
                        foreach (var item in prop.Value.EnumerateArray())
                        {
                            Traverse(item, elemType, $"{nextPath}[{idx}]", badType, req);
                            idx++;
                        }
                    }
                    else
                    {
                        badType.Add(nextPath.ToLower());
                    }
                }
                else if (t.IsClass && t != typeof(string) && prop.Value.ValueKind == JsonValueKind.Object)
                {
                    Traverse(prop.Value, t, nextPath, badType, req);
                }
                else
                {
                    ClassifyValue(prop.Value, t, nextPath, badType, req);
                }
            }
        }
        else if (el.ValueKind == JsonValueKind.Array && type.IsArray)
        {
            var elemType = type.GetElementType()!;
            int idx = 0;
            foreach (var item in el.EnumerateArray())
            {
                Traverse(item, elemType, $"{path}[{idx}]", badType, req);
                idx++;
            }
        }
    }

    private static void ClassifyValue(JsonElement value, Type targetType, string path,
        HashSet<string> badType, HashSet<string> req)
    {
        var cat = FieldKinds.Classify(targetType);

        if (value.ValueKind == JsonValueKind.Null)
        {
            req.Add(path); // giá trị trống -> Required
            return;
        }

        try
        {
            switch (cat)
            {
                case FieldCategory.Numeric:
                    if (value.ValueKind == JsonValueKind.Number) return;
                    if (value.ValueKind == JsonValueKind.String &&
                        decimal.TryParse(value.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out _)) return;
                    badType.Add(path.ToLower()); return;

                case FieldCategory.Boolean:
                    if (value.ValueKind == JsonValueKind.True || value.ValueKind == JsonValueKind.False) return;
                    if (value.ValueKind == JsonValueKind.String && bool.TryParse(value.GetString(), out _)) return;
                    badType.Add(path.ToLower()); return;

                case FieldCategory.DateTime:
                    if (value.ValueKind == JsonValueKind.String &&
                        DateTime.TryParse(value.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out _)) return;
                    badType.Add(path.ToLower()); return;

                case FieldCategory.Guid:
                    if (value.ValueKind == JsonValueKind.String && Guid.TryParse(value.GetString(), out _)) return;
                    badType.Add(path.ToLower()); return;

                case FieldCategory.Enum:
                    if (value.ValueKind == JsonValueKind.String) { badType.Add(path.ToLower()); return; } // tuỳ policy (string enum hay int)
                    if (value.ValueKind == JsonValueKind.Number) return;
                    badType.Add(path.ToLower()); return;

                default:
                    if (value.ValueKind == JsonValueKind.String) { badType.Add(path.ToLower()); return; }
                    return;
            }
        }
        catch { badType.Add(path.ToLower()); }
    }
}