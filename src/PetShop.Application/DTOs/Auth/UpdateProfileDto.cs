namespace PetShop.Application.DTOs.Auth;

public class UpdateProfileDto
{
    public string? FirstName    { get; set; }
    public string? LastName     { get; set; }
    public string? PhoneNumber  { get; set; }
    public string? Address      { get; set; }
    public List<int>? FavoriteAnimalTypes { get; set; }
    public List<PetDto>? CurrentPets      { get; set; }
}
