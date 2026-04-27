export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  productPrice: number;
  productIsAvailable: boolean;
  addedAt: string;
}
