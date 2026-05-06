import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subject, takeUntil } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { OrderService } from '../../../core/services/order.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ReviewService } from '../../../core/services/review.service';
import { PaymentStatus, Transaction } from '../../../core/models/payment.models';

interface CouponDto {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  createdAt: string;
}

interface PendingReviewDto {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isApproved: boolean;
}
import { OrderStatus, Order } from '../../../core/models/order.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatCardModule, MatChipsModule, MatTooltipModule,
    MatTabsModule, MatDividerModule, MatPaginatorModule,
    MatSlideToggleModule, TranslateModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export default class TransactionsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  txCols    = ['txId','orderId','intent','amount','status','date','actions'];
  orderCols = ['id','email','date','total','status','newStatus'];
  couponCols = ['code','percent','uses','expires','active','couponActions'];

  transactions: Transaction[] = [];
  txLoading = false;

  orders: Order[] = [];
  ordersLoading = false;
  orderTotal = 0;
  orderPage = 1;
  orderPageSize = 10;
  orderStatusFilter: OrderStatus | undefined = undefined;
  selectedStatuses: Record<string, OrderStatus> = {};

  // Coupons
  coupons: CouponDto[] = [];
  couponsLoading = false;
  showCouponForm = false;
  newCoupon = { code: '', discountPercent: 10, maxUses: 100, expiresAt: null as Date | null };

  // Reviews Moderation
  pendingReviews: PendingReviewDto[] = [];
  reviewsLoading = false;

  PaymentStatus = PaymentStatus;

  filterForm = this.fb.group({ from: [null as Date | null], to: [null as Date | null] });

  orderStatusOptions = [
    {value: OrderStatus.Pending,    label:'Pending'},
    {value: OrderStatus.Processing, label:'Processing'},
    {value: OrderStatus.Shipped,    label:'Shipped'},
    {value: OrderStatus.Delivered,  label:'Delivered'},
    {value: OrderStatus.Cancelled,  label:'Cancelled'},
    {value: OrderStatus.Refunded,   label:'Refunded'},
  ];

  get totalRevenue(): number {
    return this.transactions.filter(t => t.status === PaymentStatus.Succeeded)
      .reduce((s, t) => s + t.amount, 0);
  }
  get successRate(): string {
    if (!this.transactions.length) return '—';
    return (this.transactions.filter(t => t.status === PaymentStatus.Succeeded).length
      / this.transactions.length * 100).toFixed(1) + '%';
  }

  constructor(
    private paymentSvc: PaymentService,
    private orderSvc: OrderService,
    private reviewSvc: ReviewService,
    private fb: FormBuilder,
    private notify: NotificationService
  ) {}

  ngOnInit(): void { this.loadTransactions(); this.loadOrders(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onTabChange(event: MatTabChangeEvent): void {
    if (event.index === 2) this.loadCoupons();
    if (event.index === 3) this.loadPendingReviews();
  }

  // ── Transactions ──
  loadTransactions(from?: Date, to?: Date): void {
    this.txLoading = true;
    this.paymentSvc.getTransactions(from, to).pipe(takeUntil(this.destroy$)).subscribe({
      next: t  => { this.transactions = t; this.txLoading = false; },
      error: () => this.txLoading = false,
    });
  }
  applyFilters(): void {
    const { from, to } = this.filterForm.value;
    this.loadTransactions(from ?? undefined, to ?? undefined);
  }
  clearFilters(): void { this.filterForm.reset(); this.loadTransactions(); }

  // ── Orders ──
  loadOrders(): void {
    this.ordersLoading = true;
    this.orderSvc.getAllOrders(this.orderPage, this.orderPageSize, this.orderStatusFilter).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        this.orders = r.items; this.orderTotal = r.totalCount;
        this.orders.forEach(o => { if (!this.selectedStatuses[o.id]) this.selectedStatuses[o.id] = o.status; });
        this.ordersLoading = false;
      },
      error: () => this.ordersLoading = false,
    });
  }
  onOrderPage(e: PageEvent): void { this.orderPage = e.pageIndex + 1; this.orderPageSize = e.pageSize; this.loadOrders(); }
  updateOrderStatus(orderId: string, status: OrderStatus): void {
    this.orderSvc.updateStatus(orderId, status).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.notify.showSuccess('Status updated');
      this.loadOrders();
    });
  }
  markRefunded(orderId: string): void {
    if (!window.confirm('Mark this order as Refunded?')) return;
    this.orderSvc.updateStatus(orderId, OrderStatus.Refunded).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.notify.showSuccess('Order marked as refunded');
      this.loadTransactions(); this.loadOrders();
    });
  }

  // ── Coupons ──
  loadCoupons(): void {
    this.couponsLoading = true;
    this.paymentSvc.getDiscountCodes().pipe(takeUntil(this.destroy$)).subscribe({
      next: c  => { this.coupons = c; this.couponsLoading = false; },
      error: () => this.couponsLoading = false,
    });
  }
  createCoupon(): void {
    this.paymentSvc.createDiscountCode(this.newCoupon).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notify.showSuccess('Coupon created!');
        this.newCoupon = { code: '', discountPercent: 10, maxUses: 100, expiresAt: null };
        this.showCouponForm = false;
        this.loadCoupons();
      },
    });
  }
  toggleCoupon(id: string, isActive: boolean): void {
    this.paymentSvc.updateDiscountCode(id, { isActive }).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.notify.showSuccess('Coupon updated');
      this.loadCoupons();
    });
  }
  deleteCoupon(id: string): void {
    if (!window.confirm('Deactivate this coupon?')) return;
    this.paymentSvc.deleteDiscountCode(id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.notify.showSuccess('Coupon deactivated');
      this.loadCoupons();
    });
  }

  // ── Reviews Moderation ──
  loadPendingReviews(): void {
    this.reviewsLoading = true;
    this.reviewSvc.getPendingReviews().pipe(takeUntil(this.destroy$)).subscribe({
      next: r => { this.pendingReviews = r; this.reviewsLoading = false; },
      error: () => this.reviewsLoading = false,
    });
  }
  approveReview(r: any): void {
    this.reviewSvc.approveReview(r.productId, r.id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.notify.showSuccess('Review approved');
      this.loadPendingReviews();
    });
  }
  deleteReview(r: any): void {
    if (!window.confirm('Reject this review?')) return;
    this.reviewSvc.deleteReview(r.productId, r.id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.notify.showSuccess('Review rejected');
      this.loadPendingReviews();
    });
  }

  // ── Helpers ──
  getTxStatusLabel(s: PaymentStatus): string {
    return { [PaymentStatus.Pending]:'Pending', [PaymentStatus.Succeeded]:'Succeeded', [PaymentStatus.Failed]:'Failed' }[s] ?? '—';
  }
  getTxStatusClass(s: PaymentStatus): string {
    return { [PaymentStatus.Pending]:'status-pending', [PaymentStatus.Succeeded]:'status-succeeded', [PaymentStatus.Failed]:'status-failed' }[s] ?? '';
  }
  getOrderStatusLabel(s: OrderStatus): string {
    return this.orderStatusOptions.find(x => x.value === s)?.label ?? 'Unknown';
  }
  getOrderStatusClass(s: OrderStatus): string {
    const m: Record<number,string> = {0:'status-pending',1:'status-processing',2:'status-shipped',3:'status-delivered',4:'status-cancelled',5:'status-refunded'};
    return m[s] ?? '';
  }
}
