using System.ComponentModel.DataAnnotations;

namespace AIbotAdmin.Server.Models
{
    public class M_User
    {
        [Key]
        public int UserCD { get; set; }
        public string? MicrosoftId { get; set; }
        public string? LoginName { get; set; }
        public string? DisplayName { get; set; }
        public string? EmailAddress { get; set; }
        public string? Provider { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public int DeleteFlg { get; set; }
        public DateTime CreatedAt { get; set; }

        public M_User()
        {
            DeleteFlg = 0;
            CreatedAt = DateTime.Now;
        }
    }

    public class UserQueryParams
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public string? ProviderFilter { get; set; }
        public int? StatusFilter { get; set; }
        public string? SortColumn { get; set; } = "UserCD";
        public string? SortDirection { get; set; } = "ASC";
    }

    public class UserListResponse
    {
        public List<M_User> Users { get; set; } = new List<M_User>();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }

        public UserListResponse()
        {
            Users = new List<M_User>();
        }
    }
}