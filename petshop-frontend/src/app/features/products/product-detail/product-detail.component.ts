import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatChipsModule, MatSnackBarModule, MatDividerModule],
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

        <button mat-raised-button color="primary" class="add-btn"
          [disabled]="!product!.isAvailable || !isLoggedIn"
          (click)="addToCart()">
          <mat-icon>add_shopping_cart</mat-icon> Add to Cart
        </button>

        <p class="login-hint" *ngIf="!isLoggedIn">
          <mat-icon>info</mat-icon>
          Please <a routerLink="/auth/login">login</a> to add items to cart
        </p>

        <a mat-button routerLink="/products" class="back-link">
          <mat-icon>arrow_back</mat-icon> Back to Products
        </a>
      </div>
    </div>
  `,
  styles: [`
    .spinner-wrap { display:flex; justify-content:center; padding:80px; }
    .not-found { text-align:center; padding:80px; color:#9e9e9e; }
    .big-icon { font-size:64px; width:64px; height:64px; }
    .detail-layout { display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:start; }
    .product-img { width:100%; border-radius:12px; object-fit:cover; max-height:450px; }
    .product-name { font-size:2rem; font-weight:700; margin:12px 0; }
    .price { font-size:2rem; font-weight:800; color:#3f51b5; margin-bottom:12px; }
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
    @media(max-width:768px) { .detail-layout { grid-template-columns:1fr; } }
  `]
})
export default class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  isLoading = true;
  isLoggedIn = false;
  quantity = 1;

  private categoryLabels: Record<number, string> = {
    0:'Dogs',1:'Cats',2:'Birds',3:'Fish',4:'Reptiles',
    5:'Small Animals',6:'Food',7:'Toys',8:'Accessories',9:'Healthcare'
  };

  constructor(
    private route: ActivatedRoute,
    private productSvc: ProductService,
    private cartSvc: CartService,
    private authSvc: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authSvc.isLoggedIn$.subscribe(v => this.isLoggedIn = v);
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productSvc.getById(id).subscribe({
      next: p  => { this.product = p; this.isLoading = false; },
      error: () => { this.product = null; this.isLoading = false; },
    });
  }

  addToCart(): void {
    if (!this.product) return;
    this.cartSvc.addItem({ productId: this.product.id, quantity: this.quantity }).subscribe({
      next: () => this.snackBar.open(`"${this.product!.name}" added to cart!`, 'Close', { duration: 2000 }),
    });
  }

  getCategoryLabel(cat: number): string {
    return this.categoryLabels[cat] ?? 'Other';
  }
}
