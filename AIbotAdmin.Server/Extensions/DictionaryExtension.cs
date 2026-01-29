using System.ComponentModel;

namespace AIbotAdmin.Server.Extensions;

public static class DictionaryExtension
{
    public static Dictionary<string, object>? ToDictionary(this object source)
    {
        return source.ToDictionary<object>();
    }

    public static Dictionary<string, T>? ToDictionary<T>(this object source)
    {
        if (source == null)
            return null;

        var dictionary = new Dictionary<string, T>();
        foreach (PropertyDescriptor property in TypeDescriptor.GetProperties(source))
            AddPropertyToDictionary<T>(property, source, dictionary);
        return dictionary;
    }

    private static void AddPropertyToDictionary<T>(PropertyDescriptor property, object? source, Dictionary<string, T> dictionary)
    {
        object? value = property.GetValue(source);
        if (IsOfType<T>(value!))
            dictionary.Add(property.Name, (T)value!);
    }

    private static bool IsOfType<T>(object value)
    {
        return value is T;
    }
}
