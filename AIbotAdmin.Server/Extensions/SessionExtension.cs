using System.Text.Json;

namespace AIbotAdmin.Server.Extensions;

public static class SessionExtensions
{
    public static void SetObject<T>(this ISession session, string key, T value)
    {
        session.SetString(key, JsonSerializer.Serialize(value));
    }

    public static T? GetObject<T>(this ISession session, string key)
    {
        var value = session.GetString(key);
        return value == null ? default(T) : JsonSerializer.Deserialize<T>(value);
    }

    public static object? GetObject(this ISession session, string key)
    {
        return session.GetString(key);
    }

    public static void Set<T>(this ISession session, string key, T value)
    {
        if (value == null)
            return;
        session.SetString(key, value.ToString()!);
    }

    public static T? Get<T>(this ISession session, string key)
    {
        object? value = session.GetObject(key);
        if (value == null)
            return default(T);
        try
        {
            return (T)Convert.ChangeType(value, typeof(T));
        }
        catch
        {
            return default(T);
        }
    }

    public static DateTime? GetDateTime(this ISession session, string key)
    {
        object? value = session.GetObject(key);
        if (value == null)
            return null;
        try
        {
            return Convert.ToDateTime(value);
        }
        catch
        {
            return null;
        }
    }
}