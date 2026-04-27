import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { WishlistItem } from '../../core/models/wishlist.models';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <h1 class="page-title-warm">❤️ My Wishlist</h1>

    <div class="spinner-wrap" *ngIf="isLoading"><mat-spinner></mat-spinner></div>

    <div class="empty-state" *ngIf="!isLoading && items.length === 0">
      <mat-icon class="huge-icon">favorite_border</mat-icon>
      <h2>Your wishlist is empty</h2>
      <p>Save items you love to your wishlist to easily find them later.</p>
      <a mat-raised-button color="primary" routerLink="/products" class="explore-btn">
        Explore Products
      </a>
    </div>

    <div class="products-grid" *ngIf="!isLoading && items.length > 0">
      <div class="product-card" *ngFor="let item of items"
        (click)="router.navigate(['/products', item.productId])">
        <div class="img-wrapper">
          <img [src]="item.productImageUrl || 'https://placehold.co/400x200?text=No+Image'"
               [alt]="item.productName" class="product-img">
          <span class="category-chip-abs">Saved</span>
        </div>
        <div class="card-body">
          <h3 class="product-name">{{ item.productName }}</h3>
          <div class="price-row">
            <span class="price">{{ item.productPrice | currency:'EUR' }}</span>
            <span class="stock-badge" [class.in-stock]="item.productIsAvailable"
                  [class.out-stock]="!item.productIsAvailable">
              {{ item.productIsAvailable ? 'In Stock' : 'Out of Stock' }}
            </span>
          </div>
        </div>
        <div class="card-actions" (click)="$event.stopPropagation()">
          <button class="wishlist-card-btn wishlisted" 
            (click)="removeItem(item.productId)"
            title="Remove from wishlist">
            <mat-icon>favorite</mat-icon>
          </button>
          <button class="cart-card-btn"
            (click)="addToCart(item)" 
            [disabled]="!item.productIsAvailable">
            <mat-icon>add_shopping_cart</mat-icon>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spinner-wrap { display: flex; justify-content: center; padding: 60px; }
    .empty-state { text-align: center; padding: 60px 20px; color: #6b7280; }
    .huge-icon { font-size: 80px; width: 80px; height: 80px; color: #fca5a5; margin-bottom: 16px; }
    .empty-state h2 { color: #1f2937; font-size: 1.8rem; margin: 0 0 12px; }
    .explore-btn { margin-top: 24px; }

    .products-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 20px; margin-bottom: 24px;
    }
    .product-card {
      background: white; border-radius: 16px;
      border: 1px solid var(--border);
      overflow: hidden; display: flex; flex-direction: column;
      transition: all .25s cubic-bezier(.4,0,.2,1); cursor: pointer;
      &:hover {
        transform: translateY(-6px);
        box-shadow: 0 20px 40px rgba(245,124,0,.12);
        border-color: #fed7aa;
      }
    }
    .img-wrapper { position: relative; overflow: hidden; height: 200px; }
    .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
    .product-card:hover .product-img { transform: scale(1.04); }
    .category-chip-abs {
      position: absolute; bottom: 10px; left: 10px;
      background: rgba(255,255,255,.92); color: #92400e;
      padding: 2px 10px; border-radius: 12px;
      font-size: .72rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: .5px; backdrop-filter: blur(4px);
    }
    .card-body { padding: 14px 16px; flex: 1; }
    .product-name {
      font-weight: 700; font-size: .95rem; margin: 0 0 10px;
      color: #1a1a1a; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .price-row { display: flex; justify-content: space-between; align-items: center; }
    .price { font-size: 1.15rem; font-weight: 800; color: #f57c00; }
    .stock-badge { font-size: .72rem; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
    .in-stock { background: #dcfce7; color: #166534; }
    .out-stock { background: #fee2e2; color: #991b1b; }
    .card-actions {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; border-top: 1px solid #f9f0e6;
    }
    .wishlist-card-btn {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      border: 1px solid #fecaca; background: #fff1f2; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #ef4444; transition: all .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #fee2e2; }
    }
    .cart-card-btn {
      flex: 1; display: flex; align-items: center; justify-content: center;
      gap: 6px; padding: 8px 12px; border-radius: 8px; border: none;
      cursor: pointer; font-size: .85rem; font-weight: 600; font-family: inherit;
      background: linear-gradient(135deg, #f57c00, #e65100); color: white;
      transition: all .2s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { opacity: .9; }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }
    @media (max-width: 1024px) { .products-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .products-grid { grid-template-columns: 1fr; } }
  `]
})
export default class WishlistComponent implements OnInit, OnDestroy {
  items: WishlistItem[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private wishlistSvc: WishlistService,
    private cartSvc: CartService,
    private notify: NotificationService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.wishlistSvc.wishlist$.pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.items = items;
      this.isLoading = false;
    });

    // Initial load
    this.wishlistSvc.getWishlist().pipe(takeUntil(this.destroy$)).subscribe({
      error: () => this.isLoading = false
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeItem(productId: string): void {
    this.wishlistSvc.removeFromWishlist(productId).subscribe(() => {
      this.notify.showSuccess('Item removed from wishlist');
    });
  }

  addToCart(item: WishlistItem): void {
    this.cartSvc.addItem({ productId: item.productId, quantity: 1 }).subscribe(() => {
      this.notify.showSuccess(`"${item.productName}" added to cart!`);
    });
  }
}
