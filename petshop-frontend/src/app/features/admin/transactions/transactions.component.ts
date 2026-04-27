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
import { OrderStatus, Order } from '../../../core/models/order.models';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatCardModule, MatChipsModule, MatTooltipModule,
    MatTabsModule, MatDividerModule, MatPaginatorModule,
    MatSlideToggleModule],
  template: `
    <h1>Transactions & Orders</h1>

    <!-- ── Summary Cards ─────────────────────────────────────────────────── -->
    <div class="summary-grid">
      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-icon">💰</div>
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value green">{{ totalRevenue | currency:'EUR' }}</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-icon">📊</div>
          <div class="stat-label">Total Transactions</div>
          <div class="stat-value">{{ transactions.length }}</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-icon">✅</div>
          <div class="stat-label">Success Rate</div>
          <div class="stat-value green">{{ successRate }}</div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- ── Tabs ───────────────────────────────────────────────────────────── -->
    <mat-tab-group animationDuration="200ms" (selectedTabChange)="onTabChange($event)">

      <!-- Tab 1: Transactions -->
      <mat-tab label="💳 Transactions">
        <div class="tab-content">
          <form [formGroup]="filterForm" class="filter-bar">
            <mat-form-field appearance="outline">
              <mat-label>From</mat-label>
              <input matInput [matDatepicker]="fp" formControlName="from">
              <mat-datepicker-toggle matIconSuffix [for]="fp"></mat-datepicker-toggle>
              <mat-datepicker #fp></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>To</mat-label>
              <input matInput [matDatepicker]="tp" formControlName="to">
              <mat-datepicker-toggle matIconSuffix [for]="tp"></mat-datepicker-toggle>
              <mat-datepicker #tp></mat-datepicker>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="applyFilters()">
              <mat-icon>filter_list</mat-icon> Apply
            </button>
            <button mat-stroked-button (click)="clearFilters()">
              <mat-icon>clear</mat-icon> Clear
            </button>
          </form>

          <div class="spinner-wrap" *ngIf="txLoading"><mat-spinner></mat-spinner></div>

          <div class="empty-state" *ngIf="!txLoading && transactions.length === 0">
            <mat-icon class="big-icon">payments</mat-icon>
            <p>No transactions found</p>
          </div>

          <div class="table-wrap" *ngIf="!txLoading && transactions.length > 0">
            <table mat-table [dataSource]="transactions" class="full-table">
              <ng-container matColumnDef="txId">
                <th mat-header-cell *matHeaderCellDef>Tx ID</th>
                <td mat-cell *matCellDef="let t"><code>{{ t.id.slice(0,8).toUpperCase() }}</code></td>
              </ng-container>
              <ng-container matColumnDef="orderId">
                <th mat-header-cell *matHeaderCellDef>Order ID</th>
                <td mat-cell *matCellDef="let t"><code>{{ t.orderId.slice(0,8).toUpperCase() }}</code></td>
              </ng-container>
              <ng-container matColumnDef="intent">
                <th mat-header-cell *matHeaderCellDef>Payment Intent</th>
                <td mat-cell *matCellDef="let t">
                  <span [matTooltip]="t.stripePaymentIntentId || ''" class="truncate">
                    {{ (t.stripePaymentIntentId || '—') | slice:0:20 }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let t"><strong>{{ t.amount | currency:'EUR' }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let t">
                  <span class="status-chip" [ngClass]="getTxStatusClass(t.status)">
                    {{ getTxStatusLabel(t.status) }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let t">{{ t.createdAt | date:'dd MMM yyyy, HH:mm' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let t">
                  <button mat-stroked-button color="warn" class="refund-btn"
                    *ngIf="t.status === PaymentStatus.Succeeded"
                    (click)="markRefunded(t.orderId)">
                    Refund
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="txCols"></tr>
              <tr mat-row *matRowDef="let row; columns: txCols;"></tr>
            </table>
          </div>
        </div>
      </mat-tab>

      <!-- Tab 2: Order Management -->
      <mat-tab label="📦 Order Management">
        <div class="tab-content">
          <div class="filter-bar">
            <mat-form-field appearance="outline" class="status-filter">
              <mat-label>Filter by Status</mat-label>
              <mat-select [(ngModel)]="orderStatusFilter" (ngModelChange)="loadOrders()">
                <mat-option [value]="undefined">All Orders</mat-option>
                <mat-option *ngFor="let s of orderStatusOptions" [value]="s.value">{{ s.label }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="spinner-wrap" *ngIf="ordersLoading"><mat-spinner></mat-spinner></div>

          <div class="table-wrap" *ngIf="!ordersLoading">
            <table mat-table [dataSource]="orders" class="full-table">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>Order ID</th>
                <td mat-cell *matCellDef="let o"><code>#{{ o.id.slice(0,8).toUpperCase() }}</code></td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Customer</th>
                <td mat-cell *matCellDef="let o">{{ o.userEmail }}</td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let o">{{ o.orderDate | date:'dd MMM yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let o"><strong>{{ o.totalAmount | currency:'EUR' }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let o">
                  <span class="status-chip" [ngClass]="getOrderStatusClass(o.status)">
                    {{ getOrderStatusLabel(o.status) }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="newStatus">
                <th mat-header-cell *matHeaderCellDef>Update</th>
                <td mat-cell *matCellDef="let o">
                  <div class="update-row">
                    <mat-select [(ngModel)]="selectedStatuses[o.id]" class="status-select">
                      <mat-option *ngFor="let s of orderStatusOptions" [value]="s.value">{{ s.label }}</mat-option>
                    </mat-select>
                    <button mat-icon-button color="primary" matTooltip="Save"
                      (click)="updateOrderStatus(o.id, selectedStatuses[o.id])">
                      <mat-icon>save</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="orderCols"></tr>
              <tr mat-row *matRowDef="let row; columns: orderCols;"></tr>
            </table>
            <mat-paginator [length]="orderTotal" [pageSize]="orderPageSize"
              [pageSizeOptions]="[10,25,50]" (page)="onOrderPage($event)">
            </mat-paginator>
          </div>
        </div>
      </mat-tab>

      <!-- Tab 3: Coupon Management -->
      <mat-tab label="🎟️ Coupons">
        <div class="tab-content">
          <div class="coupon-header">
            <button mat-raised-button color="primary" (click)="showCouponForm = !showCouponForm">
              <mat-icon>{{ showCouponForm ? 'close' : 'add' }}</mat-icon>
              {{ showCouponForm ? 'Cancel' : 'Add New Coupon' }}
            </button>
          </div>

          <!-- Inline create form -->
          <mat-card class="coupon-form-card" *ngIf="showCouponForm">
            <mat-card-content>
              <div class="coupon-form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Code</mat-label>
                  <input matInput [(ngModel)]="newCoupon.code"
                    (input)="newCoupon.code = newCoupon.code.toUpperCase()"
                    placeholder="e.g. SUMMER25">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Discount %</mat-label>
                  <input matInput type="number" [(ngModel)]="newCoupon.discountPercent"
                    min="1" max="100">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Max Uses</mat-label>
                  <input matInput type="number" [(ngModel)]="newCoupon.maxUses" min="1">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Expiry (optional)</mat-label>
                  <input matInput [matDatepicker]="cpk" [(ngModel)]="newCoupon.expiresAt">
                  <mat-datepicker-toggle matIconSuffix [for]="cpk"></mat-datepicker-toggle>
                  <mat-datepicker #cpk></mat-datepicker>
                </mat-form-field>
                <button mat-raised-button color="accent" (click)="createCoupon()"
                  [disabled]="!newCoupon.code.trim()">
                  <mat-icon>check</mat-icon> Create
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <div class="spinner-wrap" *ngIf="couponsLoading"><mat-spinner></mat-spinner></div>

          <div class="table-wrap" *ngIf="!couponsLoading && coupons.length > 0">
            <table mat-table [dataSource]="coupons" class="full-table">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let c">
                  <code class="coupon-code">{{ c.code }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="percent">
                <th mat-header-cell *matHeaderCellDef>Discount</th>
                <td mat-cell *matCellDef="let c"><strong>{{ c.discountPercent }}%</strong></td>
              </ng-container>
              <ng-container matColumnDef="uses">
                <th mat-header-cell *matHeaderCellDef>Uses</th>
                <td mat-cell *matCellDef="let c">{{ c.usedCount }} / {{ c.maxUses }}</td>
              </ng-container>
              <ng-container matColumnDef="expires">
                <th mat-header-cell *matHeaderCellDef>Expires</th>
                <td mat-cell *matCellDef="let c">
                  {{ c.expiresAt ? (c.expiresAt | date:'dd MMM yyyy') : 'Never' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let c">
                  <span class="status-chip" [ngClass]="c.isActive ? 'status-active' : 'status-inactive'">
                    {{ c.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="couponActions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let c">
                  <button mat-stroked-button [color]="c.isActive ? 'warn' : 'primary'" class="action-btn"
                    (click)="toggleCoupon(c.id, !c.isActive)">
                    {{ c.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button mat-icon-button color="warn" matTooltip="Delete" (click)="deleteCoupon(c.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="couponCols"></tr>
              <tr mat-row *matRowDef="let row; columns: couponCols;"></tr>
            </table>
          </div>

          <div class="empty-state" *ngIf="!couponsLoading && coupons.length === 0">
            <mat-icon class="big-icon">confirmation_number</mat-icon>
            <p>No coupons yet. Create your first one!</p>
          </div>
        </div>
      </mat-tab>

      <!-- Tab 4: Reviews Moderation -->
      <mat-tab label="⭐ Reviews">
        <div class="tab-content">
          <div class="tab-header-info" *ngIf="pendingReviews.length > 0">
            {{ pendingReviews.length }} review(s) awaiting approval
          </div>
          
          <div class="spinner-wrap" *ngIf="reviewsLoading"><mat-spinner></mat-spinner></div>
          
          <div class="empty-state" *ngIf="!reviewsLoading && pendingReviews.length === 0">
            <mat-icon class="big-icon">rate_review</mat-icon>
            <p>No reviews pending approval</p>
          </div>

          <div class="review-moderation-list" *ngIf="!reviewsLoading && pendingReviews.length > 0">
            <mat-card class="review-mod-card" *ngFor="let r of pendingReviews">
              <div class="mod-header">
                <div class="mod-avatar">{{ r.userName[0] }}</div>
                <div class="mod-info">
                  <strong>{{ r.userName }}</strong>
                  <span class="mod-product">on {{ r.productName }}</span>
                  <span class="mod-date">{{ r.createdAt | date:'dd MMM yyyy' }}</span>
                </div>
                <div class="mod-rating">
                  <mat-icon *ngFor="let s of [1,2,3,4,5]" 
                    [style.color]="s <= r.rating ? '#f59e0b' : '#d1d5db'"
                    style="font-size:16px">star</mat-icon>
                </div>
              </div>
              <p class="mod-comment">{{ r.comment }}</p>
              <div class="mod-actions">
                <button mat-raised-button color="primary" (click)="approveReview(r)">
                  <mat-icon>check</mat-icon> Approve
                </button>
                <button mat-stroked-button color="warn" (click)="deleteReview(r)">
                  <mat-icon>delete</mat-icon> Reject
                </button>
              </div>
            </mat-card>
          </div>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    h1 { font-size:2rem; margin-bottom:24px; }
    .summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
    .stat-card { text-align:center; padding:8px; }
    .stat-icon { font-size:2rem; margin-bottom:4px; }
    .stat-label { color:#666; font-size:.9rem; margin-bottom:6px; }
    .stat-value { font-size:1.8rem; font-weight:800; }
    .green { color:#2e7d32; }
    .tab-content { padding:20px 0; }
    .filter-bar { display:flex; flex-wrap:wrap; gap:16px; align-items:center; margin-bottom:16px; }
    .filter-bar mat-form-field { flex:1; min-width:160px; }
    .status-filter { min-width:220px; }
    .spinner-wrap { display:flex; justify-content:center; padding:60px; }
    .empty-state { text-align:center; padding:60px; color:#9e9e9e; }
    .big-icon { font-size:64px; width:64px; height:64px; }
    .table-wrap { border:1px solid #e0e0e0; border-radius:8px; overflow:hidden; }
    .full-table { width:100%; }
    .truncate { max-width:160px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .status-chip { padding:3px 12px; border-radius:16px; font-size:.8rem; font-weight:600; }
    .status-pending   { background:#f5f5f5; color:#616161; }
    .status-succeeded { background:#e8f5e9; color:#2e7d32; }
    .status-failed    { background:#ffebee; color:#c62828; }
    .status-processing { background:#e3f2fd; color:#1565c0; }
    .status-shipped    { background:#fff3e0; color:#e65100; }
    .status-delivered  { background:#e8f5e9; color:#2e7d32; }
    .status-cancelled  { background:#ffebee; color:#c62828; }
    .status-refunded   { background:#f3e5f5; color:#6a1b9a; }
    .status-active     { background:#e8f5e9; color:#2e7d32; }
    .status-inactive   { background:#f5f5f5; color:#616161; }
    .refund-btn { font-size:.8rem; height:32px; line-height:32px; padding:0 12px; }
    .update-row { display:flex; align-items:center; gap:4px; }
    .status-select { min-width:120px; font-size:.85rem; }
    .coupon-header { margin-bottom:16px; }
    .coupon-form-card { margin-bottom:16px; }
    .coupon-form-row { display:flex; flex-wrap:wrap; gap:12px; align-items:flex-start; }
    .coupon-form-row mat-form-field { flex:1; min-width:140px; }
    .coupon-code { font-size:1rem; font-weight:700; background:#e8eaf6; padding:4px 10px; border-radius:6px; }
    .action-btn { font-size:.8rem; height:32px; line-height:32px; padding:0 12px; margin-right:4px; }
    .tab-header-info { background:#fff8f0; border:1px solid #f0e6d3; 
      border-radius:8px; padding:10px 16px; margin-bottom:16px;
      color:#92400e; font-weight:600; font-size:.9rem; }
    .review-mod-card { margin-bottom:12px; padding:4px; }
    .mod-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:12px; }
    .mod-avatar { width:36px; height:36px; border-radius:50%;
      background:linear-gradient(135deg,#f57c00,#e65100); color:white;
      display:flex; align-items:center; justify-content:center;
      font-weight:700; flex-shrink:0; }
    .mod-info { flex:1; display:flex; flex-direction:column; gap:2px; }
    .mod-product { font-size:.8rem; color:#6b7280; }
    .mod-date { font-size:.75rem; color:#9ca3af; }
    .mod-rating { display:flex; align-items:center; }
    .mod-comment { color:#374151; line-height:1.6; margin:0 0 12px;
      background:#f9f9f9; padding:10px 12px; border-radius:8px; font-size:.9rem; }
    .mod-actions { display:flex; gap:8px; }
  `]
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
  coupons: any[] = [];
  couponsLoading = false;
  showCouponForm = false;
  newCoupon = { code: '', discountPercent: 10, maxUses: 100, expiresAt: null as Date | null };

  // Reviews Moderation
  pendingReviews: any[] = [];
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
