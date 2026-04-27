export enum ProductCategory {
  Dogs = 0,
  Cats = 1,
  Birds = 2,
  Fish = 3,
  Reptiles = 4,
  SmallAnimals = 5,
  Food = 6,
  Toys = 7,
  Accessories = 8,
  Healthcare = 9
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
  category: ProductCategory;
  isAvailable: boolean;
  createdAt: string;
  averageRating: number;
  reviewCount: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  category: ProductCategory;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  imageUrl?: string;
  category?: ProductCategory;
  isAvailable?: boolean;
}

export interface ProductFilter {
  searchTerm?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
