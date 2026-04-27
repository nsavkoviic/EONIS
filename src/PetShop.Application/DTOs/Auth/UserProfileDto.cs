namespace PetShop.Application.DTOs.Auth;

public class UserProfileDto
{
    public Guid   Id          { get; set; }
    public string FirstName   { get; set; } = string.Empty;
    public string LastName    { get; set; } = string.Empty;
    public string Email       { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address    { get; set; }
    public List<int> FavoriteAnimalTypes { get; set; } = new();
    public List<PetDto> CurrentPets      { get; set; } = new();
}

public class PetDto
{
    public int    AnimalType { get; set; }
    public string Name       { get; set; } = string.Empty;
    public string? Breed     { get; set; }
    public int?   AgeYears  { get; set; }
}
