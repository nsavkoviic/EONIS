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
import { TranslateModule } from '@ngx-translate/core';

interface ShippingOption {
  id: string; name: string; logo: string;
  price: number; estimatedDays: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatStepperModule, MatProgressSpinnerModule, MatDividerModule, TranslateModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
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
