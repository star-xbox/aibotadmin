using BipVnDataBase;
using AIbotAdmin.Server.Models;
using HotChocolate.Data.Sorting;
using System.Data;
using System.Xml.Linq;

namespace AIbotAdmin.Server.Services;

public interface IBukkenService
{
    string? Create(int? userCD, string? userName, BukkenCreate payload, out int? createdCD);
    string? Update(int? userCD, string? userName, BukkenUpdate payload);
    string? SetDimg(int? userCD, string? userName, BukkenSetDimg payload);
    (int? rowsNumber, List<T_Bukken_List>? data) GetListData(string? userCD, string? bukken_name, string? document_type, string? start_date, string? end_date,Boolean isDIMGRegistration, int? page,int? pageSize, string? sortField, string? sortOrder);
    T_Bukken? GetData(string bukken_cd);
}
public class BukkenService: IBukkenService
{
    BipVnDb? _db;
    public BukkenService(IDbService dbService)
    {
        _db = dbService.CurrentDb();
    }

    public string? Create(int? userCD, string? userName, BukkenCreate payload, out int? createdCD)
    {
        createdCD = null;
        Dictionary<string, object>? output = null;
        string? error = null;
        try
        {
            var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_DOCUMENT_CLASS_FLG", DbType.Int32, payload.documentClassFlg),
                _db!.CreateInParameter("@IN_DOCUMENT_TYPE_CD", DbType.Int32, payload.documentTypeCD),
                _db!.CreateInParameter("@IN_BUKKEN_NAME", DbType.String, payload.bukken_name),
                _db!.CreateInParameter("@IN_DOCUMENT_DETAILS_CD", DbType.Int32, payload.documentDetailsCD),
                _db!.CreateInParameter("@IN_DOCUMENT_MEDIA_CD", DbType.Int32, payload.documentMediaCD),
                _db!.CreateInParameter("@IN_COMPANY_TYPE_FLG", DbType.Int32, payload.companyTypeFlg),
                _db!.CreateInParameter("@IN_RELATED_DOCUMENT", DbType.String, payload.relatedDocument),
                _db!.CreateInParameter("@IN_TERMINATED_DOCUMENT", DbType.String, payload.terminatedDocument),
                _db!.CreateInParameter("@IN_BRANCH_NAME", DbType.String, payload.branchName),
                _db!.CreateInParameter("@IN_DIVISION_NAME", DbType.String, payload.divisionName),
                _db!.CreateInParameter("@IN_GROUP_TYPE_FLG", DbType.Int32, payload.groupTypeFlg),
                _db!.CreateInParameter("@IN_COMPANY_NAME", DbType.String, payload.companyName),
                _db!.CreateInParameter("@IN_CREATE_DATE", DbType.DateTime, payload.create_date),
                _db!.CreateInParameter("@IN_CONTRACT_START", DbType.String, payload.contract_start),
                _db!.CreateInParameter("@IN_CONTRACT_END", DbType.String, payload.contract_end),
                _db!.CreateInParameter("@IN_B_CHAREACTERS", DbType.String, payload.b_characters),
                _db!.CreateInParameter("@IN_REMARKS", DbType.String, payload.remarks),
                _db!.CreateInParameter("@IN_KNUMBER", DbType.String, payload.knumber),
                _db!.CreateInParameter("@IN_AMOUNT", DbType.Int32, payload.amount),
                _db!.CreateInParameter("@IN_TANTO_NAME", DbType.String, payload.tanto_name),
                _db!.CreateInParameter("@IN_UNIT_CD", DbType.Int32, payload.unitCD),
                _db!.CreateInParameter("@IN_USER_CD", DbType.Int32, userCD),
                _db!.CreateInParameter("@IN_USER_NAME", DbType.String, userName),
                _db!.CreateOutParameter("@OUT_CREATED_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
            var dbValue = _db!.StoredProcedure("T_BUKKEN_INSERT", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                createdCD = (output["@OUT_CREATED_CD"] == DBNull.Value ? -1 : Convert.ToInt32(output["@OUT_CREATED_CD"]));
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

    public string? Update(int? userCD, string? userName, BukkenUpdate payload)
    {
        Dictionary<string, object>? output = null;
        string? error = null;
        try
        {
            var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_BUKKEN_CD", DbType.Int32, payload.bukken_cd),
                _db!.CreateInParameter("@IN_DOCUMENT_CLASS_FLG", DbType.Int32, payload.documentClassFlg),
                _db!.CreateInParameter("@IN_DOCUMENT_TYPE_CD", DbType.Int32, payload.documentTypeCD),
                _db!.CreateInParameter("@IN_BUKKEN_NAME", DbType.String, payload.bukken_name),
                _db!.CreateInParameter("@IN_DOCUMENT_DETAILS_CD", DbType.Int32, payload.documentDetailsCD),
                _db!.CreateInParameter("@IN_DOCUMENT_MEDIA_CD", DbType.Int32, payload.documentMediaCD),
                _db!.CreateInParameter("@IN_COMPANY_TYPE_FLG", DbType.Int32, payload.companyTypeFlg),
                _db!.CreateInParameter("@IN_RELATED_DOCUMENT", DbType.String, payload.relatedDocument),
                _db!.CreateInParameter("@IN_TERMINATED_DOCUMENT", DbType.String, payload.terminatedDocument),
                _db!.CreateInParameter("@IN_BRANCH_NAME", DbType.String, payload.branchName),
                _db!.CreateInParameter("@IN_DIVISION_NAME", DbType.String, payload.divisionName),
                _db!.CreateInParameter("@IN_GROUP_TYPE_FLG", DbType.Int32, payload.groupTypeFlg),
                _db!.CreateInParameter("@IN_COMPANY_NAME", DbType.String, payload.companyName),
                _db!.CreateInParameter("@IN_CREATE_DATE", DbType.DateTime, payload.create_date),
                _db!.CreateInParameter("@IN_CONTRACT_START", DbType.String, payload.contract_start),
                _db!.CreateInParameter("@IN_CONTRACT_END", DbType.String, payload.contract_end),
                _db!.CreateInParameter("@IN_B_CHAREACTERS", DbType.String, payload.b_characters),
                _db!.CreateInParameter("@IN_REMARKS", DbType.String, payload.remarks),
                _db!.CreateInParameter("@IN_STORAGE_ID", DbType.String, payload.storage_id),
                _db!.CreateInParameter("@IN_KNUMBER", DbType.String, payload.knumber),
                _db!.CreateInParameter("@IN_AMOUNT", DbType.Int32, payload.amount),
                _db!.CreateInParameter("@IN_TANTO_NAME", DbType.String, payload.tanto_name),
                _db!.CreateInParameter("@IN_UNIT_CD", DbType.Int32, payload.unitCD),
                _db!.CreateInParameter("@IN_DIMG_REGISTERED_FLG", DbType.Int32, payload.dimgRegisteredFlg),
                _db!.CreateInParameter("@IN_USER_CD", DbType.Int32, userCD),
                _db!.CreateInParameter("@IN_USER_NAME", DbType.String, userName),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
            var dbValue = _db!.StoredProcedure("T_BUKKEN_UPDATE", parameters, out output);
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

    public string? SetDimg(int? userCD, string? userName, BukkenSetDimg payload)
    {
        Dictionary<string, object>? output = null;
        string? error = null;
        try
        {
            var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_BUKKEN_CD", DbType.Int32, payload.bukken_cd),
                _db!.CreateInParameter("@IN_STORAGE_ID", DbType.String, payload.storage_id),
                _db!.CreateInParameter("@IN_DIMG_REGISTERED_FLG", DbType.Int32, payload.dimgRegisteredFlg),
                _db!.CreateInParameter("@IN_USER_CD", DbType.Int32, userCD),
                _db!.CreateInParameter("@IN_USER_NAME", DbType.String, userName),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
            var dbValue = _db!.StoredProcedure("T_BUKKEN_SET_DIMG", parameters, out output);
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

    public (int? rowsNumber, List<T_Bukken_List>? data) GetListData(string? userCD, string? bukken_name, string? document_type, string? start_date, string? end_date,Boolean isDIMGRegistration,int? page, int? pageSize, string? sortField, string? sortOrder)
    {
        (int? rowsNumber, List<T_Bukken_List>? data) result = (rowsNumber: 0, data: null);

        Dictionary<string, object>? output = null;
        var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_USER_CD", DbType.String, userCD),
                _db!.CreateInParameter("@IN_BUKKEN_NAME", DbType.String, bukken_name),
                _db!.CreateInParameter("@IN_DOCUMENT_TYPE", DbType.String, document_type),
                _db!.CreateInParameter("@IN_START_DATE", DbType.String, start_date),
                _db!.CreateInParameter("@IN_END_DATE", DbType.String, end_date),
                _db!.CreateInParameter("@IN_IS_DIMG_REGISTRATION", DbType.String, isDIMGRegistration == true ? "1" : "0"),
                _db!.CreateInParameter("@IN_page", DbType.String, page),
                _db!.CreateInParameter("@IN_pageSize", DbType.String, pageSize),
                _db!.CreateInParameter("@IN_sortField", DbType.String, sortField),
                _db!.CreateInParameter("@IN_sortOrder", DbType.String, sortOrder),

                _db!.CreateOutParameter("@OUT_totalRow", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
        try
        {
            var dbValue = _db!.StoredProcedure("T_BUKKEN_GET_LIST", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                result.rowsNumber = (output["@OUT_totalRow"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_totalRow"]));
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));
                if (err_cd == 0)
                {
                    result.data = ((BipVnDbResult)dbValue).ToList<T_Bukken_List>();
                }
            }
            else
                throw (Exception)dbValue!;
        }
        catch
        {
            throw;


        }
        return result;
    }

    public T_Bukken? GetData(string bukken_cd)
    {
        Dictionary<string, object>? output = null;

        var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_BUKKEN_CD", DbType.Int32, bukken_cd),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
        try
        {
            var dbValue = _db!.StoredProcedure("T_BUKKEN_GET", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));
                if (err_cd == 0)
                {
                    return ((BipVnDbResult)dbValue).FirstOrDefault<T_Bukken>();
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
