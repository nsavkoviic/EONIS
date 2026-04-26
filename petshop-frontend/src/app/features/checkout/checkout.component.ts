import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { Cart } from '../../core/models/cart.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatStepperModule, MatProgressSpinnerModule, MatDividerModule],
  template: `
    <div class="checkout-container">
      <h1 class="page-title"><mat-icon>shopping_bag</mat-icon> Checkout</h1>

      <mat-stepper [linear]="true" #stepper class="stepper">

        <!-- Step 1: Order Summary -->
        <mat-step label="Order Summary">
          <mat-card class="step-card" *ngIf="cart">
            <mat-card-header><mat-card-title>Your Items</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="order-item" *ngFor="let item of cart.items">
                <span class="item-name">{{ item.productName }}</span>
                <span class="item-qty">× {{ item.quantity }}</span>
                <span class="item-price">{{ item.totalPrice | currency:'EUR' }}</span>
              </div>
              <mat-divider class="divider"></mat-divider>
              <div class="total-row">
                <strong>Total</strong>
                <strong class="total-amount">{{ cart.totalPrice | currency:'EUR' }}</strong>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" matStepperNext>
                Continue to Shipping <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        </mat-step>

        <!-- Step 2: Shipping & Payment -->
        <mat-step label="Shipping & Payment" [stepControl]="shippingForm">
          <form [formGroup]="shippingForm">
            <mat-card class="step-card">
              <mat-card-header><mat-card-title>Shipping Details</mat-card-title></mat-card-header>
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Shipping Address</mat-label>
                  <textarea matInput formControlName="shippingAddress"
                    rows="4" placeholder="Street, City, Country, ZIP"></textarea>
                  <mat-error *ngIf="shippingForm.get('shippingAddress')?.hasError('required')">
                    Address is required
                  </mat-error>
                  <mat-error *ngIf="shippingForm.get('shippingAddress')?.hasError('minlength')">
                    Please enter a complete address (min 10 characters)
                  </mat-error>
                </mat-form-field>

                <mat-divider class="divider"></mat-divider>
                <div class="total-row" *ngIf="cart">
                  <span>Order Total</span>
                  <strong class="total-amount">{{ cart.totalPrice | currency:'EUR' }}</strong>
                </div>

                <div class="error-msg" *ngIf="errorMsg">
                  <mat-icon>error</mat-icon> {{ errorMsg }}
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
                <button mat-raised-button color="primary" class="pay-btn"
                  [disabled]="isProcessing" (click)="placeOrder()">
                  <mat-spinner diameter="20" *ngIf="isProcessing"></mat-spinner>
                  <span *ngIf="!isProcessing">
                    <mat-icon>lock</mat-icon> Place Order &amp; Pay
                  </span>
                </button>
              </mat-card-actions>
            </mat-card>
          </form>
        </mat-step>

      </mat-stepper>
    </div>
  `,
  styles: [`
    .checkout-container { max-width:680px; margin:0 auto; }
    .page-title { display:flex; align-items:center; gap:8px; font-size:2rem; margin-bottom:24px; }
    .stepper { background:transparent; }
    .step-card { padding:8px; }
    .order-item { display:flex; justify-content:space-between; align-items:center;
      padding:10px 0; border-bottom:1px solid #f0f0f0; }
    .item-name { flex:1; font-weight:500; }
    .item-qty { color:#888; margin:0 16px; }
    .item-price { font-weight:600; }
    .divider { margin:16px 0; }
    .total-row { display:flex; justify-content:space-between; align-items:center;
      padding:8px 0; font-size:1.1rem; }
    .total-amount { color:#3f51b5; font-size:1.3rem; }
    .full-width { width:100%; margin-top:16px; }
    .pay-btn { min-width:200px; height:48px; }
    .error-msg { display:flex; align-items:center; gap:6px; color:#f44336;
      margin-top:12px; font-size:.9rem; }
  `]
})
export default class CheckoutComponent implements OnInit {
  cart: Cart | null = null;
  isProcessing = false;
  errorMsg = '';

  shippingForm = this.fb.group({
    shippingAddress: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cartSvc: CartService,
    private orderSvc: OrderService,
    private paymentSvc: PaymentService
  ) {}

  ngOnInit(): void {
    this.cartSvc.cart$.subscribe(c => {
      this.cart = c;
      if (!c || c.items.length === 0) {
        this.cartSvc.getCart().subscribe(loaded => {
          if (!loaded || loaded.items.length === 0) this.router.navigate(['/cart']);
        });
      }
    });
    if (!this.cart) this.cartSvc.getCart().subscribe();
  }

  placeOrder(): void {
    if (this.shippingForm.invalid) { this.shippingForm.markAllAsTouched(); return; }
    this.isProcessing = true;
    this.errorMsg = '';

    const address = this.shippingForm.value.shippingAddress!;

    this.orderSvc.createOrder({ shippingAddress: address }).subscribe({
      next: (order) => {
        this.paymentSvc.createCheckoutSession({
          orderId:    order.id,
          successUrl: `${window.location.origin}/orders`,
          cancelUrl:  `${window.location.origin}/checkout`,
        }).subscribe({
          next: (session) => { window.location.href = session.checkoutUrl; },
          error: () => {
            this.errorMsg = 'Payment session failed. Please try again.';
            this.isProcessing = false;
          },
        });
      },
      error: (err) => {
        this.errorMsg = err?.error?.detail || 'Order creation failed. Please try again.';
        this.isProcessing = false;
      },
    });
  }
}
