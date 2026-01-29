using BipVnDataBase;
using Box.Sdk.Gen.Schemas;
using AIbotAdmin.Server.Models;
using System.Data;

namespace AIbotAdmin.Server.Services;

public interface IDocumentService
{
    string? Create(string? bukken_cd, int? userCD, string? userName, DataTable items);
    List<T_Document>? GetList(int bukken_cd);
    T_Document? GetData(string doc_cd);
    bool DeleteData(string doc_cd, int? userCD, string? userName);
    bool UploadOrder(string doc_cd, int sort_order, int? userCD, string? userName);
}
public class DocumentService : IDocumentService
{
    BipVnDb? _db;
    public DocumentService(IDbService dbService)
    {
        _db = dbService.CurrentDb();
    }

    public string? Create(string? bukken_cd, int? userCD, string? userName, DataTable items)
    {
        Dictionary<string, object>? output = null;
        string? error = null;
        try
        {
            var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_BUKKEN_CD", DbType.Int32, bukken_cd),
                _db!.CreateInParameter("@IN_ITEMS", DbType.Object, items),
                _db!.CreateInParameter("@IN_USER_CD", DbType.Int32, userCD),
                _db!.CreateInParameter("@IN_USER_NAME", DbType.String, userName),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
            var dbValue = _db!.StoredProcedure("T_DOCUMENT_INSERT", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));
            }
            else
            {
                Exception ex = (Exception)dbValue!;
                error = ex.Message;
            }
        }
        catch (Exception ex)
        {
            error = ex.Message;
        }
        return error;

    }

    public List<T_Document>? GetList(int bukken_cd)
    {
        Dictionary<string, object>? output = null;

        var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_BUKKEN_CD", DbType.Int32, bukken_cd),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
        try
        {
            var dbValue = _db!.StoredProcedure("T_DOCUMENT_GET_LIST", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));
                if (err_cd == 0)
                {
                    return ((BipVnDbResult)dbValue).ToList<T_Document>();
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

    public T_Document? GetData(string doc_cd)
    {
        Dictionary<string, object>? output = null;

        var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_DOC_CD", DbType.Int32, doc_cd),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
        try
        {
            var dbValue = _db!.StoredProcedure("T_DOCUMENT_GET", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));
                if (err_cd == 0)
                {
                    return ((BipVnDbResult)dbValue).FirstOrDefault<T_Document>();
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

    public bool DeleteData(string doc_cd, int? userCD, string? userName)
    {
        Dictionary<string, object>? output = null;

        var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_DOC_CD", DbType.Int32, doc_cd),
                _db!.CreateInParameter("@IN_USER_CD", DbType.Int32, userCD),
                _db!.CreateInParameter("@IN_USER_NAME", DbType.String, userName),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
        try
        {
            var dbValue = _db!.StoredProcedure("T_DOCUMENT_DELETE", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));
                if (err_cd == 0)
                {
                    return true;
                }
                return false;
            }
            else
                throw (Exception)dbValue!;
        }
        catch
        {
            throw;
        }
    }

    public bool UploadOrder(string doc_cd, int sort_order, int? userCD, string? userName)
    {
        Dictionary<string, object>? output = null;

        var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_DOC_CD", DbType.Int32, doc_cd),
                _db!.CreateInParameter("@IN_SORT_ORDER", DbType.Int32, sort_order),
                _db!.CreateInParameter("@IN_USER_CD", DbType.Int32, userCD),
                _db!.CreateInParameter("@IN_USER_NAME", DbType.String, userName),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
        try
        {
            var dbValue = _db!.StoredProcedure("T_DOCUMENT_UPDATE_ORDER", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));
                if (err_cd == 0)
                {
                    return true;
                }
                return false;
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
