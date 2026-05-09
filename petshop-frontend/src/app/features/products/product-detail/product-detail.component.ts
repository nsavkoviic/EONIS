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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatChipsModule, MatDividerModule, MatFormFieldModule,
    MatInputModule, StarRatingComponent, AsyncPipe, TranslateModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
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
    private notify: NotificationService,
    private translate: TranslateService
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
      next: () => this.notify.showSuccess(this.translate.instant('TOAST.ADDED_TO_CART')),
    });
  }

  getCategoryLabel(cat: number): string {
    return this.categoryLabels[cat] ?? 'Other';
  }

  getRatingLabel(rating: number): string {
    const labels: Record<number, string> = {
      1: '😞 ' + this.translate.instant('PRODUCT_DETAIL.RATING_1'), 
      2: '😕 ' + this.translate.instant('PRODUCT_DETAIL.RATING_2'), 
      3: '😊 ' + this.translate.instant('PRODUCT_DETAIL.RATING_3'),
      4: '😄 ' + this.translate.instant('PRODUCT_DETAIL.RATING_4'), 
      5: '🤩 ' + this.translate.instant('PRODUCT_DETAIL.RATING_5')
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
        this.notify.showSuccess(this.translate.instant('TOAST.REMOVED_FROM_WISHLIST'));
      });
    } else {
      this.wishlistSvc.addToWishlist(this.product.id).subscribe(() => {
        this.isInWishlist = true;
        this.notify.showSuccess(this.translate.instant('TOAST.ADDED_TO_WISHLIST'));
      });
    }
  }

  submitReview(): void {
    if (!this.product) return;
    if (!this.newReview.rating) {
      this.notify.showError(this.translate.instant('TOAST.ERROR_GENERIC'));
      return;
    }
    if (!this.newReview.comment.trim()) {
      this.notify.showError(this.translate.instant('TOAST.ERROR_GENERIC'));
      return;
    }
    
    this.isSubmittingReview = true;
    this.reviewSvc.createReview(this.product.id, this.newReview).subscribe({
      next: () => {
        this.loadReviews();
        this.newReview = { rating: 0, comment: '' };
        this.reviewSubmittedPending = true;
        this.notify.showSuccess(this.translate.instant('TOAST.REVIEW_SUBMITTED'));
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
        this.notify.showSuccess(this.translate.instant('TOAST.REVIEW_REJECTED'));
      }
    });
  }
}
