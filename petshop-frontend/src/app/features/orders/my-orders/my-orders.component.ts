import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { OrderService } from '../../../core/services/order.service';
import { OrderStatus, OrderSummary } from '../../../core/models/order.models';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatExpansionModule, MatDividerModule, MatTableModule],
  template: `
    <h1 class="page-title">My Orders</h1>
    <div class="spinner-wrap" *ngIf="isLoading"><mat-spinner></mat-spinner></div>

    <!-- Empty state -->
    <div class="empty-state" *ngIf="!isLoading && orders.length === 0">
      <mat-icon class="big-icon">receipt_long</mat-icon>
      <h3>No orders yet</h3>
      <a mat-raised-button color="primary" routerLink="/products">Start Shopping</a>
    </div>

    <!-- Orders -->
    <mat-accordion *ngIf="!isLoading && orders.length > 0">
      <mat-expansion-panel *ngFor="let order of orders" class="order-panel">
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

        <!-- Panel content (detail) — loaded lazily via separate call if needed -->
        <div class="order-detail">
          <p class="detail-label">Order ID: <code>{{ order.id }}</code></p>
          <p class="detail-label">Items: {{ order.itemCount }}</p>
          <p class="detail-label">Total: <strong>{{ order.totalAmount | currency:'EUR' }}</strong></p>
          <a mat-stroked-button [routerLink]="['/orders', order.id]" *ngIf="false">View Full Details</a>
        </div>
      </mat-expansion-panel>
    </mat-accordion>
  `,
  styles: [`
    .page-title { font-size:2rem; margin-bottom:24px; }
    .spinner-wrap { display:flex; justify-content:center; padding:80px; }
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
    .order-detail { padding:16px 0; color:#555; }
    .detail-label { margin:4px 0; }
  `]
})
export default class MyOrdersComponent implements OnInit {
  orders: OrderSummary[] = [];
  isLoading = true;

  constructor(private orderSvc: OrderService) {}

  ngOnInit(): void {
    this.orderSvc.getMyOrders().subscribe({
      next: o  => { this.orders = o; this.isLoading = false; },
      error: () => { this.isLoading = false; },
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
}
