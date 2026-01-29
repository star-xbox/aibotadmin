using AIbotAdmin.Server.Common;
using AIbotAdmin.Server.Models;
using BipVnDataBase;
using System.Data;

namespace AIbotAdmin.Server.Services;

public interface IAdminUserService
{
    M_AdminUser? Login(LoginModel model);
    PagedResult<M_AdminUser>? GetList(PagedRequest request);
    Task<M_AdminUser?> Create(AdminUserCreateRequest request, int? createUserCD, string? createUsername);
    Task<bool> Update(int adminUserCD, AdminUserUpdateRequest request, int? modifyUserCD, string modifyUserName);
    Task<bool> Delete(int adminUserCD, int? modifyUserCD, string? modifyUserName);
}
public class AdminUserService : IAdminUserService
{
    BipVnDb? _db;
    public AdminUserService(IDbService dbService)
    {
        _db = dbService.CurrentDb();
    }

    public M_AdminUser? Login(LoginModel model)
    {
        Dictionary<string, object>? output = null;

        var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_LOGIN_ID", DbType.String, model.LoginId),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };
        try
        {
            var dbValue = _db!.StoredProcedure("M_AdminUser_Login", parameters, out output);
            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));
                if (err_cd == 0)
                {
                    return ((BipVnDbResult)dbValue).FirstOrDefault<M_AdminUser>();
                }
                return null;
                //return new M_AdminUser
                //{
                //    UserCD = 1,
                //    UserName = "Auto Login User",
                //    LoginID = model.LoginId,
                //};
            }
            else
                throw (Exception)dbValue!;
        }
        catch
        {
            throw;
        }

    }

    public PagedResult<M_AdminUser>? GetList(PagedRequest request)
    {
        Dictionary<string, object>? output = null;

        var parameters = new List<IDbDataParameter> {
        _db!.CreateInParameter("@IN_PAGE_NUMBER", DbType.Int32, request.PageNumber),
        _db!.CreateInParameter("@IN_PAGE_SIZE", DbType.Int32, request.PageSize),
        _db!.CreateInParameter("@IN_SEARCH_TERM", DbType.String, (object?)request.SearchTerm ?? DBNull.Value),
        _db!.CreateInParameter("@IN_LOGIN_TYPE", DbType.Int32, (object?)request.LoginType ?? DBNull.Value),
        _db!.CreateInParameter("@IN_ADMIN_USER_KENGEN", DbType.String, (object?)request.AdminUserKengen ?? DBNull.Value),
        _db!.CreateInParameter("@IN_SORT_COLUMN", DbType.String, (object?)request.SortColumn ?? "AdminUserCD"),
        _db!.CreateInParameter("@IN_SORT_DIRECTION", DbType.String, (object?)request.SortDirection ?? "ASC"),
        _db!.CreateOutParameter("@OUT_TOTAL_COUNT", DbType.Int32, 10),
        _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
        _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
    };

        try
        {
            var dbValue = _db!.StoredProcedure("M_AdminUser_Get_List", parameters, out output);

            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
                string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));

                if (err_cd == 0)
                {
                    var items = ((BipVnDbResult)dbValue).ToList<M_AdminUser>();
                    int totalCount = (output["@OUT_TOTAL_COUNT"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_TOTAL_COUNT"]));

                    return new PagedResult<M_AdminUser>
                    {
                        Items = items,
                        TotalCount = totalCount,
                        PageNumber = request.PageNumber,
                        PageSize = request.PageSize
                    };
                }
                else
                {
                    throw new Exception(err_msg);
                }
            }
            else
            {
                throw (Exception)dbValue!;
            }
        }
        catch
        {
            throw;
        }
    }

    public async Task<M_AdminUser?> Create(AdminUserCreateRequest request, int? createUserCD, string? createUserName)
    {
        Dictionary<string, object>? output = null;

        // Validate cho Microsoft type (Microsoft = 1)
        if (request.LoginType == 1)
        {
            if (string.IsNullOrWhiteSpace(request.LoginID))
            {
                throw new Exception("LoginID _ Email is required for Microsoft login type");
            }
        }

        // Validate cho AdminUserKengen
        if (string.IsNullOrWhiteSpace(request.AdminUserKengen))
        {
            throw new Exception("AdminUserKengen is required");
        }

        if (string.IsNullOrWhiteSpace(request.AdminUserName))
        {
            throw new Exception("AdminUserName is required");
        }

        var parameters = new List<IDbDataParameter> {
        _db!.CreateInParameter("@IN_LOGIN_ID", DbType.String, request.LoginID),
        //_db!.CreateInParameter("@IN_PASSWORD", DbType.String, password),
        _db!.CreateInParameter("@IN_ADMIN_USER_NAME", DbType.String, request.AdminUserName),
        _db!.CreateInParameter("@IN_ADMIN_USER_KANA", DbType.String, (object?)request.AdminUserKana ?? DBNull.Value),
        _db!.CreateInParameter("@IN_LOGIN_TYPE", DbType.Int32, request.LoginType),
        _db!.CreateInParameter("@IN_ADMIN_USER_KENGEN", DbType.String, request.AdminUserKengen),
        _db!.CreateInParameter("@IN_ADMIN_USER_NAISEN", DbType.String, (object?)request.AdminUserNaisen ?? DBNull.Value),
        _db!.CreateInParameter("@IN_ADMIN_USER_MAIL", DbType.String, (object?)request.AdminUserMail ?? DBNull.Value),
        _db!.CreateInParameter("@IN_EST_NAME", DbType.String, (object?)request.EstName ?? DBNull.Value),
        _db!.CreateInParameter("@IN_KA_SOSHIKI_NAME", DbType.String, (object?)request.KaSoshikiName ?? DBNull.Value),
        _db!.CreateInParameter("@IN_CREATE_USER_CD", DbType.Int32, createUserCD),
        _db!.CreateInParameter("@IN_CREATE_USER_NAME",  DbType.String, createUserName),
        _db!.CreateOutParameter("@OUT_ADMIN_USER_CD", DbType.Int32, 10),
        _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
        _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
    };

        try
        {
            var dbValue = _db!.StoredProcedure("M_AdminUser_Create", parameters, out output);

            int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
            string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));

            if (err_cd == 0)
            {
                await Task.CompletedTask;
                int adminUserCD = (output["@OUT_ADMIN_USER_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ADMIN_USER_CD"]));
                return new M_AdminUser
                {
                    AdminUserCD = adminUserCD,
                    LoginID = request.LoginID,
                    AdminUserName = request.AdminUserName,
                    AdminUserKana = request.AdminUserKana,
                    LoginType = request.LoginType,
                    AdminUserKengen = request.AdminUserKengen,
                    AdminUserNaisen = request.AdminUserNaisen,
                    AdminUserMail = request.AdminUserMail,
                    EstName = request.EstName,
                    KaSoshikiName = request.KaSoshikiName,
                };
            }
            else
            {
                throw new Exception(err_msg);
            }
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> Update(int adminUserCD, AdminUserUpdateRequest request, int? modifyUserCD, string? modifyUserName)
    {
        Dictionary<string, object>? output = null;

        // Validate cho AdminUserKengen (REQUIRED)
        if (string.IsNullOrWhiteSpace(request.AdminUserKengen))
        {
            throw new Exception("AdminUserKengen is required");
        }

        if (string.IsNullOrWhiteSpace(request.AdminUserName))
        {
            throw new Exception("AdminUserName is required");
        }

        var parameters = new List<IDbDataParameter> {
        _db!.CreateInParameter("@IN_ADMIN_USER_CD", DbType.Int32, adminUserCD),
        _db!.CreateInParameter("@IN_ADMIN_USER_NAME", DbType.String, request.AdminUserName),
        _db!.CreateInParameter("@IN_ADMIN_USER_KANA", DbType.String, (object?)request.AdminUserKana ?? DBNull.Value),
        _db!.CreateInParameter("@IN_LOGIN_TYPE", DbType.Int32, request.LoginType),
        _db!.CreateInParameter("@IN_ADMIN_USER_KENGEN", DbType.String, request.AdminUserKengen),
        _db!.CreateInParameter("@IN_ADMIN_USER_NAISEN", DbType.String, (object?)request.AdminUserNaisen ?? DBNull.Value),
        _db!.CreateInParameter("@IN_ADMIN_USER_MAIL", DbType.String, (object?)request.AdminUserMail ?? DBNull.Value),
        _db!.CreateInParameter("@IN_EST_NAME", DbType.String, (object?)request.EstName ?? DBNull.Value),
        _db!.CreateInParameter("@IN_KA_SOSHIKI_NAME", DbType.String, (object?)request.KaSoshikiName ?? DBNull.Value),
        _db!.CreateInParameter("@IN_MODIFY_USER_CD", DbType.Int32, modifyUserCD),
        _db!.CreateInParameter("@IN_MODIFY_USER_NAME", DbType.String, modifyUserName),
        _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
        _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
    };

        try
        {
            var dbValue = _db!.StoredProcedure("M_AdminUser_Update", parameters, out output);

            int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
            string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));

            if (err_cd == 0)
            {
                await Task.CompletedTask;
                return true;
            }
            else
            {
                throw new Exception(err_msg);
            }
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> Delete(int adminUserCD, int? modifyUserCD, string? modifyUserName)
    {
        Dictionary<string, object>? output = null;

        var parameters = new List<IDbDataParameter> {
            _db!.CreateInParameter("@IN_ADMIN_USER_CD", DbType.Int32, adminUserCD),
            _db!.CreateInParameter("@IN_MODIFY_USER_CD", DbType.Int32, modifyUserCD),
            _db!.CreateInParameter("@IN_MODIFY_USER_NAME", DbType.String, modifyUserName),
            _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
            _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
        };

        try
        {
            var dbValue = _db!.StoredProcedure("M_AdminUser_Delete", parameters, out output);

            int err_cd = (output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]));
            string? err_msg = (output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]));

            if (err_cd == 0)
            {
                await Task.CompletedTask;
                return true;
            }
            else
            {
                throw new Exception(err_msg);
            }
        }
        catch
        {
            throw;
        }
    }

}
