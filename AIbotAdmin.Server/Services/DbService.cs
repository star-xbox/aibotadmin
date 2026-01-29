using BipVnDataBase;
using Microsoft.EntityFrameworkCore;

namespace AIbotAdmin.Server.Services;


public interface IDbService
{
    BipVnDb? CurrentDb();
}

public class DbService: IDbService
{
    BipVnDb? _db;
    public DbService(ApplicationDbContext dbContext)
    {
        _db = new BipVnDb(dbContext.Database.GetConnectionString());
    }

    public BipVnDb? CurrentDb()
    {
        return _db;
    }
}
