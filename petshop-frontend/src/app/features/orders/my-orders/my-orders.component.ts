import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject, takeUntil } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrderService } from '../../../core/services/order.service';
import { OrderStatus, OrderSummary, Order } from '../../../core/models/order.models';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatExpansionModule, MatDividerModule,
    MatTableModule, MatTooltipModule],
  template: `
    <h1 class="page-title-warm">📦 My Orders</h1>
    <div class="spinner-wrap" *ngIf="isLoading"><mat-spinner></mat-spinner></div>

    <!-- Empty state -->
    <div class="empty-state" *ngIf="!isLoading && orders.length === 0">
      <mat-icon class="big-icon">receipt_long</mat-icon>
      <h3>No orders yet</h3>
      <a mat-raised-button color="primary" routerLink="/products">Start Shopping</a>
    </div>

    <!-- Orders -->
    <mat-accordion *ngIf="!isLoading && orders.length > 0">
      <mat-expansion-panel *ngFor="let order of orders" class="order-panel"
        (opened)="loadOrderDetails(order.id)">
        <mat-expansion-panel-header>
          <mat-panel-title class="panel-title">
            <span class="order-id">#{{ order.id.slice(0,8).toUpperCase() }}</span>
            <span class="order-date">{{ order.orderDate | date:'dd MMM yyyy' }}</span>
          </mat-panel-title>
          <mat-panel-description class="panel-desc">
            <span class="order-total">{{ order.totalAmount | currency:'EUR' }}</span>
            <span class="status-chip" [ngClass]="getStatusClass(order.status)">
              {{ getStatusLabel(order.status) }}
            </span>
          </mat-panel-description>
        </mat-expansion-panel-header>

        <!-- Panel content — loaded lazily -->
        <div class="order-detail">
          <div class="spinner-wrap-sm" *ngIf="!expandedOrders[order.id]">
            <mat-spinner diameter="32"></mat-spinner>
          </div>

          <ng-container *ngIf="expandedOrders[order.id] as full">
            <div class="review-hint" *ngIf="isEligibleForReview(order.status)">
              ⭐ You can now rate the products from this order!
            </div>

            <!-- Timeline -->
            <div class="order-timeline">
              <div class="timeline-step" *ngFor="let step of getTimeline(order.status)"
                [class.completed]="step.completed" [class.active]="step.active">
                <div class="step-icon">
                  <mat-icon>{{ step.icon }}</mat-icon>
                </div>
                <div class="step-label">{{ step.label }}</div>
              </div>
            </div>

            <!-- Items table -->
            <table class="items-table">
              <thead>
                <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of full.items">
                  <td class="item-cell">
                    <img [src]="item.productImageUrl || 'https://placehold.co/40x40?text=?'" class="item-thumb">
                    <span>{{ item.productName }}</span>
                  </td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unitPrice | currency:'EUR' }}</td>
                  <td><strong>{{ item.totalPrice | currency:'EUR' }}</strong></td>
                  <td style="text-align: right">
                    <a mat-stroked-button [routerLink]="['/products', item.productId]"
                      [fragment]="'reviews'"
                      *ngIf="isEligibleForReview(order.status)"
                      class="review-btn" style="font-size:.75rem; height:28px; line-height:28px;">
                      <mat-icon style="font-size:14px">star</mat-icon> Rate
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>

            <mat-divider style="margin:12px 0"></mat-divider>

            <div class="detail-meta">
              <p *ngIf="full.shippingAddress">
                <mat-icon class="meta-icon">local_shipping</mat-icon>
                <strong>Shipping:</strong> {{ full.shippingAddress }}
              </p>
              <p *ngIf="full.stripePaymentIntentId">
                <mat-icon class="meta-icon">payment</mat-icon>
                <strong>Payment:</strong>
                <code [matTooltip]="full.stripePaymentIntentId!">
                  {{ full.stripePaymentIntentId!.slice(0, 24) }}...
                </code>
              </p>
            </div>
          </ng-container>
        </div>
      </mat-expansion-panel>
    </mat-accordion>
  `,
  styles: [`
    .page-title { font-size:2rem; margin-bottom:24px; }
    .spinner-wrap { display:flex; justify-content:center; padding:80px; }
    .spinner-wrap-sm { display:flex; justify-content:center; padding:20px; }
    .empty-state { text-align:center; padding:80px; color:#9e9e9e; }
    .big-icon { font-size:72px; width:72px; height:72px; }
    .order-panel { margin-bottom:8px; }
    .panel-title { display:flex; align-items:center; gap:16px; }
    .panel-desc { display:flex; align-items:center; gap:16px; justify-content:flex-end; }
    .order-id { font-weight:700; font-family:monospace; }
    .order-date { color:#666; font-size:.9rem; }
    .order-total { font-weight:700; color:#3f51b5; }
    .status-chip { padding:3px 12px; border-radius:16px; font-size:.8rem; font-weight:600; }
    .status-pending    { background:#f5f5f5; color:#616161; }
    .status-processing { background:#e3f2fd; color:#1565c0; }
    .status-shipped    { background:#fff3e0; color:#e65100; }
    .status-delivered  { background:#e8f5e9; color:#2e7d32; }
    .status-cancelled  { background:#ffebee; color:#c62828; }
    .status-refunded   { background:#f3e5f5; color:#6a1b9a; }
    .order-detail { padding:8px 0; }
    .items-table { width:100%; border-collapse:collapse; font-size:.9rem; }
    .items-table th { text-align:left; padding:8px; border-bottom:2px solid #e0e0e0; font-weight:600; }
    .items-table td { padding:8px; border-bottom:1px solid #f0f0f0; }
    .item-cell { display:flex; align-items:center; gap:10px; }
    .item-thumb { width:40px; height:40px; border-radius:6px; object-fit:cover; }
    .detail-meta { color:#555; }
    .detail-meta p { display:flex; align-items:center; gap:8px; margin:6px 0; }
    .meta-icon { font-size:18px; width:18px; height:18px; color:#888; }
    code { background:#f5f5f5; padding:2px 6px; border-radius:4px; font-size:.8rem; }
    .review-hint {
      background: #fff8f0; border: 1px solid #f0e6d3;
      border-radius: 8px; padding: 8px 14px;
      font-size: .85rem; font-weight: 500; color: #92400e;
      margin-bottom: 16px;
    }
    .review-btn { min-width: unset !important; }
    
    .order-timeline {
      display: flex; align-items: flex-start;
      justify-content: space-between; padding: 16px 0 24px;
      position: relative;
    }
    .order-timeline::before {
      content: ''; position: absolute; top: 38px; left: 10%; right: 10%;
      height: 2px; background: #e5e7eb; z-index: 0;
    }
    .timeline-step {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; position: relative; z-index: 1; flex: 1;
    }
    .step-icon {
      width: 44px; height: 44px; border-radius: 50%;
      background: #f3f4f6; border: 2px solid #e5e7eb;
      display: flex; align-items: center; justify-content: center;
      transition: all .3s; color: #9ca3af;
    }
    .step-label { font-size: .75rem; font-weight: 600; color: #9ca3af; text-align: center; }
    .timeline-step.completed .step-icon {
      background: #dcfce7; border-color: #16a34a; color: #16a34a;
    }
    .timeline-step.completed .step-label { color: #16a34a; }
    .timeline-step.active .step-icon {
      background: linear-gradient(135deg, #f57c00, #e65100);
      border-color: #f57c00; color: white;
      box-shadow: 0 4px 12px rgba(245,124,0,.4);
      animation: pulse-warm 2s ease-in-out infinite;
    }
    .timeline-step.active .step-label { color: #f57c00; font-weight: 700; }
    @keyframes pulse-warm {
      0%, 100% { box-shadow: 0 4px 12px rgba(245,124,0,.4); }
      50% { box-shadow: 0 4px 20px rgba(245,124,0,.7); }
    }
  `]
})
export default class MyOrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  orders: OrderSummary[] = [];
  isLoading = true;
  expandedOrders: Record<string, Order> = {};

  constructor(private orderSvc: OrderService) {}

  ngOnInit(): void {
    this.orderSvc.getMyOrders().pipe(takeUntil(this.destroy$)).subscribe({
      next: o  => { this.orders = o; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadOrderDetails(orderId: string): void {
    if (this.expandedOrders[orderId]) return;
    this.orderSvc.getOrderById(orderId).pipe(takeUntil(this.destroy$)).subscribe({
      next: full => this.expandedOrders[orderId] = full,
      error: () => {} // silently fail
    });
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.Pending]:    'Pending',
      [OrderStatus.Processing]: 'Processing',
      [OrderStatus.Shipped]:    'Shipped',
      [OrderStatus.Delivered]:  'Delivered',
      [OrderStatus.Cancelled]:  'Cancelled',
      [OrderStatus.Refunded]:   'Refunded',
    };
    return labels[status] ?? 'Unknown';
  }

  getStatusClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      [OrderStatus.Pending]:    'status-pending',
      [OrderStatus.Processing]: 'status-processing',
      [OrderStatus.Shipped]:    'status-shipped',
      [OrderStatus.Delivered]:  'status-delivered',
      [OrderStatus.Cancelled]:  'status-cancelled',
      [OrderStatus.Refunded]:   'status-refunded',
    };
    return classes[status] ?? '';
  }

  getTimeline(status: OrderStatus): { icon: string; label: string; completed: boolean; active: boolean }[] {
    const steps = [
      { icon: 'shopping_cart', label: 'Ordered',    status: OrderStatus.Pending },
      { icon: 'payments',      label: 'Processing', status: OrderStatus.Processing },
      { icon: 'local_shipping',label: 'Shipped',    status: OrderStatus.Shipped },
      { icon: 'home',          label: 'Delivered',  status: OrderStatus.Delivered },
    ];
    
    const statusOrder = [
      OrderStatus.Pending, OrderStatus.Processing, 
      OrderStatus.Shipped, OrderStatus.Delivered
    ];
    
    const currentIdx = statusOrder.indexOf(status);
    
    return steps.map((step, idx) => ({
      ...step,
      completed: idx < currentIdx,
      active:    idx === currentIdx,
    }));
  }

  isEligibleForReview(status: OrderStatus): boolean {
    return status === OrderStatus.Processing || 
           status === OrderStatus.Shipped || 
           status === OrderStatus.Delivered;
  }
}
