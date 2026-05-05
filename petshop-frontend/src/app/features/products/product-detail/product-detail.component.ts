import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DatePipe } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ReviewService } from '../../../core/services/review.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { Product } from '../../../core/models/product.models';
import { ProductReviewSummary } from '../../../core/models/review.models';
import { StarRatingComponent } from '../../../shared/star-rating/star-rating.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatChipsModule, MatDividerModule, MatFormFieldModule,
    MatInputModule, StarRatingComponent, AsyncPipe],
  template: `
    <div class="spinner-wrap" *ngIf="isLoading"><mat-spinner></mat-spinner></div>

    <div class="not-found" *ngIf="!isLoading && !product">
      <mat-icon class="big-icon">search_off</mat-icon>
      <h2>Product not found</h2>
      <a mat-raised-button color="primary" routerLink="/products">Back to Products</a>
    </div>

    <div class="detail-layout" *ngIf="!isLoading && product">
      <!-- Left: Image -->
      <div class="img-col">
        <img [src]="product!.imageUrl || 'https://placehold.co/500x400?text=No+Image'"
             [alt]="product!.name" class="product-img">
      </div>

      <!-- Right: Info -->
      <div class="info-col">
        <mat-chip-set>
          <mat-chip>{{ getCategoryLabel(product!.category) }}</mat-chip>
        </mat-chip-set>

        <h1 class="product-name">{{ product!.name }}</h1>
        <div class="rating-summary" *ngIf="reviewSummary && reviewSummary.totalReviews > 0">
          <app-star-rating [rating]="reviewSummary.averageRating" size="sm"></app-star-rating>
          <span class="rating-text">{{ reviewSummary.averageRating.toFixed(1) }}</span>
          <span class="rating-count">({{ reviewSummary.totalReviews }} reviews)</span>
        </div>
        <div class="price">{{ product!.price | currency:'EUR' }}</div>

        <span class="stock-badge" [class.in-stock]="product!.isAvailable"
              [class.out-stock]="!product!.isAvailable">
          {{ product!.isAvailable ? 'In Stock' : 'Out of Stock' }}
        </span>

        <mat-divider class="divider"></mat-divider>
        <p class="description">{{ product!.description }}</p>
        <mat-divider class="divider"></mat-divider>

        <div class="qty-row" *ngIf="product!.isAvailable">
          <label>Quantity:</label>
          <input type="number" [(ngModel)]="quantity"
                 [min]="1" [max]="product!.stockQuantity" class="qty-input">
          <span class="stock-hint">{{ product!.stockQuantity }} available</span>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <button mat-raised-button color="primary" class="add-btn"
            [disabled]="!product!.isAvailable || !isLoggedIn"
            (click)="addToCart()">
            <mat-icon>add_shopping_cart</mat-icon> Add to Cart
          </button>
          
          <button mat-icon-button (click)="toggleWishlist()" class="wishlist-btn"
            [class.in-wishlist]="isInWishlist" *ngIf="isLoggedIn">
            <mat-icon>{{ isInWishlist ? 'favorite' : 'favorite_border' }}</mat-icon>
          </button>
        </div>

        <p class="login-hint" *ngIf="!isLoggedIn">
          <mat-icon>info</mat-icon>
          Please <a routerLink="/auth/login">login</a> to add items to cart
        </p>

        <a mat-button routerLink="/products" class="back-link">
          <mat-icon>arrow_back</mat-icon> Back to Products
        </a>
      </div>
    </div>

    <section class="reviews-section" *ngIf="!isLoading && product">
      <h2 class="reviews-title">Customer Reviews</h2>
      
      <!-- Write review (only if logged in, purchased, not yet reviewed) -->
      <div class="write-review" *ngIf="isLoggedIn && reviewSummary?.userCanReview">
        <div class="review-form-header">
          <div class="review-avatar">{{ (authSvc.currentUser$ | async)?.firstName?.[0] ?? 'U' }}</div>
          <div>
            <div class="review-form-title">Share your experience</div>
            <div class="review-form-subtitle">Your review helps other pet owners</div>
          </div>
        </div>
        
        <div class="star-select">
          <span class="star-label">Your rating:</span>
          <app-star-rating [rating]="newReview.rating" [interactive]="true" size="lg"
            (ratingChange)="newReview.rating = $event"></app-star-rating>
          <span class="rating-hint" *ngIf="newReview.rating > 0">
            {{ getRatingLabel(newReview.rating) }}
          </span>
        </div>
        
        <div class="comment-wrap">
          <textarea class="review-textarea" [(ngModel)]="newReview.comment" 
            rows="4" maxlength="1000"
            placeholder="What did you love about this product? How does your pet like it?">
          </textarea>
          <div class="char-count">{{ newReview.comment.length }}/1000</div>
        </div>
        
        <button class="submit-review-btn"
          (click)="submitReview()" [disabled]="isSubmittingReview">
          <mat-icon *ngIf="!isSubmittingReview">send</mat-icon>
          <span *ngIf="isSubmittingReview" style="display:inline-flex;align-items:center;gap:6px">⏳ Submitting...</span>
          {{ isSubmittingReview ? '' : 'Publish Review' }}
        </button>
      </div>

      <div class="review-pending" *ngIf="reviewSubmittedPending">
        <mat-icon>schedule</mat-icon>
        Your review has been submitted and is pending admin approval. Thank you for your feedback!
      </div>

      <div class="already-reviewed" *ngIf="isLoggedIn && reviewSummary?.userHasReviewed && !reviewSummary?.userCanReview && !reviewSubmittedPending">
        <mat-icon>check_circle</mat-icon> You have already reviewed this product.
      </div>

      <!-- Review list -->
      <div class="review-list">
        <div class="review-card" *ngFor="let r of reviewSummary?.reviews">
          <div class="review-header">
            <div class="reviewer-avatar">{{ r.userName[0] }}</div>
            <div class="reviewer-info">
              <span class="reviewer-name">{{ r.userName }}</span>
              <span class="review-date">{{ r.createdAt | date:'dd MMM yyyy' }}</span>
            </div>
            <app-star-rating [rating]="r.rating" size="sm"></app-star-rating>
            <button mat-icon-button color="warn" *ngIf="isAdmin || currentUserId === r.userId"
              (click)="deleteReview(r.id)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          <p class="review-comment">{{ r.comment }}</p>
        </div>
        <div class="no-reviews" *ngIf="reviewSummary?.reviews?.length === 0">
          <mat-icon>rate_review</mat-icon>
          <p>No reviews yet. Be the first to review!</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .spinner-wrap { display:flex; justify-content:center; padding:80px; }
    .not-found { text-align:center; padding:80px; color:#9e9e9e; }
    .big-icon { font-size:64px; width:64px; height:64px; }
    .detail-layout { display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:start; }
    .product-img { width:100%; border-radius:12px; object-fit:cover; max-height:450px; }
    .product-name { font-size:2rem; font-weight:700; margin:12px 0; }
    .price { font-size:2rem; font-weight:800; color:#f57c00; margin-bottom:12px; }
    .stock-badge { padding:4px 14px; border-radius:20px; font-size:.85rem; font-weight:600; }
    .in-stock  { background:#e8f5e9; color:#2e7d32; }
    .out-stock { background:#ffebee; color:#c62828; }
    .divider { margin:20px 0; }
    .description { color:#555; line-height:1.7; font-size:1rem; }
    .qty-row { display:flex; align-items:center; gap:16px; margin:16px 0; }
    .qty-input { width:70px; border:1px solid #ccc; border-radius:6px;
      padding:8px; font-size:1rem; text-align:center; }
    .stock-hint { color:#888; font-size:.85rem; }
    .add-btn { width:100%; height:48px; font-size:1rem; margin:8px 0; }
    .login-hint { display:flex; align-items:center; gap:6px; color:#888; font-size:.9rem; }
    .back-link { margin-top:8px; }
    
    .wishlist-btn { color: #9ca3af; transition: all .2s; }
    .wishlist-btn.in-wishlist { color: #ef4444; }
    .wishlist-btn:hover { transform: scale(1.1); }
    .rating-summary { display:flex; align-items:center; gap:8px; margin:8px 0; }
    .rating-text { font-weight:700; color:#f59e0b; }
    .rating-count { color:#9ca3af; font-size:.9rem; }
    .reviews-section { margin-top:48px; border-top:2px solid #f0e6d3; padding-top:32px; }
    .reviews-title { font-size:1.5rem; font-weight:800; margin-bottom:24px; }
    .write-review { background:#fff8f0; border-radius:16px; padding:24px; margin-bottom:24px; border:1px solid #f0e6d3; }
    .review-form-header { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
    .review-avatar { width:44px; height:44px; border-radius:50%;
      background:linear-gradient(135deg,#f57c00,#e65100); color:white;
      display:flex; align-items:center; justify-content:center;
      font-weight:700; font-size:1.1rem; flex-shrink:0; }
    .review-form-title { font-weight:700; font-size:1rem; }
    .review-form-subtitle { font-size:.8rem; color:#9ca3af; }
    .star-select { display:flex; align-items:center; gap:12px; margin-bottom:16px;
      padding:12px 16px; background:white; border-radius:12px; border:1px solid #f0e6d3; }
    .star-label { font-size:.9rem; font-weight:600; color:#374151; }
    .rating-hint { font-size:.9rem; font-weight:600; color:#f57c00; }
    .comment-wrap { position:relative; margin-bottom:16px; }
    .review-textarea {
      width:100%; border:1.5px solid #f0e6d3; border-radius:12px;
      padding:14px 16px; font-size:.95rem; font-family:inherit;
      resize:vertical; outline:none; transition:border-color .2s;
      background:#fffbf5; box-sizing:border-box;
    }
    .review-textarea:focus { border-color:#f57c00; background:white; }
    .char-count { text-align:right; font-size:.75rem; color:#9ca3af; margin-top:4px; }
    .submit-review-btn {
      display:flex; align-items:center; gap:8px; justify-content:center;
      padding:12px 28px; border-radius:12px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#f57c00,#e65100); color:white;
      font-size:.95rem; font-weight:700; font-family:inherit;
      box-shadow:0 4px 16px rgba(245,124,0,.35); transition:all .2s;
    }
    .submit-review-btn:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(245,124,0,.45); }
    .submit-review-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
    .full-width { width: 100%; }
    .review-pending { display:flex; align-items:center; gap:8px; color:#92400e; background:#fff3e0; padding:12px 16px; border-radius:10px; margin-bottom:16px; border:1px solid #fed7aa; }
    .already-reviewed { display:flex; align-items:center; gap:8px; color:#2e7d32; background:#f0fdf4; padding:12px 16px; border-radius:10px; margin-bottom:16px; }
    .review-card { background:white; border-radius:12px; border:1px solid #f0e6d3; padding:16px; margin-bottom:12px; }
    .review-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .reviewer-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#f57c00,#e65100); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.85rem; flex-shrink:0; }
    .reviewer-info { flex:1; }
    .reviewer-name { font-weight:700; display:block; }
    .review-date { font-size:.8rem; color:#9ca3af; }
    .review-comment { color:#374151; line-height:1.6; margin:0; }
    .no-reviews { text-align:center; padding:32px; color:#9ca3af; }
    @media(max-width:768px) {
      .detail-layout { grid-template-columns:1fr; gap:24px; }
      .product-img { max-height:280px; }
      .product-name { font-size:1.5rem; }
      .price { font-size:1.5rem; }
      .reviews-section { margin-top:32px; }
      .write-review { padding:16px; }
    }
  `]
})
export default class ProductDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  product: Product | null = null;
  isLoading = true;
  isLoggedIn = false;
  quantity = 1;
  
  reviewSummary: ProductReviewSummary | null = null;
  isInWishlist = false;
  newReview = { rating: 0, comment: '' };
  isSubmittingReview = false;
  reviewSubmittedPending = false;

  get currentUserId(): string | null { return this.authSvc.currentUser$.value?.id ?? null; }
  get isAdmin(): boolean { return this.authSvc.currentUser$.value?.role === 'Admin'; }

  private categoryLabels: Record<number, string> = {
    0:'Dogs',1:'Cats',2:'Birds',3:'Fish',4:'Reptiles',
    5:'Small Animals',6:'Food',7:'Toys',8:'Accessories',9:'Healthcare'
  };

  constructor(
    private route: ActivatedRoute,
    private productSvc: ProductService,
    private cartSvc: CartService,
    public authSvc: AuthService,
    private reviewSvc: ReviewService,
    private wishlistSvc: WishlistService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.authSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(v => this.isLoggedIn = v);
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productSvc.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: p  => { 
        this.product = p; 
        this.isLoading = false; 
        this.loadReviews();
        if (this.isLoggedIn) {
          this.wishlistSvc.checkWishlist(id).pipe(takeUntil(this.destroy$)).subscribe({
            next: r => this.isInWishlist = r.isInWishlist,
            error: () => {} // silently fail
          });
        }
      },
      error: () => { this.product = null; this.isLoading = false; },
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  addToCart(): void {
    if (!this.product) return;
    this.cartSvc.addItem({ productId: this.product.id, quantity: this.quantity }).subscribe({
      next: () => this.notify.showSuccess(`"${this.product!.name}" added to cart!`),
    });
  }

  getCategoryLabel(cat: number): string {
    return this.categoryLabels[cat] ?? 'Other';
  }

  getRatingLabel(rating: number): string {
    const labels: Record<number, string> = {
      1: '😞 Poor', 2: '😕 Fair', 3: '😊 Good',
      4: '😄 Very Good', 5: '🤩 Excellent!'
    };
    return labels[rating] ?? '';
  }

  loadReviews(): void {
    if (!this.product) return;
    this.reviewSvc.getReviews(this.product.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: s => this.reviewSummary = s,
      error: () => {} // silently fail
    });
  }

  toggleWishlist(): void {
    if (!this.product) return;
    if (this.isInWishlist) {
      this.wishlistSvc.removeFromWishlist(this.product.id).subscribe(() => {
        this.isInWishlist = false;
        this.notify.showSuccess('Removed from wishlist');
      });
    } else {
      this.wishlistSvc.addToWishlist(this.product.id).subscribe(() => {
        this.isInWishlist = true;
        this.notify.showSuccess('Added to wishlist');
      });
    }
  }

  submitReview(): void {
    if (!this.product) return;
    if (!this.newReview.rating) {
      this.notify.showError('Please select a rating');
      return;
    }
    if (!this.newReview.comment.trim()) {
      this.notify.showError('Please write a comment');
      return;
    }
    
    this.isSubmittingReview = true;
    this.reviewSvc.createReview(this.product.id, this.newReview).subscribe({
      next: () => {
        this.loadReviews();
        this.newReview = { rating: 0, comment: '' };
        this.reviewSubmittedPending = true;
        this.notify.showSuccess('Review submitted and pending approval!');
        this.isSubmittingReview = false;
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.title || 'Failed to submit review';
        this.notify.showError(msg);
        this.isSubmittingReview = false;
      }
    });
  }

  deleteReview(reviewId: string): void {
    if (!this.product || !window.confirm('Delete this review?')) return;
    this.reviewSvc.deleteReview(this.product.id, reviewId).subscribe({
      next: () => {
        this.loadReviews();
        this.notify.showSuccess('Review deleted');
      }
    });
  }
}
