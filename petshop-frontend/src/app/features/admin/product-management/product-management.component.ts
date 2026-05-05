import { Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { ProductService } from '../../../core/services/product.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Product, ProductFilter } from '../../../core/models/product.models';

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule,
    MatDividerModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.editMode ? 'Edit Product' : 'Add New Product' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="product-form">
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name">
          <mat-error>Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
          <mat-error>Required</mat-error>
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Price (EUR)</mat-label>
            <input matInput type="number" formControlName="price" min="0.01" step="0.01">
            <mat-error>Min €0.01</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Stock</mat-label>
            <input matInput type="number" formControlName="stockQuantity" min="0">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="category">
              <mat-option *ngFor="let c of categoryOptions" [value]="c.value">
                {{ c.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Image URL (optional)</mat-label>
          <input matInput formControlName="imageUrl">
        </mat-form-field>
        <mat-slide-toggle formControlName="isAvailable" color="primary">
          Available for sale
        </mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving">
        <mat-icon>save</mat-icon> Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .product-form { display:flex; flex-direction:column; gap:8px; padding:8px 0; min-width:500px; }
    .form-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
    .form-row mat-form-field { width:100%; }
    .full-w { width:100%; }
  `]
})
export class ProductDialogComponent {
  saving = false;
  categoryOptions = [
    {value:0,label:'Dogs'},{value:1,label:'Cats'},{value:2,label:'Birds'},
    {value:3,label:'Fish'},{value:4,label:'Reptiles'},{value:5,label:'Small Animals'},
    {value:6,label:'Food'},{value:7,label:'Toys'},{value:8,label:'Accessories'},
    {value:9,label:'Healthcare'},
  ];

  form = this.fb.group({
    name:          [this.data.product?.name ?? '', Validators.required],
    description:   [this.data.product?.description ?? '', Validators.required],
    price:         [this.data.product?.price ?? 0, [Validators.required, Validators.min(0.01)]],
    stockQuantity: [this.data.product?.stockQuantity ?? 0, [Validators.required, Validators.min(0)]],
    category:      [this.data.product?.category ?? 0, Validators.required],
    imageUrl:      [this.data.product?.imageUrl ?? ''],
    isAvailable:   [this.data.product?.isAvailable ?? true],
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { product?: Product; editMode: boolean }
  ) {}

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }
}

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatCardModule, MatChipsModule, MatPaginatorModule, MatTooltipModule,
    MatSlideToggleModule, MatDividerModule, MatDialogModule, ProductDialogComponent],
  template: `
    <div class="page-header">
      <h1>Product Management</h1>
      <button mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Add Product
      </button>
    </div>

    <mat-form-field appearance="outline" class="search-field">
      <mat-label>Search products...</mat-label>
      <input matInput [formControl]="searchCtrl">
      <mat-icon matSuffix>search</mat-icon>
    </mat-form-field>

    <div class="table-wrap">
      <div class="spinner-overlay" *ngIf="isLoading">
        <mat-spinner diameter="48"></mat-spinner>
      </div>
      <table mat-table [dataSource]="products" class="full-table">
        <ng-container matColumnDef="image">
          <th mat-header-cell *matHeaderCellDef>Image</th>
          <td mat-cell *matCellDef="let p">
            <img [src]="p.imageUrl || 'https://placehold.co/48x48?text=?'" class="thumb">
          </td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let p"><strong>{{ p.name }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef>Category</th>
          <td mat-cell *matCellDef="let p">{{ getCategoryLabel(p.category) }}</td>
        </ng-container>
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Price</th>
          <td mat-cell *matCellDef="let p">{{ p.price | currency:'EUR' }}</td>
        </ng-container>
        <ng-container matColumnDef="stock">
          <th mat-header-cell *matHeaderCellDef>Stock</th>
          <td mat-cell *matCellDef="let p">
            <span [class]="'stock-num ' + getStockClass(p.stockQuantity)">{{ p.stockQuantity }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="available">
          <th mat-header-cell *matHeaderCellDef>Available</th>
          <td mat-cell *matCellDef="let p">
            <span class="avail-chip" [class.yes]="p.isAvailable" [class.no]="!p.isAvailable">
              {{ p.isAvailable ? 'Yes' : 'No' }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let p">
            <button mat-icon-button color="primary" matTooltip="Edit" (click)="openForm(p)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" matTooltip="Delete" (click)="deleteProduct(p.id)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
      <mat-paginator [length]="totalCount" [pageSize]="filter.pageSize"
        [pageIndex]="filter.page - 1" [pageSizeOptions]="[5,10,25]"
        (page)="onPage($event)"></mat-paginator>
    </div>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    h1 { font-size:2rem; margin:0; }
    .search-field { width:100%; margin-bottom:16px; }
    .table-wrap { position:relative; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden; margin-bottom:24px; }
    .spinner-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.8); z-index:10; }
    .full-table { width:100%; }
    .thumb { width:48px; height:48px; object-fit:cover; border-radius:6px; }
    .stock-num { font-weight:700; padding:2px 8px; border-radius:12px; }
    .stock-zero { background:#ffebee; color:#c62828; }
    .stock-low  { background:#fff3e0; color:#e65100; }
    .stock-ok   { background:#e8f5e9; color:#2e7d32; }
    .avail-chip { padding:3px 10px; border-radius:12px; font-size:.8rem; font-weight:600; }
    .yes { background:#e8f5e9; color:#2e7d32; } .no { background:#ffebee; color:#c62828; }
  `]
})
export default class ProductManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cols = ['image','name','category','price','stock','available','actions'];
  products: Product[] = [];
  totalCount = 0;
  isLoading = false;
  filter: ProductFilter = { page: 1, pageSize: 10 };
  searchCtrl = new FormControl('');

  categoryOptions = [
    {value:0,label:'Dogs'},{value:1,label:'Cats'},{value:2,label:'Birds'},
    {value:3,label:'Fish'},{value:4,label:'Reptiles'},{value:5,label:'Small Animals'},
    {value:6,label:'Food'},{value:7,label:'Toys'},{value:8,label:'Accessories'},{value:9,label:'Healthcare'},
  ];

  constructor(
    private productSvc: ProductService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.searchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(t => {
        this.filter.searchTerm = t || undefined;
        this.filter.page = 1;
        this.loadProducts();
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadProducts(): void {
    this.isLoading = true;
    this.productSvc.getProducts(this.filter).subscribe({
      next: r  => { this.products = r.items; this.totalCount = r.totalCount; this.isLoading = false; },
      error: () => this.isLoading = false,
    });
  }

  openForm(product?: Product): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '640px',
      data: { product, editMode: !!product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const obs = product
        ? this.productSvc.update(product.id, result)
        : this.productSvc.create(result);
      obs.subscribe({
        next: () => {
          this.notify.showSuccess('Product saved!');
          this.loadProducts();
        },
        error: () => {}
      });
    });
  }

  deleteProduct(id: string): void {
    if (!window.confirm('Delete this product?')) return;
    this.productSvc.delete(id).subscribe(() => {
      this.notify.showSuccess('Product deleted'); this.loadProducts();
    });
  }

  onPage(e: PageEvent): void { this.filter.page = e.pageIndex + 1; this.filter.pageSize = e.pageSize; this.loadProducts(); }
  getCategoryLabel(v: number): string { return this.categoryOptions.find(c => c.value === v)?.label ?? '—'; }
  getStockClass(s: number): string { return s === 0 ? 'stock-zero' : s < 10 ? 'stock-low' : 'stock-ok'; }
}
