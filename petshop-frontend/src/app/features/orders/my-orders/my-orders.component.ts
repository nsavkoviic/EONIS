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
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
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
