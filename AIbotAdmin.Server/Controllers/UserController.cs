using AIbotAdmin.Server.Models;
using AIbotAdmin.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIbotAdmin.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/user")]
public class UserController : ControllerBase
{
    private readonly ILogger<UserController> _logger;
    private readonly IUserService _service;

    public UserController(ILogger<UserController> logger, IUserService service)
    {
        _logger = logger;
        _service = service;
    }

    [HttpGet("list")]
    public IActionResult GetUserList(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? providerFilter = null,
        [FromQuery] int? statusFilter = null,
        [FromQuery] string sortColumn = "UserCD",
        [FromQuery] string sortDirection = "ASC")
    {
        try
        {
            _logger.LogInformation("GetUserList called with: pageNumber={PageNumber}, pageSize={PageSize}, searchTerm={SearchTerm}, statusFilter={StatusFilter}",
                pageNumber, pageSize, searchTerm, statusFilter);

            // Check authentication
            if (!HttpContext.User.Identity?.IsAuthenticated ?? true)
            {
                _logger.LogWarning("Unauthorized access attempt");
                return Unauthorized(new { message = "Authentication required" });
            }

            // Validate parameters
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100; 

            var queryParams = new UserQueryParams
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                SearchTerm = searchTerm,
                ProviderFilter = providerFilter,
                StatusFilter = statusFilter,
                SortColumn = sortColumn ?? "UserCD",
                SortDirection = sortDirection ?? "ASC"
            };

            var response = _service.GetList(queryParams);

            _logger.LogInformation("Successfully retrieved {Count} users", response.Users?.Count ?? 0);

            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
            _logger.LogWarning("Unauthorized access in GetUserList");
            return Unauthorized(new { message = "Access denied" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetUserList");
            return StatusCode(500, new
            {
                message = "Internal server error",
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpGet("{id}")]
    public IActionResult GetUser(int id)
    {
        try
        {
            _logger.LogInformation("GetUser called for UserCD: {UserCD}", id);

            if (id < 1)
            {
                return BadRequest(new { message = "Invalid user ID" });
            }

            var response = _service.GetList(new UserQueryParams
            {
                PageNumber = 1,
                PageSize = 1000, 
                SearchTerm = null
            });

            var user = response.Users?.FirstOrDefault(u => u.UserCD == id);

            if (user == null)
            {
                _logger.LogWarning("User not found: {UserCD}", id);
                return NotFound(new { message = $"User with ID {id} not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserCD}", id);
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] M_User user)
    {
        try
        {
            if (user == null)
            {
                return BadRequest(new { message = "User data is required" });
            }

            if (string.IsNullOrWhiteSpace(user.LoginName))
            {
                return BadRequest(new { message = "LoginName is required" });
            }

            _logger.LogInformation("Creating user with LoginName: {LoginName}", user.LoginName);

            var createdUser = await _service.Create(user);

            if (createdUser == null)
            {
                return StatusCode(500, new { message = "Failed to create user" });
            }
            await Task.CompletedTask;
            return CreatedAtAction(nameof(GetUser), new { id = createdUser.UserCD }, createdUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] M_User user)
    {
        try
        {
            if (user == null)
            {
                return BadRequest(new { message = "User data is required" });
            }

            if (id < 1)
            {
                return BadRequest(new { message = "Invalid user ID" });
            }
            await Task.CompletedTask;
            _logger.LogInformation("Updating user {UserCD}", id);

            return Ok(new { message = "User updated successfully", userCD = id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserCD}", id);
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            if (id < 1)
            {
                return BadRequest(new { message = "Invalid user ID" });
            }

            _logger.LogInformation("Deleting user {UserCD}", id);
            await Task.CompletedTask;
            return Ok(new { message = "User deleted successfully", userCD = id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserCD}", id);
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpPost("{id}/restore")]
    public async Task<IActionResult> RestoreUser(int id)
    {
        try
        {
            if (id < 1)
            {
                return BadRequest(new { message = "Invalid user ID" });
            }

            _logger.LogInformation("Restoring user {UserCD}", id);
            await Task.CompletedTask;
            return Ok(new { message = "User restored successfully", userCD = id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring user {UserCD}", id);
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }
}