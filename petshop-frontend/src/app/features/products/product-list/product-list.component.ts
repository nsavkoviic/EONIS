import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, take } from 'rxjs';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, ProductFilter, PagedResponse } from '../../../core/models/product.models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatPaginatorModule, MatProgressSpinnerModule,
    MatChipsModule, MatIconModule, MatBadgeModule, MatSnackBarModule],
  template: `
    <!-- Filter Bar -->
    <div class="filter-bar">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search products...</mat-label>
        <input matInput [formControl]="searchCtrl">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Category</mat-label>
        <mat-select [(ngModel)]="selectedCategory" (ngModelChange)="onCategoryChange($event)">
          <mat-option [value]="null">All Categories</mat-option>
          <mat-option *ngFor="let c of categoryOptions" [value]="c.value">{{ c.label }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Sort By</mat-label>
        <mat-select [(ngModel)]="selectedSort" (ngModelChange)="onSortChange($event)">
          <mat-option *ngFor="let s of sortOptions" [value]="s.value">{{ s.label }}</mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-stroked-button [color]="onlyAvailable ? 'primary' : ''"
        (click)="toggleAvailable()" class="avail-btn">
        <mat-icon>{{ onlyAvailable ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
        Available Only
      </button>

      <button mat-stroked-button (click)="clearFilters()">
        <mat-icon>clear</mat-icon> Clear
      </button>
    </div>

    <!-- Loading -->
    <div class="spinner-overlay" *ngIf="isLoading">
      <mat-spinner></mat-spinner>
    </div>

    <!-- Empty State -->
    <div class="empty-state" *ngIf="!isLoading && (response?.items?.length ?? 0) === 0">
      <mat-icon class="empty-icon">search_off</mat-icon>
      <h3>No products found</h3>
      <p>Try adjusting your search or filters.</p>
    </div>

    <!-- Grid -->
    <div class="products-grid" *ngIf="!isLoading && response && response.items.length > 0">
      <mat-card class="product-card" *ngFor="let p of response.items">
        <img mat-card-image [src]="p.imageUrl || 'https://placehold.co/300x200?text=No+Image'"
          [alt]="p.name" class="product-img">
        <mat-card-content>
          <span class="category-chip">{{ getCategoryLabel(p.category) }}</span>
          <h3 class="product-name">{{ p.name }}</h3>
          <div class="price-row">
            <span class="price">{{ p.price | currency:'EUR' }}</span>
            <span class="stock-badge" [class.in-stock]="p.isAvailable" [class.out-stock]="!p.isAvailable">
              {{ p.isAvailable ? 'In Stock' : 'Out of Stock' }}
            </span>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button [routerLink]="['/products', p.id]">View Details</a>
          <button mat-flat-button color="primary"
            [disabled]="!p.isAvailable || !isLoggedIn"
            (click)="addToCart(p)">
            <mat-icon>add_shopping_cart</mat-icon>
          </button>
        </mat-card-actions>
      </mat-card>
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
    .filter-bar { display: flex; flex-wrap: wrap; gap: 16px; align-items: center;
      margin-bottom: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px; }
    .search-field { flex: 2; min-width: 200px; }
    .filter-field { flex: 1; min-width: 150px; }
    .avail-btn { height: 56px; }
    .spinner-overlay { display: flex; justify-content: center; padding: 80px; }
    .empty-state { text-align: center; padding: 80px; color: #9e9e9e; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; }
    .products-grid { display: grid;
      grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
    .product-card { display: flex; flex-direction: column; }
    .product-img { height: 180px; object-fit: cover; }
    .category-chip { background: #e8eaf6; color: #3f51b5; padding: 2px 10px;
      border-radius: 12px; font-size: .75rem; }
    .product-name { font-weight: 600; margin: 8px 0; display: -webkit-box;
      -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .price-row { display: flex; justify-content: space-between; align-items: center; }
    .price { font-size: 1.1rem; font-weight: 700; color: #3f51b5; }
    .stock-badge { font-size: .75rem; padding: 2px 8px; border-radius: 12px; }
    .in-stock { background: #e8f5e9; color: #2e7d32; }
    .out-stock { background: #ffebee; color: #c62828; }
    mat-card-actions { margin-top: auto; }
    @media (max-width: 1024px) { .products-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .products-grid { grid-template-columns: 1fr; } }
  `]
})
export default class ProductListComponent implements OnInit {
  searchCtrl      = new FormControl('');
  response: PagedResponse<Product> | null = null;
  isLoading       = false;
  isLoggedIn      = false;
  onlyAvailable   = false;
  selectedCategory: number | null = null;
  selectedSort    = 'newest';

  filter: ProductFilter = { page: 1, pageSize: 8 };

  categoryOptions = [
    { value: 0, label: 'Dogs' }, { value: 1, label: 'Cats' },
    { value: 2, label: 'Birds' }, { value: 3, label: 'Fish' },
    { value: 4, label: 'Reptiles' }, { value: 5, label: 'Small Animals' },
    { value: 6, label: 'Food' }, { value: 7, label: 'Toys' },
    { value: 8, label: 'Accessories' }, { value: 9, label: 'Healthcare' },
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
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authSvc.isLoggedIn$.subscribe(v => this.isLoggedIn = v);

    this.route.queryParams.pipe(take(1)).subscribe(p => {
      if (p['category'] != null) {
        this.selectedCategory    = +p['category'];
        this.filter.category     = +p['category'];
      }
      this.loadProducts();
    });

    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(term => {
        this.filter.searchTerm = term || undefined;
        this.filter.page = 1;
        this.loadProducts();
      });
  }

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
      next: () => this.snackBar.open(`"${p.name}" added to cart!`, 'Close', { duration: 2000 }),
    });
  }

  getCategoryLabel(cat: number): string {
    return this.categoryOptions.find(c => c.value === cat)?.label ?? 'Other';
  }
}
