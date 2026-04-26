import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CartService } from '../../core/services/cart.service';
import { Cart, CartItem } from '../../core/models/cart.models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDividerModule, MatInputModule, MatFormFieldModule, MatSnackBarModule],
  template: `
    <h1 class="page-title">Your Shopping Cart</h1>

    <div class="spinner-wrap" *ngIf="isLoading"><mat-spinner></mat-spinner></div>

    <!-- Empty -->
    <div class="empty-state" *ngIf="!isLoading && (!cart || cart.items.length === 0)">
      <mat-icon class="big-icon">shopping_cart</mat-icon>
      <h3>Your cart is empty</h3>
      <a mat-raised-button color="primary" routerLink="/products">Continue Shopping</a>
    </div>

    <!-- Cart content -->
    <div class="cart-layout" *ngIf="!isLoading && cart && cart.items.length > 0">
      <!-- Items -->
      <div class="items-col">
        <mat-card class="item-card" *ngFor="let item of cart.items">
          <div class="item-row">
            <img [src]="item.productImageUrl || 'https://placehold.co/80x80?text=?'"
                 [alt]="item.productName" class="item-img">
            <div class="item-info">
              <div class="item-name">{{ item.productName }}</div>
              <div class="item-price">{{ item.unitPrice | currency:'EUR' }} each</div>
            </div>
            <div class="item-qty">
              <button mat-icon-button (click)="changeQty(item, item.quantity - 1)">
                <mat-icon>remove</mat-icon>
              </button>
              <span class="qty-display">{{ item.quantity }}</span>
              <button mat-icon-button (click)="changeQty(item, item.quantity + 1)">
                <mat-icon>add</mat-icon>
              </button>
            </div>
            <div class="item-total">{{ item.totalPrice | currency:'EUR' }}</div>
            <button mat-icon-button color="warn" (click)="removeItem(item.productId)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </mat-card>

        <div class="clear-row">
          <button mat-stroked-button color="warn" (click)="clearCart()">
            <mat-icon>delete_sweep</mat-icon> Clear Cart
          </button>
        </div>
      </div>

      <!-- Summary -->
      <div class="summary-col">
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title>Order Summary</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-row">
              <span>Items ({{ cart.totalItems }})</span>
              <span>{{ cart.totalPrice | currency:'EUR' }}</span>
            </div>
            <mat-divider class="divider"></mat-divider>
            <div class="summary-row total-row">
              <strong>Total</strong>
              <strong>{{ cart.totalPrice | currency:'EUR' }}</strong>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" class="checkout-btn"
              (click)="checkout()">
              <mat-icon>payment</mat-icon> Proceed to Checkout
            </button>
            <a mat-button routerLink="/products" class="continue-btn">Continue Shopping</a>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-title { font-size:2rem; margin-bottom:24px; }
    .spinner-wrap { display:flex; justify-content:center; padding:80px; }
    .empty-state { text-align:center; padding:80px; color:#9e9e9e; }
    .big-icon { font-size:72px; width:72px; height:72px; }
    .cart-layout { display:grid; grid-template-columns:1fr 360px; gap:24px; align-items:start; }
    .item-card { margin-bottom:12px; padding:4px; }
    .item-row { display:flex; align-items:center; gap:16px; padding:8px; }
    .item-img { width:72px; height:72px; object-fit:cover; border-radius:8px; }
    .item-info { flex:1; }
    .item-name { font-weight:600; margin-bottom:4px; }
    .item-price { color:#666; font-size:.9rem; }
    .item-qty { display:flex; align-items:center; gap:4px; }
    .qty-display { min-width:32px; text-align:center; font-weight:600; }
    .item-total { font-weight:700; color:#3f51b5; min-width:80px; text-align:right; }
    .clear-row { text-align:right; margin-top:8px; }
    .summary-card { padding:8px; }
    .summary-row { display:flex; justify-content:space-between; padding:8px 0; }
    .total-row { font-size:1.1rem; }
    .divider { margin:8px 0; }
    .checkout-btn { width:100%; height:48px; margin-bottom:8px; }
    .continue-btn { width:100%; }
    @media(max-width:900px) { .cart-layout { grid-template-columns:1fr; } }
  `]
})
export default class CartComponent implements OnInit {
  cart: Cart | null = null;
  isLoading = true;

  constructor(
    private cartSvc: CartService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cartSvc.getCart().subscribe(() => this.isLoading = false);
    this.cartSvc.cart$.subscribe(c => this.cart = c);
  }

  changeQty(item: CartItem, qty: number): void {
    if (qty < 1) {
      this.removeItem(item.productId);
    } else {
      this.cartSvc.updateItem(item.productId, { quantity: qty }).subscribe();
    }
  }

  removeItem(productId: string): void {
    this.cartSvc.removeItem(productId).subscribe();
  }

  clearCart(): void {
    this.cartSvc.clearCart().subscribe(() =>
      this.snackBar.open('Cart cleared', 'Close', { duration: 2000 })
    );
  }

  checkout(): void {
    this.router.navigate(['/checkout']);
  }
}
