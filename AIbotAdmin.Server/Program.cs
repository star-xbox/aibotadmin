using AIbotAdmin.Server.Common;
using AIbotAdmin.Server.Converters;
using AIbotAdmin.Server.Extensions;
using AIbotAdmin.Server.Models;
using AIbotAdmin.Server.Services;
using AIbotAdmin.Server.Swashbuckle;
using Azure.Storage.Blobs;
using EBS2.Server.Common;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.MicrosoftAccount;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Serilog;
using Swashbuckle.AspNetCore.Filters;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;


var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("messages.json", optional: false, reloadOnChange: true);
builder.Services.Configure<Message>(builder.Configuration);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Host.UseSerilog((context, configuration) => configuration.ReadFrom.Configuration(context.Configuration));
builder.Services.AddCors(options =>
{
    // The CORS policy is open for testing purposes. In a production application, you should restrict it to known origins.
    options.AddPolicy(
        "AllowAll",
        builder => builder.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});
// Add services to the container.
builder.Services.AddSingleton(sp =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var cs = cfg["AzureBlob:ConnectionString"];
    return new BlobServiceClient(cs);
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IActionLogService, ActionLogService>();

builder.Services.AddServices();
builder.Services.AddGraphQLServer().AddResolvers().AddAuthorization();
builder.Services.AddControllers(options =>
{
    options.Conventions.Insert(0, new GlobalRoutePrefixConvention("api"));
})
.AddJsonOptions(o =>
{
    o.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
    o.JsonSerializerOptions.Converters.Add(new NumberAsStringConverterFactory());
})
.ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = ctx =>
    {
        IList<IFilterMetadata>? filters = null;
        try
        {
            filters = ((ActionExecutingContext)ctx).Filters;

        }
        catch { }
        if (filters != null)
        {
            var isIgnoreInvalidModelState = filters.Any(f => f.GetType().FullName!.Contains("IgnoreInvalidModelStateAttribute"));
            if (isIgnoreInvalidModelState)
            {
                return new EmptyResult();
            }
        }
        var rootType = ctx.ActionDescriptor.Parameters.FirstOrDefault()?.ParameterType;

        var badType = ctx.HttpContext.Items["JsonBadTypePaths"] as HashSet<string> ?? new();
        var required = ctx.HttpContext.Items["JsonRequiredPaths"] as HashSet<string> ?? new();

        var list = ctx.ModelState
            .Where(k => k.Value?.Errors.Count > 0)
            .SelectMany(kvp => kvp.Value!.Errors.Select(err =>
            {
                var rawKey = kvp.Key ?? "";
                var pretty = Utils.Pretty(rawKey);
                var last = pretty.Split('.').Last();

                if (err.ErrorMessage.Contains("required", StringComparison.OrdinalIgnoreCase))
                {
                    if (badType.Contains("$." + rawKey.ToLower()))
                    {
                        var cat = rootType != null
                            ? Utils.GetFieldCategoryFromPath(rootType, rawKey)
                            : FieldCategory.OtherNonString;

                        var msg = cat switch
                        {
                            FieldCategory.Numeric => $"The {last} must be a valid number.",
                            FieldCategory.Boolean => $"The {last} must be a valid boolean (true/false).",
                            FieldCategory.DateTime => $"The {last} must be a valid date/time.",
                            FieldCategory.Guid => $"The {last} must be a valid GUID.",
                            _ => $"The {last} has an invalid value."
                        };
                        return new { field = pretty, message = msg };
                    }
                    return new { field = pretty, message = $"The {last} field is required." };
                }

                if (err.ErrorMessage.Contains("not valid", StringComparison.OrdinalIgnoreCase))
                {
                    var cat = rootType != null
                        ? Utils.GetFieldCategoryFromPath(rootType, rawKey)
                        : FieldCategory.OtherNonString;

                    var msg = cat switch
                    {
                        FieldCategory.Numeric => $"The {last} must be a valid number.",
                        FieldCategory.Boolean => $"The {last} must be a valid boolean (true/false).",
                        FieldCategory.DateTime => $"The {last} must be a valid date/time.",
                        FieldCategory.Guid => $"The {last} must be a valid GUID.",
                        _ => $"The {last} has an invalid value."
                    };
                    return new { field = pretty, message = msg };
                }

                return new { field = pretty, message = err.ErrorMessage };
            }))
            .ToList();

        return new BadRequestObjectResult(new { error = "Validation Failed", errors = list });
    };
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
string? dbServer = builder.Configuration.GetSection("Database:Server").Get<string>();
string? dbName = builder.Configuration.GetSection("Database:Name").Get<string>();
string? dbUserId = builder.Configuration.GetSection("Database:UserId").Get<string>();
string? dbPassword = builder.Configuration.GetSection("Database:Password").Get<string>();
string connectionString = $"Server={dbServer};Initial Catalog={dbName};Persist Security Info=True;User ID={dbUserId};Password={dbPassword};MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=True;Connection Timeout=3600;";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(
        connectionString,
        sqlServerOptionsAction: sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 10,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
            sqlOptions.CommandTimeout(300);
        });
});
int loginTimeOut = 0;
string? loginTimeOutStr = builder.Configuration.GetSection("Security:LoginTimeOut").Get<string>();
var rs = int.TryParse(loginTimeOutStr, out loginTimeOut);
if(!rs)
    loginTimeOut = 30;
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = MicrosoftAccountDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.Cookie.Name = "auth";
    options.ExpireTimeSpan = TimeSpan.FromMinutes(loginTimeOut);
    options.LoginPath = string.Empty;
    options.AccessDeniedPath = string.Empty;
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
})
.AddMicrosoftAccount(options =>
{
    var config = builder.Configuration.GetSection("Authentication:Microsoft");

    options.ClientId = config["ClientId"]!;
    options.ClientSecret = config["ClientSecret"]!;

    options.CallbackPath = "/api/auth/signin-microsoft";

    // Lấy thêm email
    //options.Scope.Clear();
    //options.Scope.Add("openid");
    //options.Scope.Add("profile");
    //options.Scope.Add("email");
    options.SaveTokens = true;
    //options.Events.OnRemoteFailure = ctx =>
    //{
    //    Console.WriteLine("RemoteFailure: " + ctx.Failure);
    //    ctx.HandleResponse();
    //    //ctx.Response.StatusCode = 500;
    //    return Task.CompletedTask;
    //};
    //options.Events.OnRedirectToAuthorizationEndpoint = ctx =>
    //{
    //    Console.WriteLine("RemoteFailure: " );
    //};
});
builder.Services.AddAuthorization();

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession();

bool enableSwagger = builder.Configuration.GetValue<bool>("Swagger:Enable");
if (enableSwagger)
{
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "AIbotAdmin API", Version = "v1" });
        c.ExampleFilters();
        c.AddSecurityDefinition("api-key", new OpenApiSecurityScheme
        {
            Description = "Enter API key",
            Name = "api-key",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "api-key"
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "api-key"
                    }
                },
                Array.Empty<string>()
            }
        });

    });
    //builder.Services.AddSwaggerExamplesFromAssemblyOf<SaveCostDetailResponseExample>();
    builder.Services.AddSwaggerExamplesFromAssemblyOf<Api401ResponseExample>();
    builder.Services.AddSwaggerExamplesFromAssemblyOf<Api403ResponseExample>();
    builder.Services.AddSwaggerExamplesFromAssemblyOf<Api500ResponseExample>();
}
var app = builder.Build();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
#if DEBUG
app.UseDefaultFiles();
app.UseStaticFiles();
#else
app.UseDefaultFiles(new DefaultFilesOptions
{
    DefaultFileNames = { }
});
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (ctx.File.Name.Equals("index.html", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.StatusCode = 404;
            ctx.Context.Response.Body.SetLength(0);
        }
    }
});
#endif
app.UseSerilogRequestLogging();
// Configure the HTTP request pipeline.
if (enableSwagger)//app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.EnablePersistAuthorization();
        c.InjectJavascript("../swagger-ui/custom.js?v=3");
    });
}

app.UseCors("AllowAll");
app.UseSession();

app.UseAuthentication();
app.UseAuthorization();
app.UseJsonBodyAudit();
app.MapControllers();
app.MapGraphQL();

//app.MapGet("/signin-microsoft", () => Results.Ok("This should NOT be reached if auth handler works."));


#if DEBUG
app.MapFallbackToFile("/index.html");
#else
string? _cachedIndexHtml = null;
var _basePathRegex = new Regex(@"window\.__dynamic_base__\s*=\s*'[^']*'", RegexOptions.Compiled);
app.MapFallback(async context =>
{
    if (_cachedIndexHtml == null)
    {
        var env = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var indexPath = System.IO.Path.Combine(env.WebRootPath, "index.html");
        if (!File.Exists(indexPath))
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsync("Index.html not found on server.");
            return;
        }

        _cachedIndexHtml = await File.ReadAllTextAsync(indexPath);
    }

    var basePath = context.Request.PathBase.HasValue
        ? context.Request.PathBase.Value
        : "";
    var htmlToServe = _basePathRegex.Replace(
        _cachedIndexHtml,
        $"window.__dynamic_base__ = '{basePath}'"
    );
    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.WriteAsync(htmlToServe);
});
#endif
app.Run();
