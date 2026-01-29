namespace AIbotAdmin.Server.Attributes;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public class RequireApiKeyAttribute : Attribute { }