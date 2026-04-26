import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../core/models/order.models';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatCardModule, MatChipsModule,
    MatPaginatorModule, MatExpansionModule, MatDividerModule,
    MatTooltipModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <h1>Order Management</h1>
    </div>

    <!-- Filter -->
    <div class="filter-bar">
      <mat-form-field appearance="outline" class="status-filter">
        <mat-label>Filter by Status</mat-label>
        <mat-select [(ngModel)]="statusFilter" (ngModelChange)="onStatusFilter()">
          <mat-option [value]="undefined">All Orders</mat-option>
          <mat-option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div class="spinner-overlay" *ngIf="isLoading"><mat-spinner diameter="48"></mat-spinner></div>
      <table mat-table [dataSource]="orders" class="full-table">

        <ng-container matColumnDef="orderId">
          <th mat-header-cell *matHeaderCellDef>Order ID</th>
          <td mat-cell *matCellDef="let o"><code class="mono">#{{ o.id.slice(0,8).toUpperCase() }}</code></td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Customer</th>
          <td mat-cell *matCellDef="let o">{{ o.userEmail }}</td>
        </ng-container>
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let o">{{ o.orderDate | date:'dd MMM yyyy' }}</td>
        </ng-container>
        <ng-container matColumnDef="items">
          <th mat-header-cell *matHeaderCellDef>Items</th>
          <td mat-cell *matCellDef="let o">{{ o.items?.length ?? '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let o"><strong>{{ o.totalAmount | currency:'EUR' }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let o">
            <span class="status-chip" [ngClass]="getStatusClass(o.status)">{{ getStatusLabel(o.status) }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let o">
            <div class="action-row">
              <mat-select [(ngModel)]="selectedStatuses[o.id]" class="status-select">
                <mat-option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</mat-option>
              </mat-select>
              <button mat-icon-button color="primary" matTooltip="Update Status"
                (click)="updateStatus(o.id, selectedStatuses[o.id])">
                <mat-icon>save</mat-icon>
              </button>
              <button mat-icon-button matTooltip="View Details"
                (click)="toggleDetails(o.id)">
                <mat-icon>{{ expandedOrderId === o.id ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"
          [class.expanded-row]="expandedOrderId === row.id"></tr>
      </table>

      <mat-paginator [length]="totalCount" [pageSize]="pageSize"
        [pageIndex]="page - 1" [pageSizeOptions]="[10,25,50]"
        (page)="onPage($event)"></mat-paginator>
    </div>

    <!-- Expanded order detail -->
    <mat-card class="detail-card" *ngIf="expandedOrderId && expandedOrder">
      <mat-card-header>
        <mat-card-title>Order #{{ expandedOrder.id.slice(0,8).toUpperCase() }} — Details</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p *ngIf="expandedOrder.shippingAddress"><strong>Shipping:</strong> {{ expandedOrder.shippingAddress }}</p>
        <p *ngIf="expandedOrder.stripePaymentIntentId">
          <strong>Payment:</strong> <code>{{ expandedOrder.stripePaymentIntentId }}</code>
        </p>
        <mat-divider class="divider"></mat-divider>
        <table mat-table [dataSource]="expandedOrder.items" class="items-table">
          <ng-container matColumnDef="product">
            <th mat-header-cell *matHeaderCellDef>Product</th>
            <td mat-cell *matCellDef="let i">{{ i.productName }}</td>
          </ng-container>
          <ng-container matColumnDef="qty">
            <th mat-header-cell *matHeaderCellDef>Qty</th>
            <td mat-cell *matCellDef="let i">{{ i.quantity }}</td>
          </ng-container>
          <ng-container matColumnDef="unit">
            <th mat-header-cell *matHeaderCellDef>Unit Price</th>
            <td mat-cell *matCellDef="let i">{{ i.unitPrice | currency:'EUR' }}</td>
          </ng-container>
          <ng-container matColumnDef="lineTotal">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let i">{{ i.totalPrice | currency:'EUR' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="itemCols"></tr>
          <tr mat-row *matRowDef="let row; columns: itemCols;"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    h1 { font-size:2rem; margin:0; }
    .filter-bar { margin-bottom:16px; }
    .status-filter { min-width:220px; }
    .table-wrap { position:relative; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden; margin-bottom:16px; }
    .spinner-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.8); z-index:10; }
    .full-table { width:100%; }
    .mono { font-family:monospace; font-weight:700; }
    .status-chip { padding:3px 12px; border-radius:16px; font-size:.8rem; font-weight:600; }
    .status-pending    { background:#f5f5f5; color:#616161; }
    .status-processing { background:#e3f2fd; color:#1565c0; }
    .status-shipped    { background:#fff3e0; color:#e65100; }
    .status-delivered  { background:#e8f5e9; color:#2e7d32; }
    .status-cancelled  { background:#ffebee; color:#c62828; }
    .status-refunded   { background:#f3e5f5; color:#6a1b9a; }
    .action-row { display:flex; align-items:center; gap:4px; }
    .status-select { min-width:120px; font-size:.85rem; }
    .expanded-row { background:#f5f5f5; }
    .detail-card { margin-bottom:24px; }
    .divider { margin:12px 0; }
    .items-table { width:100%; }
  `]
})
export default class OrderManagementComponent implements OnInit {
  cols     = ['orderId','email','date','items','total','status','actions'];
  itemCols = ['product','qty','unit','lineTotal'];
  orders: Order[] = [];
  totalCount = 0;
  page = 1; pageSize = 10;
  isLoading = false;
  statusFilter: OrderStatus | undefined = undefined;
  selectedStatuses: Record<string, OrderStatus> = {};
  expandedOrderId: string | null = null;
  expandedOrder: Order | null = null;

  statusOptions = [
    {value: OrderStatus.Pending,    label:'Pending'},
    {value: OrderStatus.Processing, label:'Processing'},
    {value: OrderStatus.Shipped,    label:'Shipped'},
    {value: OrderStatus.Delivered,  label:'Delivered'},
    {value: OrderStatus.Cancelled,  label:'Cancelled'},
    {value: OrderStatus.Refunded,   label:'Refunded'},
  ];

  constructor(private orderSvc: OrderService, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.isLoading = true;
    this.orderSvc.getAllOrders(this.page, this.pageSize, this.statusFilter).subscribe({
      next: r  => { this.orders = r.items; this.totalCount = r.totalCount;
        this.orders.forEach(o => { if (!this.selectedStatuses[o.id]) this.selectedStatuses[o.id] = o.status; });
        this.isLoading = false; },
      error: () => this.isLoading = false,
    });
  }

  onStatusFilter(): void { this.page = 1; this.loadOrders(); }
  onPage(e: PageEvent): void { this.page = e.pageIndex + 1; this.pageSize = e.pageSize; this.loadOrders(); }

  updateStatus(orderId: string, status: OrderStatus): void {
    this.orderSvc.updateStatus(orderId, status).subscribe(() => {
      this.snackBar.open('Status updated', 'Close', { duration: 2000 }); this.loadOrders();
    });
  }

  toggleDetails(orderId: string): void {
    if (this.expandedOrderId === orderId) { this.expandedOrderId = null; this.expandedOrder = null; return; }
    this.expandedOrderId = orderId;
    this.orderSvc.getOrderById(orderId).subscribe(o => this.expandedOrder = o);
  }

  getStatusLabel(s: OrderStatus): string {
    return this.statusOptions.find(x => x.value === s)?.label ?? 'Unknown';
  }
  getStatusClass(s: OrderStatus): string {
    const m: Record<number, string> = {
      0:'status-pending',1:'status-processing',2:'status-shipped',
      3:'status-delivered',4:'status-cancelled',5:'status-refunded'
    };
    return m[s] ?? '';
  }
}
