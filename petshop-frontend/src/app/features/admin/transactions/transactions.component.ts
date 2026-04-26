import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentStatus, Transaction } from '../../../core/models/payment.models';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatCardModule, MatChipsModule, MatTooltipModule],
  template: `
    <h1>Payment Transactions</h1>

    <!-- Summary cards -->
    <div class="summary-grid">
      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value green">{{ totalRevenue | currency:'EUR' }}</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-label">Transactions</div>
          <div class="stat-value">{{ transactions.length }}</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-label">Success Rate</div>
          <div class="stat-value green">{{ successRate }}</div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Filters -->
    <form [formGroup]="filterForm" class="filter-bar">
      <mat-form-field appearance="outline">
        <mat-label>From</mat-label>
        <input matInput [matDatepicker]="fromPicker" formControlName="from">
        <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
        <mat-datepicker #fromPicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>To</mat-label>
        <input matInput [matDatepicker]="toPicker" formControlName="to">
        <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
        <mat-datepicker #toPicker></mat-datepicker>
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="applyFilters()">
        <mat-icon>filter_list</mat-icon> Apply
      </button>
      <button mat-stroked-button (click)="clearFilters()">
        <mat-icon>clear</mat-icon> Clear
      </button>
    </form>

    <!-- Loading -->
    <div class="spinner-wrap" *ngIf="isLoading"><mat-spinner></mat-spinner></div>

    <!-- Empty -->
    <div class="empty-state" *ngIf="!isLoading && transactions.length === 0">
      <mat-icon class="big-icon">payments</mat-icon>
      <p>No transactions found</p>
    </div>

    <!-- Table -->
    <div class="table-wrap" *ngIf="!isLoading && transactions.length > 0">
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
        <ng-container matColumnDef="currency">
          <th mat-header-cell *matHeaderCellDef>Currency</th>
          <td mat-cell *matCellDef="let t">{{ t.currency.toUpperCase() }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let t">
            <span class="status-chip" [ngClass]="getStatusClass(t.status)">{{ getStatusLabel(t.status) }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let t">{{ t.createdAt | date:'dd MMM yyyy HH:mm' }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
    </div>
  `,
  styles: [`
    h1 { font-size:2rem; margin-bottom:24px; }
    .summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
    .stat-card { text-align:center; padding:8px; }
    .stat-label { color:#666; font-size:.9rem; margin-bottom:8px; }
    .stat-value { font-size:1.8rem; font-weight:800; }
    .green { color:#2e7d32; }
    .filter-bar { display:flex; flex-wrap:wrap; gap:16px; align-items:center; margin-bottom:24px; }
    .filter-bar mat-form-field { flex:1; min-width:160px; }
    .spinner-wrap { display:flex; justify-content:center; padding:80px; }
    .empty-state { text-align:center; padding:60px; color:#9e9e9e; }
    .big-icon { font-size:64px; width:64px; height:64px; }
    .table-wrap { border:1px solid #e0e0e0; border-radius:8px; overflow:hidden; }
    .full-table { width:100%; }
    .truncate { max-width:160px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .status-chip { padding:3px 12px; border-radius:16px; font-size:.8rem; font-weight:600; }
    .status-pending   { background:#f5f5f5; color:#616161; }
    .status-succeeded { background:#e8f5e9; color:#2e7d32; }
    .status-failed    { background:#ffebee; color:#c62828; }
  `]
})
export default class TransactionsComponent implements OnInit {
  cols = ['txId','orderId','intent','amount','currency','status','date'];
  transactions: Transaction[] = [];
  isLoading = false;

  filterForm = this.fb.group({ from: [null as Date | null], to: [null as Date | null] });

  get totalRevenue(): number {
    return this.transactions.filter(t => t.status === PaymentStatus.Succeeded)
      .reduce((sum, t) => sum + t.amount, 0);
  }
  get successRate(): string {
    if (!this.transactions.length) return '—';
    const n = this.transactions.filter(t => t.status === PaymentStatus.Succeeded).length;
    return (n / this.transactions.length * 100).toFixed(1) + '%';
  }

  constructor(private paymentSvc: PaymentService, private fb: FormBuilder) {}

  ngOnInit(): void { this.loadTransactions(); }

  loadTransactions(from?: Date, to?: Date): void {
    this.isLoading = true;
    this.paymentSvc.getTransactions(from, to).subscribe({
      next: t  => { this.transactions = t; this.isLoading = false; },
      error: () => this.isLoading = false,
    });
  }

  applyFilters(): void {
    const { from, to } = this.filterForm.value;
    this.loadTransactions(from ?? undefined, to ?? undefined);
  }

  clearFilters(): void { this.filterForm.reset(); this.loadTransactions(); }

  getStatusLabel(s: PaymentStatus): string {
    return { [PaymentStatus.Pending]:'Pending', [PaymentStatus.Succeeded]:'Succeeded', [PaymentStatus.Failed]:'Failed' }[s] ?? '—';
  }
  getStatusClass(s: PaymentStatus): string {
    return { [PaymentStatus.Pending]:'status-pending', [PaymentStatus.Succeeded]:'status-succeeded', [PaymentStatus.Failed]:'status-failed' }[s] ?? '';
  }
}
