using BipVnDataBase;
using AIbotAdmin.Server.Models;
using System.Data;

namespace AIbotAdmin.Server.Services;

public interface IDocumentTypeService
{
    List<M_DocumentType>? GetList(int classFlg);
}
public class DocumentTypeService : IDocumentTypeService
{
    BipVnDb? _db;
    public DocumentTypeService(IDbService dbService)
    {
        _db = dbService.CurrentDb();
    }

    public List<M_DocumentType>? GetList(int classFlg)
    {
        Dictionary<string, object>? output = null;

        var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_DOCUMENTCLASSFLG", DbType.Int32, classFlg),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
        try
        {
            var dbValue = _db!.StoredProcedure("M_DOCUMENT_TYPE_GET_LIST", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));
                if (err_cd == 0)
                {
                    return ((BipVnDbResult)dbValue).ToList<M_DocumentType>();
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
