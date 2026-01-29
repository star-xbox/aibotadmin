using BipVnDataBase;
using AIbotAdmin.Server.Models;
using System.Data;

namespace AIbotAdmin.Server.Services;

public interface IUserService
{
    UserListResponse GetList(UserQueryParams queryParams);
    Task<M_User?> Create(M_User payload);
}

public class UserService : IUserService
{
    private readonly BipVnDb? _db;
    private readonly ILogger<UserService> _logger;

    public UserService(IDbService dbService, ILogger<UserService> logger)
    {
        _db = dbService.CurrentDb();
        _logger = logger;
    }

    public UserListResponse GetList(UserQueryParams queryParams)
    {
        try
        {
            var parameters = new List<IDbDataParameter>
            {
                _db!.CreateInParameter("@PageNumber", DbType.Int32, queryParams.PageNumber),
                _db!.CreateInParameter("@PageSize", DbType.Int32, queryParams.PageSize),
                _db!.CreateInParameter("@SearchTerm", DbType.String,
                    string.IsNullOrWhiteSpace(queryParams.SearchTerm) ? DBNull.Value : queryParams.SearchTerm),
                _db!.CreateInParameter("@ProviderFilter", DbType.String,
                    string.IsNullOrWhiteSpace(queryParams.ProviderFilter) ? DBNull.Value : queryParams.ProviderFilter),
                _db!.CreateInParameter("@StatusFilter", DbType.Int32,
                    queryParams.StatusFilter.HasValue ? (object)queryParams.StatusFilter.Value : DBNull.Value),
                _db!.CreateInParameter("@SortColumn", DbType.String,
                    string.IsNullOrWhiteSpace(queryParams.SortColumn) ? "UserCD" : queryParams.SortColumn),
                _db!.CreateInParameter("@SortDirection", DbType.String,
                    string.IsNullOrWhiteSpace(queryParams.SortDirection) ? "ASC" : queryParams.SortDirection.ToUpper()),
                _db!.CreateOutParameter("@OUT_TOTAL_COUNT", DbType.Int32),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 4000)
            };

            _logger.LogInformation("Executing M_User_Get_List with params: PageNumber={PageNumber}, PageSize={PageSize}, SearchTerm={SearchTerm}, StatusFilter={StatusFilter}",
                queryParams.PageNumber, queryParams.PageSize, queryParams.SearchTerm, queryParams.StatusFilter);

            var dbValue = _db!.StoredProcedure("M_User_Get_List", parameters, out var output);

            _logger.LogInformation("dbValue type: {Type}, IsNull: {IsNull}",
                dbValue?.GetType()?.Name ?? "null",
                dbValue == null || dbValue == DBNull.Value);

            int errCd = output.ContainsKey("@OUT_ERR_CD") && output["@OUT_ERR_CD"] != DBNull.Value
                ? Convert.ToInt32(output["@OUT_ERR_CD"])
                : 0;

            string? errMsg = output.ContainsKey("@OUT_ERR_MSG") && output["@OUT_ERR_MSG"] != DBNull.Value
                ? Convert.ToString(output["@OUT_ERR_MSG"])
                : null;

            if (errCd != 0)
            {
                _logger.LogError("Database error {ErrorCode}: {ErrorMessage}", errCd, errMsg);
                throw new Exception($"Database error {errCd}: {errMsg}");
            }

            int totalCount = output.ContainsKey("@OUT_TOTAL_COUNT") && output["@OUT_TOTAL_COUNT"] != DBNull.Value
                ? Convert.ToInt32(output["@OUT_TOTAL_COUNT"])
                : 0;

            _logger.LogInformation("TotalCount from output: {TotalCount}", totalCount);

            List<M_User> users = new List<M_User>();

            if (dbValue != null && dbValue != DBNull.Value)
            {
                var dbValueTypeName = dbValue.GetType().Name;
                _logger.LogInformation("Processing dbValue of type: {TypeName}", dbValueTypeName);

                if (dbValueTypeName == "BipVnDbResult")
                {
                    try
                    {
                        users = ((BipVnDbResult)dbValue).ToList<M_User>() ?? new List<M_User>();
                        _logger.LogInformation("Successfully converted to List<M_User>, Count: {Count}", users.Count);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error converting BipVnDbResult to List<M_User>");
                        users = new List<M_User>();
                    }
                }
                else
                {
                    _logger.LogWarning("Unexpected dbValue type: {TypeName}. Expected: BipVnDbResult", dbValueTypeName);

                }
            }
            else
            {
                _logger.LogWarning("dbValue is null or DBNull. TotalCount: {TotalCount}", totalCount);
            }

            var totalPages = queryParams.PageSize > 0
                ? (int)Math.Ceiling((double)totalCount / queryParams.PageSize)
                : 0;

            var response = new UserListResponse
            {
                Users = users,
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize,
                TotalPages = totalPages
            };

            _logger.LogInformation("Returning response: Users={UsersCount}, TotalCount={TotalCount}, TotalPages={TotalPages}",
                users.Count, totalCount, totalPages);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user list. InnerException: {InnerException}",
                ex.InnerException?.Message ?? "None");
            throw new Exception($"Error getting user list: {ex.Message}", ex);
        }
    }

    public async Task<M_User?> Create(M_User payload)
    {
        try
        {
            _logger.LogInformation("Creating user with LoginName: {LoginName}", payload.LoginName);

            return await Task.FromResult(new M_User
            {
                UserCD = 1,
                LoginName = payload.LoginName,
                DisplayName = payload.DisplayName,
                EmailAddress = payload.EmailAddress,
                Provider = payload.Provider ?? "Microsoft",
                DeleteFlg = 0,
                CreatedAt = DateTime.Now
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            throw;
        }
    }
}