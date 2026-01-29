using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AIbotAdmin.Server.Converters;

public class NumberAsStringConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type t)
    {
        var u = Nullable.GetUnderlyingType(t) ?? t;
        return u == typeof(int) || u == typeof(long) || u == typeof(short) ||
               u == typeof(float) || u == typeof(double) || u == typeof(decimal) ||
               u == typeof(bool) || u == typeof(DateTime);
    }

    public override JsonConverter CreateConverter(Type t, JsonSerializerOptions o)
    {
        var u = Nullable.GetUnderlyingType(t) ?? t;

        if (u == typeof(bool)) return (JsonConverter)Activator.CreateInstance(typeof(BoolConv<>).MakeGenericType(t))!;
        if (u == typeof(DateTime)) return (JsonConverter)Activator.CreateInstance(typeof(DateConv<>).MakeGenericType(t))!;
        if (u == typeof(int) || u == typeof(long) || u == typeof(short) ||
            u == typeof(float) || u == typeof(double) || u == typeof(decimal))
            return (JsonConverter)Activator.CreateInstance(typeof(NumConv<>).MakeGenericType(t))!;

        throw new NotSupportedException();
    }

    private class NumConv<T> : JsonConverter<T>
    {
        public override T Read(ref Utf8JsonReader r, Type type, JsonSerializerOptions o)
        {
            var nullable = Nullable.GetUnderlyingType(type) != null;
            if (r.TokenType == JsonTokenType.Null) return nullable ? default! : throw new JsonException();

            if (r.TokenType == JsonTokenType.Number)
            {
                var t = Nullable.GetUnderlyingType(type) ?? type;
                if (t == typeof(int) && r.TryGetInt32(out var i)) return (T)(object)i!;
                if (t == typeof(long) && r.TryGetInt64(out var l)) return (T)(object)l!;
                if (t == typeof(float) && r.TryGetSingle(out var f)) return (T)(object)f!;
                if (t == typeof(double) && r.TryGetDouble(out var d)) return (T)(object)d!;
                if (t == typeof(decimal) && r.TryGetDecimal(out var m)) return (T)(object)m!;
            }

            var s = r.TokenType == JsonTokenType.String ? r.GetString()
                    : r.TokenType == JsonTokenType.Number ? r.GetDouble().ToString(CultureInfo.InvariantCulture)
                    : null;

            if (s != null)
            {
                var t = Nullable.GetUnderlyingType(type) ?? type;
                try
                {
                    if (t == typeof(int) && int.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var i)) return (T)(object)i!;
                    if (t == typeof(long) && long.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var l)) return (T)(object)l!;
                    if (t == typeof(float) && float.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var f)) return (T)(object)f!;
                    if (t == typeof(double) && double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var d)) return (T)(object)d!;
                    if (t == typeof(decimal) && decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var m)) return (T)(object)m!;
                }
                catch { /* ignore */ }
            }

            return nullable ? default! : throw new JsonException();
        }

        public override void Write(Utf8JsonWriter w, T v, JsonSerializerOptions o)
        { if (v == null) w.WriteNullValue(); else w.WriteRawValue(Convert.ToString(v, CultureInfo.InvariantCulture)!); }
    }

    private class BoolConv<T> : JsonConverter<T>
    {
        public override T Read(ref Utf8JsonReader r, Type type, JsonSerializerOptions o)
        {
            var nullable = Nullable.GetUnderlyingType(type) != null;
            if (r.TokenType == JsonTokenType.Null) return nullable ? default! : throw new JsonException();

            if (r.TokenType == JsonTokenType.True || r.TokenType == JsonTokenType.False)
                return (T)(object)(r.GetBoolean());

            if (r.TokenType == JsonTokenType.String &&
                bool.TryParse(r.GetString(), out var b))
                return (T)(object)b!;

            return nullable ? default! : throw new JsonException();
        }

        public override void Write(Utf8JsonWriter w, T v, JsonSerializerOptions o)
        { if (v == null) w.WriteNullValue(); else w.WriteBooleanValue((bool)(object)v!); }
    }

    private class DateConv<T> : JsonConverter<T>
    {
        public override T Read(ref Utf8JsonReader r, Type type, JsonSerializerOptions o)
        {
            var nullable = Nullable.GetUnderlyingType(type) != null;
            if (r.TokenType == JsonTokenType.Null) return nullable ? default! : throw new JsonException();

            if (r.TokenType == JsonTokenType.String &&
                DateTime.TryParse(r.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var dt))
                return (T)(object)dt!;

            if (r.TokenType == JsonTokenType.Number && r.TryGetInt64(out var unix))
                return (T)(object)DateTimeOffset.FromUnixTimeMilliseconds(unix).UtcDateTime;

            return nullable ? default! : throw new JsonException();
        }

        public override void Write(Utf8JsonWriter w, T v, JsonSerializerOptions o)
        { if (v == null) w.WriteNullValue(); else w.WriteStringValue(((DateTime)(object)v!).ToString("O")); }
    }
}