using BipVnDataBase;
using AIbotAdmin.Server.Models;
using System.Data;

namespace AIbotAdmin.Server.Services;

public interface ISystemService
{
    List<M_System>? GetList(int paramKey);
}
public class SystemService : ISystemService
{
    BipVnDb? _db;
    public SystemService(IDbService dbService)
    {
        _db = dbService.CurrentDb();
    }

    public List<M_System>? GetList(int paramKey)
    {
        Dictionary<string, object>? output = null;

        var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_PARAM_KEY", DbType.Int32, paramKey),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
        try
        {
            var dbValue = _db!.StoredProcedure("M_SYSTEM_GET_LIST", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));
                if (err_cd == 0)
                {
                    return ((BipVnDbResult)dbValue).ToList<M_System>();
                }
                return null;
            }
            else
                throw (Exception)dbValue!;
        }
        catch
        {
            throw;
        }
    }
}
