using AIbotAdmin.Server.Common;
using AIbotAdmin.Server.Services;

namespace AIbotAdmin.Server.Extensions;

public static class ServiceExtension
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<IDbService, DbService>();
        services.AddScoped<ISystemService, SystemService>();
        services.AddScoped<IDocumentTypeService, DocumentTypeService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IBukkenService, BukkenService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IChatService, ChatService >();
        return services;
    }
}
