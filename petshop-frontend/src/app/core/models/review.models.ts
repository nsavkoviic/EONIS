export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
  userHasReviewed: boolean;
  userCanReview: boolean;
}
