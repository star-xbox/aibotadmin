// Controllers/AdminUserController.cs
using AIbotAdmin.Server.Common;
using AIbotAdmin.Server.Models;
using AIbotAdmin.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AIbotAdmin.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/admin-user")]
public class AdminUserController : Controller
{
    private readonly ILogger _logger;
    private readonly IAdminUserService _service;
    private readonly IConfiguration _config;
    private readonly ISignManager SignInManager;

    public AdminUserController(ILogger<AdminUserController> logger, IAdminUserService service, IConfiguration config)
    {
        _logger = logger;
        _service = service;
        _config = config;
        SignInManager = new AppSignInManager(_config);
    }

    // GET: api/admin-user
    [HttpGet()]
    public IActionResult GetAdminUsersPaged(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string? search = null,
    [FromQuery] int? loginType = null,
    [FromQuery] string? adminUserKengen = null,
    [FromQuery] string? sortColumn = "AdminUserCD",
    [FromQuery] string? sortDirection = "ASC")
    {
        try
        {
            if (!User.Identity?.IsAuthenticated ?? true)
                return Unauthorized();

            var request = new PagedRequest
            {
                PageNumber = page,
                PageSize = pageSize,
                SearchTerm = search,
                LoginType = loginType,
                AdminUserKengen = adminUserKengen,
                SortColumn = sortColumn,
                SortDirection = sortDirection
            };

            var result = _service.GetList(request);
            if (result == null)
            {
                return NotFound(new { message = "No users found" });
            }

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber = result.PageNumber,
                pageSize = result.PageSize,
                totalPages = result.TotalPages,
                hasPrevious = result.HasPrevious,
                hasNext = result.HasNext
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged admin users");
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    // GET: api/admin-user/{id}
    [HttpGet("{id}")]
    public IActionResult GetAdminUser(int id)
    {
        try
        {
            if (!User.Identity?.IsAuthenticated ?? true)
                return Unauthorized();

            var users = _service.GetList(new PagedRequest
            {
                PageNumber = 1,
                PageSize = int.MaxValue
            });

            if (users == null || users.Items == null)
            {
                return NotFound(new { message = $"User with ID {id} not found" });
            }

            var user = users.Items.FirstOrDefault(u => u.AdminUserCD == id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} not found" });
            }
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting admin user {id}");
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    // POST: api/admin-user
    [HttpPost]
    public async Task<IActionResult> CreateAdminUser([FromBody] AdminUserCreateRequest request)
    {
        try
        {
            if (!User.Identity?.IsAuthenticated ?? true)
                return Unauthorized();

            if (request == null)
                return BadRequest(new { message = "User data is required" });
            string? login_api_hash = _config.GetSection("Security:login_api_hash").Get<string>();

            //string pass = Utils.GetSha256Hash("PrOper-tY_1" + request.Password);

            // Basic validation
            if (string.IsNullOrWhiteSpace(request.LoginID))
                return BadRequest(new { message = "Login ID is required" });

            int? adminUserCD = null;
            string? adminUserName = null;
            M_AdminUser? userLogin = SignInManager.UserData(HttpContext);
            if (userLogin != null)
            {
                adminUserCD = userLogin.AdminUserCD;
                adminUserName = userLogin.AdminUserName;
            }

            var createdUser = await _service.Create(request, adminUserCD, adminUserName);

            if (createdUser == null)
                return StatusCode(500, new { message = "Failed to create user" });

            return CreatedAtAction(nameof(GetAdminUser), new { id = createdUser.AdminUserCD }, createdUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating admin user");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // PUT: api/admin-user/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAdminUser(int id, [FromBody] AdminUserUpdateRequest request)
    {
        try
        {
            if (!User.Identity?.IsAuthenticated ?? true)
                return Unauthorized();

            if (request == null)
                return BadRequest(new { message = "User data is required" });

            int? adminUserCD = null;
            string? adminUserName = null;
            M_AdminUser? userLogin = SignInManager.UserData(HttpContext);
            if (userLogin != null)
            {
                adminUserCD = userLogin.AdminUserCD;
                adminUserName = userLogin.AdminUserName;
            }

            var success = await _service.Update(id, request, adminUserCD, adminUserName);

            if (!success)
                return StatusCode(500, new { message = "Failed to update user" });

            return Ok(new { message = "User updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating admin user {id}");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // DELETE: api/admin-user/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAdminUser(int id)
    {
        try
        {
            if (!User.Identity?.IsAuthenticated ?? true)
                return Unauthorized();

            int? adminUserCD = null;
            string? adminUserName = null;
            M_AdminUser? userLogin = SignInManager.UserData(HttpContext);
            if (userLogin != null)
            {
                adminUserCD = userLogin.AdminUserCD;
                adminUserName = userLogin.AdminUserName;
            }
            var success = await _service.Delete(id, adminUserCD, adminUserName);

            if (!success)
                return StatusCode(500, new { message = "Failed to delete user" });

            return Ok(new { message = "User deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting admin user {id}");
            return StatusCode(500, new { message = ex.Message });
        }
    }

}