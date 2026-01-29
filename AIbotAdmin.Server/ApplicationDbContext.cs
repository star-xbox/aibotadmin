using AIbotAdmin.Server.Models;
using Azure.Storage.Blobs;
using Microsoft.EntityFrameworkCore;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace AIbotAdmin.Server;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> contextOptions) : base(contextOptions) { }

    public DbSet<T_BlobComment> T_BlobComments => Set<T_BlobComment>();
    public DbSet<T_ActionLog> T_ActionLogs => Set<T_ActionLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<T_BlobComment>(e =>
        {
            e.ToTable("T_BlobComments");
            e.HasKey(x => x.Id);
            e.Property(x => x.TargetPath).HasMaxLength(1024).IsRequired();
            e.Property(x => x.Comment).HasMaxLength(2000);

            e.HasIndex(x => new { x.TargetType, x.TargetPath }).IsUnique();
        });
    }

}
