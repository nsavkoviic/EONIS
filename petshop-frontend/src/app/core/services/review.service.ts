import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductReviewSummary, CreateReviewRequest, Review } from '../models/review.models';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getReviews(productId: string): Observable<ProductReviewSummary> {
    return this.http.get<ProductReviewSummary>(`${this.apiUrl}/${productId}/reviews`);
  }

  createReview(productId: string, dto: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/${productId}/reviews`, dto);
  }

  deleteReview(productId: string, reviewId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${productId}/reviews/${reviewId}`);
  }

  getPendingReviews(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/reviews/pending`);
  }

  approveReview(productId: string, reviewId: string): Observable<any> {
    return this.http.patch(
      `${environment.apiUrl}/products/${productId}/reviews/${reviewId}/approve`, 
      {}
    );
  }
}
