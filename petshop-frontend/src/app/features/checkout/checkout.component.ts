import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { Cart } from '../../core/models/cart.models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ShippingOption {
  id: string; name: string; logo: string;
  price: number; estimatedDays: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatStepperModule, MatProgressSpinnerModule, MatDividerModule],
  template: `
    <div class="checkout-container">
      <h1 class="page-title"><mat-icon>shopping_bag</mat-icon> Checkout</h1>

      <mat-stepper [linear]="true" #stepper class="stepper">

        <!-- STEP 1: Order Summary -->
        <mat-step label="Order Summary">
          <ng-container *ngIf="cart">

            <div class="items-list">
              <div class="item-row" *ngFor="let item of cart.items">
                <img [src]="item.productImageUrl || 'https://placehold.co/48x48?text=?'"
                     [alt]="item.productName" class="item-img">
                <div class="item-info">
                  <div class="item-name">{{ item.productName }}</div>
                  <div class="item-meta">{{ item.quantity }} × {{ item.unitPrice | currency:'EUR' }}</div>
                </div>
                <div class="item-total">{{ item.totalPrice | currency:'EUR' }}</div>
              </div>
            </div>

            <div class="free-shipping-banner" *ngIf="(cart.totalPrice ?? 0) >= FREE_SHIPPING_THRESHOLD">
              🎉 You qualify for FREE shipping on this order!
            </div>

            <h3 class="section-label">Select Shipping Method</h3>
            <div class="shipping-grid">
              <div *ngFor="let opt of shippingOptions"
                   class="shipping-card" [class.selected]="selectedShipping?.id === opt.id"
                   (click)="selectedShipping = opt">
                <div class="ship-logo">{{ opt.logo }}</div>
                <div class="ship-name">{{ opt.name }}</div>
                <div class="ship-price" [class.free-price]="(cart.totalPrice ?? 0) >= FREE_SHIPPING_THRESHOLD">
                  {{ (cart.totalPrice ?? 0) >= FREE_SHIPPING_THRESHOLD ? 'FREE 🎉' : (opt.price | currency:'EUR') }}
                </div>
                <div class="ship-days">{{ opt.estimatedDays }}</div>
              </div>
            </div>

            <h3 class="section-label">Have a discount code?</h3>
            <div class="discount-row">
              <mat-form-field appearance="outline" class="discount-input">
                <mat-label>Discount code</mat-label>
                <input matInput [(ngModel)]="discountCode" [ngModelOptions]="{standalone:true}"
                       placeholder="e.g. WELCOME10">
                <mat-hint>Try: WELCOME10 (10%) or PETLOVER20 (20%)</mat-hint>
              </mat-form-field>
              <button mat-raised-button color="accent" (click)="validateDiscount()"
                [disabled]="isValidatingDiscount || !discountCode.trim()">
                <mat-spinner diameter="16" *ngIf="isValidatingDiscount"></mat-spinner>
                <span *ngIf="!isValidatingDiscount">Apply</span>
              </button>
            </div>
            <div class="discount-success" *ngIf="discountResult?.isValid">
              ✅ <strong>{{ discountResult!.code }}</strong> — {{ discountResult!.percent }}% discount applied!
            </div>
            <div class="discount-error" *ngIf="discountError">{{ discountError }}</div>

            <div class="summary-box">
              <div class="summary-line">
                <span>Subtotal</span><span>{{ cart.totalPrice | currency:'EUR' }}</span>
              </div>
              <div class="summary-line discount-line" *ngIf="discountResult?.isValid">
                <span>Discount ({{ discountResult!.percent }}%)</span>
                <span class="green">-{{ discountAmount | currency:'EUR' }}</span>
              </div>
              <div class="summary-line">
                <span>Shipping</span>
                <span [class.green]="shippingCost === 0">
                  {{ shippingCost === 0 ? 'FREE' : (shippingCost | currency:'EUR') }}
                </span>
              </div>
              <mat-divider style="margin:10px 0"></mat-divider>
              <div class="summary-line">
                <span>Total</span>
                <span class="summary-total">{{ orderTotal | currency:'EUR' }}</span>
              </div>
            </div>

            <div style="margin-top:20px">
              <button mat-raised-button color="primary" matStepperNext
                [disabled]="!selectedShipping">
                Continue to Details <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </ng-container>
        </mat-step>

        <!-- STEP 2: Shipping Details -->
        <mat-step label="Your Details" [stepControl]="shippingForm">
          <form [formGroup]="shippingForm">

            <div class="recap-bar" *ngIf="selectedShipping && cart">
              <span>{{ selectedShipping.logo }} {{ selectedShipping.name }}</span>
              <span>•</span>
              <span>{{ cart.totalItems }} item{{ cart.totalItems !== 1 ? 's' : '' }}</span>
              <span>•</span>
              <strong>Total: {{ orderTotal | currency:'EUR' }}</strong>
            </div>

            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName">
                <mat-error>Required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName">
                <mat-error>Required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" type="tel">
                <mat-error>Required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Street Address</mat-label>
                <input matInput formControlName="street">
                <mat-error>Min 3 characters</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>City</mat-label>
                <input matInput formControlName="city">
                <mat-error>Required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>ZIP / Postal Code</mat-label>
                <input matInput formControlName="zipCode">
                <mat-error>4–10 digits required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Country</mat-label>
                <input matInput formControlName="country">
                <mat-error>Required</mat-error>
              </mat-form-field>
            </div>

            <div class="error-msg" *ngIf="errorMsg">
              <mat-icon>error</mat-icon> {{ errorMsg }}
            </div>

            <div class="action-row">
              <button mat-button matStepperPrevious type="button">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <button mat-raised-button color="primary" class="pay-btn"
                type="button" [disabled]="isProcessing" (click)="placeOrder()">
                <mat-spinner diameter="20" *ngIf="isProcessing" style="display:inline-block"></mat-spinner>
                <span *ngIf="!isProcessing"><mat-icon>lock</mat-icon> Place Order &amp; Pay</span>
              </button>
            </div>
          </form>
        </mat-step>

      </mat-stepper>
    </div>
  `,
  styles: [`
    .checkout-container { max-width:740px; margin:0 auto; }
    .page-title { display:flex; align-items:center; gap:8px; font-size:2rem; margin-bottom:24px; }
    .stepper { background:transparent; }
    .items-list { border:1px solid #e0e0e0; border-radius:10px; overflow:hidden; margin-bottom:16px; }
    .item-row { display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid #f5f5f5; }
    .item-row:last-child { border-bottom:none; }
    .item-img { width:48px; height:48px; object-fit:cover; border-radius:6px; }
    .item-info { flex:1; }
    .item-name { font-weight:600; font-size:.95rem; }
    .item-meta { color:#888; font-size:.85rem; }
    .item-total { font-weight:700; color:#f57c00; }
    .section-label { margin:20px 0 8px; font-size:1rem; font-weight:600; color:#333; }
    .shipping-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }
    .shipping-card { border:2px solid #e0e0e0; border-radius:12px; padding:16px;
      cursor:pointer; transition:all .2s; text-align:center; }
    .shipping-card.selected { border-color:#f57c00; background:#fff3e0; }
    .shipping-card:hover { border-color:#ffa726; }
    .ship-logo { font-size:2rem; margin-bottom:6px; }
    .ship-name { font-weight:700; margin-bottom:4px; }
    .ship-price { font-weight:600; color:#f57c00; margin-bottom:2px; }
    .free-price { color:#2e7d32 !important; }
    .ship-days { font-size:.8rem; color:#888; }
    .discount-row { display:flex; gap:8px; align-items:flex-start; margin-bottom:8px; }
    .discount-input { flex:1; }
    .discount-success { color:#2e7d32; font-size:.9rem; margin-bottom:8px; }
    .discount-error { color:#c62828; font-size:.9rem; margin-bottom:8px; }
    .free-shipping-banner { background:#e8f5e9; color:#2e7d32; border-radius:8px;
      padding:12px; text-align:center; font-weight:600; margin-bottom:16px; }
    .summary-box { background:#f8f9fa; border-radius:12px; padding:20px; margin-top:4px; }
    .summary-line { display:flex; justify-content:space-between; padding:6px 0; }
    .summary-total { font-size:1.3rem; font-weight:800; color:#f57c00; }
    .discount-line span { color:#2e7d32; }
    .green { color:#2e7d32; font-weight:600; }
    .recap-bar { background:#fff3e0; border-radius:8px; padding:12px 16px;
      margin-bottom:20px; display:flex; gap:16px; align-items:center; flex-wrap:wrap; font-size:.95rem; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    .form-grid mat-form-field { width:100%; }
    .error-msg { display:flex; align-items:center; gap:6px; color:#c62828; margin:8px 0; }
    .action-row { display:flex; gap:16px; align-items:center; margin-top:16px; }
    .pay-btn { flex:1; height:48px; }
    @media (max-width: 768px) {
      .shipping-grid { grid-template-columns: 1fr 1fr; }
      .form-grid { grid-template-columns: 1fr; }
      .recap-bar { font-size: .85rem; gap: 8px; }
      .page-title { font-size: 1.5rem; }
    }
  `]
})
export default class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  cart: Cart | null = null;
  isProcessing = false;
  errorMsg = '';

  readonly FREE_SHIPPING_THRESHOLD = 50.00;

  shippingOptions: ShippingOption[] = [
    { id:'dhl',   name:'DHL Express',    logo:'🚀', price:5.99, estimatedDays:'1-2 business days' },
    { id:'ups',   name:'UPS Standard',   logo:'📦', price:3.99, estimatedDays:'3-5 business days' },
    { id:'fedex', name:'FedEx Economy',  logo:'✈️', price:2.99, estimatedDays:'5-7 business days' },
    { id:'local', name:'Local Delivery', logo:'🏠', price:1.99, estimatedDays:'2-3 business days' },
  ];

  selectedShipping: ShippingOption | null = null;
  discountCode = '';
  discountResult: { isValid: boolean; percent: number; code: string } | null = null;
  isValidatingDiscount = false;
  discountError = '';

  shippingForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    phone:     ['', Validators.required],
    street:    ['', [Validators.required, Validators.minLength(3)]],
    city:      ['', Validators.required],
    zipCode:   ['', [Validators.required, Validators.pattern(/^\d{4,10}$/)]],
    country:   ['Serbia', Validators.required],
  });

  get shippingCost(): number {
    if (!this.selectedShipping) return 0;
    if ((this.cart?.totalPrice ?? 0) >= this.FREE_SHIPPING_THRESHOLD) return 0;
    return this.selectedShipping.price;
  }
  get discountAmount(): number {
    if (!this.discountResult?.isValid) return 0;
    return (this.cart?.totalPrice ?? 0) * (this.discountResult.percent / 100);
  }
  get orderTotal(): number {
    return (this.cart?.totalPrice ?? 0) - this.discountAmount + this.shippingCost;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cartSvc: CartService,
    private orderSvc: OrderService,
    private paymentSvc: PaymentService,
    private notify: NotificationService,
    private userSvc: UserService
  ) {}

  ngOnInit(): void {
    this.cartSvc.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(c => {
        this.cart = c;
        if (!c || c.items.length === 0) {
          this.cartSvc.getCart().pipe(takeUntil(this.destroy$)).subscribe(loaded => {
            if (!loaded || loaded.items.length === 0) this.router.navigate(['/cart']);
          });
        }
      });
    if (!this.cart) this.cartSvc.getCart().pipe(takeUntil(this.destroy$)).subscribe();

    this.userSvc.getProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: profile => {
        this.shippingForm.patchValue({
          firstName: profile.firstName,
          lastName:  profile.lastName,
          phone:     profile.phoneNumber ?? '',
          street:    profile.address ?? '',
        });
      },
      error: () => {}
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  validateDiscount(): void {
    if (!this.discountCode.trim()) return;
    this.isValidatingDiscount = true;
    this.discountError = '';
    this.paymentSvc.validateDiscount(this.discountCode).subscribe({
      next: result => {
        if (result.isValid) {
          this.discountResult = { isValid: true, percent: result.discountPercent, code: result.code };
        } else {
          this.discountError  = result.message;
          this.discountResult = null;
        }
        this.isValidatingDiscount = false;
      },
      error: () => { this.discountError = 'Failed to validate code'; this.isValidatingDiscount = false; }
    });
  }

  placeOrder(): void {
    if (this.shippingForm.invalid) { this.shippingForm.markAllAsTouched(); return; }
    this.isProcessing = true;
    this.errorMsg = '';

    const f = this.shippingForm.value;
    const shippingAddress = `${f.firstName} ${f.lastName}, ${f.street}, ${f.city} ${f.zipCode}, ${f.country} | Phone: ${f.phone} | Shipping: ${this.selectedShipping?.name ?? 'Standard'}`;

    this.orderSvc.createOrder({ shippingAddress }).subscribe({
      next: order => {
        this.paymentSvc.createCheckoutSession({
          orderId:    order.id,
          successUrl: `${window.location.origin}/orders`,
          cancelUrl:  `${window.location.origin}/checkout`,
        }).subscribe({
          next: session => { window.location.href = session.checkoutUrl; },
          error: () => {
            this.isProcessing = false;
            this.errorMsg = 'Failed to initialize payment. Please try again.';
          },
        });
      },
      error: () => {
        this.isProcessing = false;
        this.errorMsg = 'Failed to create order. Please try again.';
      },
    });
  }
}
