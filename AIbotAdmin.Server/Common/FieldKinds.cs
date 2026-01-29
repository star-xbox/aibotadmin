namespace AIbotAdmin.Server.Common;

public enum FieldCategory { String, Numeric, Boolean, DateTime, Guid, Enum, OtherNonString }

public static class FieldKinds
{
    public static FieldCategory Classify(Type t)
    {
        t = Nullable.GetUnderlyingType(t) ?? t;

        if (t == typeof(string)) return FieldCategory.String;
        if (t.IsEnum) return FieldCategory.Enum;
        if (t == typeof(bool)) return FieldCategory.Boolean;
        if (t == typeof(DateTime) || t == typeof(DateOnly) || t == typeof(TimeOnly))
            return FieldCategory.DateTime;
        if (t == typeof(Guid)) return FieldCategory.Guid;

        if (t == typeof(int) || t == typeof(long) || t == typeof(short) ||
            t == typeof(float) || t == typeof(double) || t == typeof(decimal))
            return FieldCategory.Numeric;

        return FieldCategory.OtherNonString;
    }
}