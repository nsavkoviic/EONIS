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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule,
    MatDividerModule, MatIconModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ data.editMode ? ('ADMIN.EDIT_PRODUCT' | translate) : ('ADMIN.ADD_PRODUCT' | translate) }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="product-form">
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>{{ 'ADMIN.NAME' | translate }}</mat-label>
          <input matInput formControlName="name">
          <mat-error>Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>{{ 'ADMIN.DESCRIPTION' | translate }}</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
          <mat-error>Required</mat-error>
        </mat-form-field>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'ADMIN.PRICE' | translate }}</mat-label>
            <input matInput type="number" formControlName="price" min="0.01" step="0.01">
            <mat-error>Min €0.01</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'ADMIN.STOCK' | translate }}</mat-label>
            <input matInput type="number" formControlName="stockQuantity" min="0">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'ADMIN.CATEGORY' | translate }}</mat-label>
            <mat-select formControlName="category">
              <mat-option *ngFor="let c of categoryOptions" [value]="c.value">
                {{ c.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>{{ 'ADMIN.IMAGE_URL' | translate }}</mat-label>
          <input matInput formControlName="imageUrl">
        </mat-form-field>
        <mat-slide-toggle formControlName="isAvailable" color="primary">
          {{ 'ADMIN.AVAILABLE' | translate }}
        </mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'ADMIN.CANCEL' | translate }}</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving">
        <mat-icon>save</mat-icon> {{ 'ADMIN.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.product-form { display:flex; flex-direction:column; gap:8px; padding:8px 0; min-width:500px; } .form-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; } .form-row mat-form-field { width:100%; } .full-w { width:100%; }`]
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
    MatSlideToggleModule, MatDividerModule, MatDialogModule, ProductDialogComponent, TranslateModule],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss']
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
    private notify: NotificationService,
    private translate: TranslateService
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
          this.notify.showSuccess(this.translate.instant('TOAST.PRODUCT_SAVED'));
          this.loadProducts();
        },
        error: () => {}
      });
    });
  }

  deleteProduct(id: string): void {
    if (!window.confirm('Delete this product?')) return;
    this.productSvc.delete(id).subscribe(() => {
      this.notify.showSuccess(this.translate.instant('TOAST.PRODUCT_DELETED')); this.loadProducts();
    });
  }

  onPage(e: PageEvent): void { this.filter.page = e.pageIndex + 1; this.filter.pageSize = e.pageSize; this.loadProducts(); }
  getCategoryLabel(v: number): string { return this.categoryOptions.find(c => c.value === v)?.label ?? '—'; }
  getStockClass(s: number): string { return s === 0 ? 'stock-zero' : s < 10 ? 'stock-low' : 'stock-ok'; }
}
