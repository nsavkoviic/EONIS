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
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatPaginatorModule,
    MatChipsModule, MatIconModule, MatBadgeModule, MatTooltipModule, StarRatingComponent, TranslateModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
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
