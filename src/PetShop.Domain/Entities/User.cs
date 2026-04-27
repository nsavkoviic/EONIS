using PetShop.Domain.Enums;

namespace PetShop.Domain.Entities;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsActive { get; set; } = true;
    public string? FavoriteAnimalTypes { get; set; }  // JSON array: "[0,1,2]"
    public string? CurrentPets { get; set; }           // JSON: "[{\"type\":0,\"name\":\"Rex\"}]"

    // Navigation properties
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public Cart? Cart { get; set; }
}
