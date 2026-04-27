import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Product, ProductFilter, PagedResponse } from '../../../core/models/product.models';
import { StarRatingComponent } from '../../../shared/star-rating/star-rating.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatPaginatorModule,
    MatChipsModule, MatIconModule, MatBadgeModule, MatTooltipModule, StarRatingComponent],
  template: `
    <!-- Filter Bar -->
    <div class="filter-bar">
      <!-- Search -->
      <div class="search-wrapper">
        <mat-icon class="search-icon">search</mat-icon>
        <input class="search-input" [formControl]="searchCtrl" 
          placeholder="Search products, brands...">
      </div>

      <!-- Filters row -->
      <div class="filters-row">
        <mat-form-field appearance="outline" class="filter-chip-field">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="selectedCategory" (ngModelChange)="onCategoryChange($event)">
            <mat-option [value]="null">All Categories</mat-option>
            <mat-option *ngFor="let c of categoryOptions" [value]="c.value">
              {{ c.emoji }} {{ c.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-chip-field">
          <mat-label>Sort By</mat-label>
          <mat-select [(ngModel)]="selectedSort" (ngModelChange)="onSortChange($event)">
            <mat-option *ngFor="let s of sortOptions" [value]="s.value">{{ s.label }}</mat-option>
          </mat-select>
        </mat-form-field>

        <button class="avail-toggle" [class.active]="onlyAvailable" (click)="toggleAvailable()">
          <mat-icon>{{ onlyAvailable ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
          In Stock Only
        </button>

        <button class="clear-btn" (click)="clearFilters()" *ngIf="hasActiveFilters()">
          <mat-icon>close</mat-icon> Clear
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div class="products-grid" *ngIf="isLoading">
      <div class="skeleton-card" *ngFor="let i of skeletonItems">
        <div class="skeleton-img shimmer"></div>
        <div class="skeleton-body">
          <div class="skeleton-line shimmer" style="width:30%;height:12px;margin-bottom:8px"></div>
          <div class="skeleton-line shimmer" style="width:90%;height:16px;margin-bottom:6px"></div>
          <div class="skeleton-line shimmer" style="width:70%;height:16px;margin-bottom:16px"></div>
          <div class="skeleton-line shimmer" style="width:50%;height:20px"></div>
        </div>
        <div class="skeleton-actions">
          <div class="skeleton-btn shimmer"></div>
          <div class="skeleton-btn-lg shimmer"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state" *ngIf="!isLoading && (response?.items?.length ?? 0) === 0">
      <mat-icon class="empty-icon">search_off</mat-icon>
      <h3>No products found</h3>
      <p>Try adjusting your search or filters.</p>
    </div>

    <!-- Grid -->
    <div class="products-grid" *ngIf="!isLoading && response && response.items.length > 0">
      <div class="product-card" *ngFor="let p of response.items"
        (click)="navigateToProduct(p.id)">
        <div class="img-wrapper">
          <img [src]="p.imageUrl || 'https://placehold.co/400x200?text=No+Image'"
            [alt]="p.name" class="product-img">
          <span class="recommended-badge" *ngIf="isRecommended(p.category)">⭐ For You</span>
          <span class="category-chip-abs">{{ getCategoryLabel(p.category) }}</span>
        </div>
        <div class="card-body">
          <h3 class="product-name">{{ p.name }}</h3>
          <div class="card-rating" *ngIf="p.reviewCount > 0">
            <app-star-rating [rating]="p.averageRating" size="sm"></app-star-rating>
            <span class="rating-avg">{{ p.averageRating.toFixed(1) }}</span>
            <span class="rating-cnt">({{ p.reviewCount }})</span>
          </div>
          <div class="price-row">
            <span class="price">{{ p.price | currency:'EUR' }}</span>
            <span class="stock-badge" [class.in-stock]="p.isAvailable" [class.out-stock]="!p.isAvailable">
              {{ p.isAvailable ? 'In Stock' : 'Out of Stock' }}
            </span>
          </div>
        </div>
        <div class="card-actions" (click)="$event.stopPropagation()">
          <button mat-icon-button class="wishlist-card-btn"
            [class.wishlisted]="wishlistIds.has(p.id)"
            (click)="toggleWishlist($event, p)"
            [matTooltip]="wishlistIds.has(p.id) ? 'Remove from wishlist' : 'Add to wishlist'">
            <mat-icon>{{ wishlistIds.has(p.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
          </button>
          <button mat-raised-button color="primary"
            [disabled]="!p.isAvailable || !isLoggedIn"
            (click)="addToCartFromCard($event, p)"
            class="cart-card-btn"
            matTooltip="Add to cart">
            <mat-icon>add_shopping_cart</mat-icon>
            Add to Cart
          </button>
        </div>
      </div>
    </div>

    <!-- Paginator -->
    <mat-paginator *ngIf="response && response.totalCount > 0"
      [length]="response.totalCount"
      [pageSize]="filter.pageSize"
      [pageIndex]="filter.page - 1"
      [pageSizeOptions]="[8, 16, 32]"
      (page)="onPage($event)">
    </mat-paginator>
  `,
  styles: [`
    .filter-bar {
      background: white; border-radius: 20px;
      border: 1px solid var(--border); box-shadow: var(--shadow-sm);
      margin-bottom: 28px; overflow: hidden;
    }
    .search-wrapper {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid #f5f0ea;
    }
    .search-icon { color: #9ca3af; font-size: 20px; flex-shrink: 0; }
    .search-input {
      flex: 1; border: none; outline: none;
      font-size: 1rem; font-family: inherit;
      color: #1a1a1a; background: transparent;
      &::placeholder { color: #b0b7c3; }
    }
    .filters-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px; flex-wrap: wrap;
    }
    .filter-chip-field {
      flex: 1; min-width: 160px;
      .mat-mdc-form-field-subscript-wrapper { display: none; }
    }
    .avail-toggle {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 20px;
      border: 1.5px solid var(--border); background: white;
      cursor: pointer; font-size: .875rem; font-weight: 500;
      color: #6b7280; transition: all .2s; white-space: nowrap;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &.active {
        border-color: #f57c00; background: #fff3e0;
        color: #f57c00;
      }
      &:hover { border-color: #f57c00; color: #f57c00; }
    }
    .clear-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 8px 14px; border-radius: 20px;
      border: 1.5px solid #fee2e2; background: #fff1f2;
      cursor: pointer; font-size: .85rem; font-weight: 500;
      color: #ef4444; transition: all .2s; white-space: nowrap;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: #fee2e2; }
    }
    .skeleton-card {
      background: white; border-radius: 16px;
      border: 1px solid var(--border); overflow: hidden;
      display: flex; flex-direction: column;
    }
    .skeleton-img { height: 200px; }
    .skeleton-body { padding: 14px 16px; flex: 1; }
    .skeleton-line { border-radius: 6px; margin-bottom: 8px; }
    .skeleton-actions {
      display: flex; gap: 8px; padding: 10px 12px;
      border-top: 1px solid #f9f0e6;
    }
    .skeleton-btn { width: 36px; height: 36px; border-radius: 8px; }
    .skeleton-btn-lg { flex: 1; height: 36px; border-radius: 8px; }
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    .shimmer {
      background: linear-gradient(90deg,
        #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 1000px 100%;
      animation: shimmer 1.5s infinite linear;
    }
    .empty-state { text-align: center; padding: 80px; color: #9e9e9e; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; }
    .products-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 20px; margin-bottom: 24px;
    }
    .product-card {
      background: white; border-radius: 16px;
      border: 1px solid var(--border);
      overflow: hidden; display: flex; flex-direction: column;
      transition: all .25s cubic-bezier(.4,0,.2,1);
      cursor: pointer;
    }
    .product-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 20px 40px rgba(245,124,0,.12);
      border-color: #fed7aa;
    }
    .img-wrapper { position: relative; overflow: hidden; height: 200px; }
    .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
    .product-card:hover .product-img { transform: scale(1.04); }
    .recommended-badge {
      position: absolute; top: 10px; left: 10px;
      background: linear-gradient(135deg, #f57c00, #e65100);
      color: white; font-size: .7rem; font-weight: 700;
      padding: 3px 10px; border-radius: 20px;
      letter-spacing: .5px; text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(245,124,0,.4);
    }
    .category-chip-abs {
      position: absolute; bottom: 10px; left: 10px;
      background: rgba(255,255,255,.92); color: #92400e;
      padding: 2px 10px; border-radius: 12px;
      font-size: .72rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: .5px;
      backdrop-filter: blur(4px);
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
    .card-rating {
      display: flex; align-items: center; gap: 4px;
      margin-bottom: 8px;
    }
    .rating-avg { font-size: .8rem; font-weight: 700; color: #f59e0b; }
    .rating-cnt { font-size: .75rem; color: #9ca3af; }
    .card-actions {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; border-top: 1px solid #f9f0e6;
    }
    .wishlist-card-btn { color: #d1d5db; flex-shrink: 0; }
    .wishlist-card-btn.wishlisted { color: #ef4444; }
    .wishlist-card-btn:hover { color: #ef4444; }
    .cart-card-btn { flex: 1; border-radius: 8px !important; font-size: .85rem !important; }
    @media (max-width: 1024px) { .products-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .products-grid { grid-template-columns: 1fr; } }
  `]
})
export default class ProductListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  searchCtrl      = new FormControl('');
  response: PagedResponse<Product> | null = null;
  isLoading       = false;
  isLoggedIn      = false;
  wishlistIds: Set<string> = new Set();
  favoriteCategories: number[] = [];
  onlyAvailable   = false;
  selectedCategory: number | null = null;
  selectedSort    = 'newest';
  skeletonItems   = Array(8).fill(0);

  filter: ProductFilter = { page: 1, pageSize: 8 };

  categoryOptions = [
    { value: 0, label: 'Dogs',         emoji: '🐕' },
    { value: 1, label: 'Cats',         emoji: '🐈' },
    { value: 2, label: 'Birds',        emoji: '🐦' },
    { value: 3, label: 'Fish',         emoji: '🐠' },
    { value: 4, label: 'Reptiles',     emoji: '🦎' },
    { value: 5, label: 'Small Animals',emoji: '🐹' },
    { value: 6, label: 'Food',         emoji: '🥣' },
    { value: 7, label: 'Toys',         emoji: '🎾' },
    { value: 8, label: 'Accessories',  emoji: '🎀' },
    { value: 9, label: 'Healthcare',   emoji: '💊' },
  ];

  sortOptions = [
    { value: 'newest',     label: 'Newest',         sortBy: undefined,  desc: false },
    { value: 'name_asc',   label: 'Name A–Z',        sortBy: 'name',     desc: false },
    { value: 'name_desc',  label: 'Name Z–A',        sortBy: 'name',     desc: true  },
    { value: 'price_asc',  label: 'Price Low–High',  sortBy: 'price',    desc: false },
    { value: 'price_desc', label: 'Price High–Low',  sortBy: 'price',    desc: true  },
  ];

  constructor(
    private productSvc: ProductService,
    private cartSvc: CartService,
    private authSvc: AuthService,
    private userSvc: UserService,
    private route: ActivatedRoute,
    private notify: NotificationService,
    private wishlistSvc: WishlistService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authSvc.isLoggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.isLoggedIn = v;
        if (v) {
          this.userSvc.getProfile()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: p => this.favoriteCategories = p.favoriteAnimalTypes,
              error: () => {}
            });
        } else {
          this.favoriteCategories = [];
        }
      });

    this.wishlistSvc.wishlist$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.wishlistIds = new Set(items.map(i => i.productId));
      });

    this.route.queryParams
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(p => {
        if (p['category'] != null) {
          this.selectedCategory = +p['category'];
          this.filter.category  = +p['category'];
        }
        this.loadProducts();
      });

    this.searchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        this.filter.searchTerm = term || undefined;
        this.filter.page = 1;
        this.loadProducts();
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadProducts(): void {
    this.isLoading = true;
    this.productSvc.getProducts(this.filter).subscribe({
      next: r  => { this.response = r; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  onCategoryChange(v: number | null): void {
    this.filter.category = v ?? undefined;
    this.filter.page = 1;
    this.loadProducts();
  }

  onSortChange(v: string): void {
    const opt = this.sortOptions.find(s => s.value === v)!;
    this.filter.sortBy         = opt.sortBy;
    this.filter.sortDescending = opt.desc;
    this.filter.page = 1;
    this.loadProducts();
  }

  toggleAvailable(): void {
    this.onlyAvailable       = !this.onlyAvailable;
    this.filter.isAvailable  = this.onlyAvailable ? true : undefined;
    this.filter.page = 1;
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchCtrl.setValue('');
    this.selectedCategory  = null;
    this.selectedSort      = 'newest';
    this.onlyAvailable     = false;
    this.filter = { page: 1, pageSize: 8 };
    this.loadProducts();
  }

  onPage(e: PageEvent): void {
    this.filter.page     = e.pageIndex + 1;
    this.filter.pageSize = e.pageSize;
    this.loadProducts();
  }

  addToCart(p: Product): void {
    this.cartSvc.addItem({ productId: p.id, quantity: 1 }).subscribe({
      next: () => this.notify.showSuccess(`"${p.name}" added to cart!`),
    });
  }

  navigateToProduct(id: string): void {
    this.router.navigate(['/products', id]);
  }

  toggleWishlist(event: MouseEvent, p: Product): void {
    event.stopPropagation(); // prevent card click navigation
    if (!this.isLoggedIn) {
      this.router.navigate(['/auth/login']);
      return;
    }
    if (this.wishlistIds.has(p.id)) {
      this.wishlistSvc.removeFromWishlist(p.id).subscribe(() =>
        this.notify.showSuccess('Removed from wishlist')
      );
    } else {
      this.wishlistSvc.addToWishlist(p.id).subscribe(() =>
        this.notify.showSuccess('Added to wishlist')
      );
    }
  }

  addToCartFromCard(event: MouseEvent, p: Product): void {
    event.stopPropagation(); // prevent card click navigation
    this.addToCart(p);
  }

  isRecommended(category: number): boolean {
    return this.favoriteCategories.includes(category);
  }

  getCategoryLabel(cat: number): string {
    return this.categoryOptions.find(c => c.value === cat)?.label ?? 'Other';
  }

  hasActiveFilters(): boolean {
    return !!(this.searchCtrl.value || this.selectedCategory !== null || 
              this.onlyAvailable || this.selectedSort !== 'newest');
  }
}
