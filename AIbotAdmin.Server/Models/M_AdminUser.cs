using System.ComponentModel.DataAnnotations;

namespace AIbotAdmin.Server.Models
{
    public class M_AdminUser
    {
        [Key]
        public int? AdminUserCD { get; set; }
        public int? UnitCD { get; set; }
        public string? LoginID { get; set; }
        public string? Password { get; set; }
        public int? LoginType { get; set; }
        public string? AdminUserName { get; set; }
        public string? AdminUserKana { get; set; }
        public string? AdminUserKengen { get; set; }
        public string? AdminUserTel { get; set; }
        public string? AdminUserNaisen { get; set; }
        public string? AdminUserMail { get; set; }
        public string? EstCode { get; set; }
        public string? EstName { get; set; }
        public string? OfcCode { get; set; }
        public string? OfcName { get; set; }
        public string? BuSoshikCD { get; set; }
        public string? BuSoshikName { get; set; }
        public string? KaSoshikiCD { get; set; }
        public string? KaSoshikiName { get; set; }
        public string? KanriKigyouCD { get; set; }
        public DateTime? LastAccess { get; set; }
        public int? LoginCount { get; set; }
        public int? CreateUserCD { get; set; }
        public string? CreateUserName { get; set; }
        public DateTime? CreateDate { get; set; }
        public int? ModifyUserCD { get; set; }
        public string? ModifyUserName { get; set; }
        public DateTime? ModifyDate { get; set; }
        public int? DelFlg { get; set; }
        public int? EmployeeKbn { get; set; }
        public int? RetirementKbn { get; set; }
        public int? AssetUserFlg { get; set; }
        public int? AdminUserFlg { get; set; }
        public int? DisplayOrder { get; set; }
        public int? SecondUnitCD { get; set; }
    }

    public class AdminUserCreateRequest
    {
        public string LoginID { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? AdminUserName { get; set; } = string.Empty;
        public string? AdminUserKana { get; set; }
        public int LoginType { get; set; } = 1;
        public string? AdminUserNaisen { get; set; }
        public string? AdminUserMail { get; set; }
        public string? EstName { get; set; }
        public string? KaSoshikiName { get; set; }
        public string AdminUserKengen { get; set; } = string.Empty;
    }
    public class AdminUserUpdateRequest
    {
        public string AdminUserName { get; set; } = string.Empty;
        public string? AdminUserKana { get; set; }
        public int LoginType { get; set; }
        public string? AdminUserNaisen { get; set; }
        public string? AdminUserMail { get; set; }
        public string? EstName { get; set; }
        public string? KaSoshikiName { get; set; }
        public string AdminUserKengen { get; set; } = string.Empty;
    }

    public class PagedRequest
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public int? LoginType { get; set; }
        public string? AdminUserKengen { get; set; } 
        public string? SortColumn { get; set; } = "AdminUserCD"; 
        public string? SortDirection { get; set; } = "ASC"; 
    }

}
