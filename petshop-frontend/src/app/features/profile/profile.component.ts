import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../core/services/user.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { PetEntry, UserProfileDto } from '../../core/models/auth.models';
import { Product } from '../../core/models/product.models';

import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatDividerModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div class="profile-page" *ngIf="profile; else loadingTpl">

      <!-- Header -->
      <div class="profile-header">
        <div class="avatar">{{ initials }}</div>
        <div>
          <h1>{{ profile.firstName }} {{ profile.lastName }}</h1>
          <p class="email">{{ profile.email }}</p>
        </div>
      </div>

      <!-- SECTION 1: Personal Info -->
      <mat-card class="section-card">
        <mat-card-header><mat-card-title>👤 Personal Info</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="infoForm" class="info-form">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName">
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phoneNumber">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Address</mat-label>
              <input matInput formControlName="address">
            </mat-form-field>
          </form>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-raised-button color="primary" (click)="savePersonal()" [disabled]="savingInfo">
            <mat-icon>save</mat-icon> Save Changes
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- SECTION 2: Pets & Preferences -->
      <mat-card class="section-card">
        <mat-card-header><mat-card-title>🐾 My Pets & Preferences</mat-card-title></mat-card-header>
        <mat-card-content>

          <h3 class="sub-label">Which animals do you have or love?</h3>
          <div class="animal-grid">
            <button *ngFor="let a of animalOptions" mat-stroked-button
              [class.selected]="favAnimals.includes(a.value)"
              (click)="toggleAnimal(a.value)" class="animal-btn">
              {{ a.emoji }} {{ a.label }}
            </button>
          </div>

          <mat-divider style="margin:20px 0"></mat-divider>

          <h3 class="sub-label">My Current Pets</h3>
          <div class="pet-list">
            <div class="pet-card" *ngFor="let pet of currentPets; let i = index">
              <span class="pet-emoji">{{ getEmoji(pet.animalType) }}</span>
              <div class="pet-info">
                <strong>{{ pet.name }}</strong>
                <span *ngIf="pet.breed"> · {{ pet.breed }}</span>
                <span *ngIf="pet.ageYears"> · {{ pet.ageYears }} yr</span>
              </div>
              <button mat-icon-button color="warn" (click)="removePet(i)"><mat-icon>close</mat-icon></button>
            </div>
            <p *ngIf="currentPets.length === 0" class="empty-pets">No pets added yet. Add one below!</p>
          </div>

          <div class="add-pet-row">
            <mat-form-field appearance="outline" class="pet-field">
              <mat-label>Type</mat-label>
              <mat-select [(ngModel)]="newPet.animalType">
                <mat-option *ngFor="let a of animalOptions" [value]="a.value">{{ a.emoji }} {{ a.label }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="pet-field">
              <mat-label>Name</mat-label>
              <input matInput [(ngModel)]="newPet.name">
            </mat-form-field>
            <mat-form-field appearance="outline" class="pet-field-sm">
              <mat-label>Breed</mat-label>
              <input matInput [(ngModel)]="newPet.breed">
            </mat-form-field>
            <mat-form-field appearance="outline" class="pet-field-sm">
              <mat-label>Age</mat-label>
              <input matInput type="number" [(ngModel)]="newPet.ageYears" min="0">
            </mat-form-field>
            <button mat-raised-button color="accent" (click)="addPet()" [disabled]="!newPet.name.trim()">
              <mat-icon>add</mat-icon> Add
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- SECTION 3: Recommendations -->
      <mat-card class="section-card">
        <mat-card-header><mat-card-title>🌟 Recommended for You</mat-card-title></mat-card-header>
        <mat-card-content>
          <div *ngIf="favAnimals.length === 0" class="reco-empty">
            Set your favorite animals above to see personalized recommendations!
          </div>
          <div *ngIf="favAnimals.length > 0 && recoProducts.length === 0 && !recoLoading" class="reco-empty">
            No products found for your favorite category yet.
          </div>
          <div class="spinner-wrap" *ngIf="recoLoading"><mat-spinner diameter="32"></mat-spinner></div>
          
          <div class="reco-grid" *ngIf="recoProducts.length > 0">
            <div class="reco-card" *ngFor="let p of recoProducts"
              (click)="goToProduct(p.id)">
              <div class="reco-img-wrap">
                <img [src]="p.imageUrl || 'https://placehold.co/200x140?text=No+Image'" 
                  [alt]="p.name" class="reco-img">
                <span class="reco-category">{{ getLabel(p.category) }}</span>
              </div>
              <div class="reco-body">
                <div class="reco-name">{{ p.name }}</div>
                <div class="reco-price-row">
                  <span class="reco-price">{{ p.price | currency:'EUR' }}</span>
                  <span class="reco-stock" [class.in]="p.isAvailable" [class.out]="!p.isAvailable">
                    {{ p.isAvailable ? 'In Stock' : 'Out' }}
                  </span>
                </div>
              </div>
              <div class="reco-actions" (click)="$event.stopPropagation()">
                <button class="reco-wish-btn" [class.wished]="wishlistIds.has(p.id)"
                  (click)="toggleRecoWishlist($event, p)">
                  <mat-icon>{{ wishlistIds.has(p.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
                </button>
                <button class="reco-cart-btn" (click)="addToCart(p)" [disabled]="!p.isAvailable">
                  <mat-icon>add_shopping_cart</mat-icon>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
          <a *ngIf="favAnimals.length > 0" mat-button color="primary"
            [routerLink]="['/products']" [queryParams]="{ category: favAnimals[0] }">
            See all {{ getLabel(favAnimals[0]) }} products →
          </a>
        </mat-card-content>
      </mat-card>
    </div>

    <ng-template #loadingTpl>
      <div class="spinner-wrap"><mat-spinner></mat-spinner></div>
    </ng-template>
  `,
  styles: [`
    .profile-page { max-width:800px; margin:0 auto; }
    .profile-header { display:flex; align-items:center; gap:20px; margin-bottom:24px; }
    .avatar { width:72px; height:72px; border-radius:50%; background: linear-gradient(135deg, #f57c00, #e65100) !important; color:#fff;
      display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:700; }
    .profile-header h1 { margin:0; font-size:1.8rem; }
    .email { color:#888; margin:4px 0 0; }
    .section-card { margin-bottom:20px; }
    .info-form { padding:8px 0; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .form-row mat-form-field, .full-w { width:100%; }
    .sub-label { font-size:1rem; font-weight:600; margin:8px 0 12px; color:#333; }
    .animal-grid { display:flex; flex-wrap:wrap; gap:8px; }
    .animal-btn { border-radius:20px !important; }
    .animal-btn.selected { background:#e8eaf6 !important; border-color:#3f51b5 !important; color:#3f51b5; font-weight:700; }
    .pet-list { margin-bottom:16px; }
    .pet-card { display:flex; align-items:center; gap:10px; padding:8px 12px;
      border:1px solid #e0e0e0; border-radius:8px; margin-bottom:6px; }
    .pet-emoji { font-size:1.6rem; }
    .pet-info { flex:1; }
    .empty-pets { color:#9e9e9e; font-style:italic; }
    .add-pet-row { display:flex; flex-wrap:wrap; gap:8px; align-items:flex-start; }
    .pet-field { flex:1; min-width:120px; }
    .pet-field-sm { flex:0 0 100px; }
    .reco-empty { color:#9e9e9e; text-align:center; padding:24px; font-style:italic; }
    .reco-grid { 
      display: grid; grid-template-columns: 1fr 1fr; 
      gap: 14px; margin-bottom: 16px; 
    }
    .reco-card {
      background: white; border-radius: 14px;
      border: 1px solid var(--border);
      overflow: hidden; display: flex; flex-direction: column;
      cursor: pointer; transition: all .25s cubic-bezier(.4,0,.2,1);
      &:hover { transform: translateY(-4px); border-color: #fed7aa;
        box-shadow: 0 12px 28px rgba(245,124,0,.1); }
    }
    .reco-img-wrap { position: relative; height: 140px; overflow: hidden; }
    .reco-img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
    .reco-card:hover .reco-img { transform: scale(1.05); }
    .reco-category {
      position: absolute; bottom: 8px; left: 8px;
      background: rgba(255,255,255,.9); color: #92400e;
      padding: 2px 8px; border-radius: 10px;
      font-size: .65rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .4px; backdrop-filter: blur(4px);
    }
    .reco-body { padding: 10px 12px; flex: 1; }
    .reco-name { 
      font-weight: 700; font-size: .85rem; color: #1a1a1a;
      margin-bottom: 6px; line-height: 1.3;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .reco-price-row { display: flex; justify-content: space-between; align-items: center; }
    .reco-price { font-size: 1rem; font-weight: 800; color: #f57c00; }
    .reco-stock { font-size: .65rem; padding: 2px 6px; border-radius: 10px; font-weight: 600; }
    .reco-stock.in { background: #dcfce7; color: #166534; }
    .reco-stock.out { background: #fee2e2; color: #991b1b; }
    .reco-actions {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 10px; border-top: 1px solid #f9f0e6;
    }
    .reco-wish-btn {
      width: 32px; height: 32px; border-radius: 8px;
      border: 1px solid var(--border); background: white;
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; transition: all .15s;
      color: #d1d5db;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.wished { color: #ef4444; border-color: #fecaca; background: #fff1f2; }
      &:hover { color: #ef4444; }
    }
    .reco-cart-btn {
      flex: 1; display: flex; align-items: center; justify-content: center;
      gap: 4px; padding: 6px 10px; border-radius: 8px;
      border: none; cursor: pointer; font-size: .8rem; font-weight: 600;
      background: linear-gradient(135deg, #f57c00, #e65100);
      color: white; transition: all .2s; font-family: inherit;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover { opacity: .9; transform: translateY(-1px); }
      &:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    }
    .spinner-wrap { display:flex; justify-content:center; padding:40px; }
    @media (max-width:600px) {
      .form-row { grid-template-columns:1fr; }
      .add-pet-row { flex-direction: column; }
      .pet-field, .pet-field-sm { flex: none; width: 100%; }
      .animal-grid { gap: 6px; }
      .profile-header h1 { font-size: 1.4rem; }
      .reco-grid { grid-template-columns: 1fr; }
    }
  `]
})
export default class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  profile: UserProfileDto | null = null;
  savingInfo = false;
  recoLoading = false;

  favAnimals: number[] = [];
  currentPets: PetEntry[] = [];
  newPet: PetEntry = { animalType: 0, name: '' };
  recoProducts: Product[] = [];
  wishlistIds: Set<string> = new Set();

  animalOptions = [
    { value: 0, label: 'Dogs', emoji: '🐕' },
    { value: 1, label: 'Cats', emoji: '🐈' },
    { value: 2, label: 'Birds', emoji: '🐦' },
    { value: 3, label: 'Fish', emoji: '🐠' },
    { value: 4, label: 'Reptiles', emoji: '🦎' },
    { value: 5, label: 'Small Animals', emoji: '🐹' },
  ];

  infoForm = this.fb.group({
    firstName:   ['', Validators.required],
    lastName:    ['', Validators.required],
    phoneNumber: [''],
    address:     [''],
  });

  get initials(): string {
    return ((this.profile?.firstName?.[0] ?? '') + (this.profile?.lastName?.[0] ?? '')).toUpperCase();
  }

  constructor(
    private fb: FormBuilder,
    private userSvc: UserService,
    private productSvc: ProductService,
    private cartSvc: CartService,
    private notify: NotificationService,
    private wishlistSvc: WishlistService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSvc.getProfile().pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.profile = p;
      this.infoForm.patchValue({
        firstName:   p.firstName,
        lastName:    p.lastName,
        phoneNumber: p.phoneNumber ?? '',
        address:     p.address ?? '',
      });
      this.favAnimals  = [...p.favoriteAnimalTypes];
      this.currentPets = [...p.currentPets];
      this.loadRecommendations();
    });

    this.wishlistSvc.wishlist$.pipe(takeUntil(this.destroy$))
      .subscribe(items => this.wishlistIds = new Set(items.map(i => i.productId)));
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  savePersonal(): void {
    this.savingInfo = true;
    this.userSvc.updateProfile(this.infoForm.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: p => { this.profile = p; this.savingInfo = false; this.notify.showSuccess('Profile updated!'); },
      error: () => this.savingInfo = false,
    });
  }

  toggleAnimal(v: number): void {
    const idx = this.favAnimals.indexOf(v);
    if (idx >= 0) this.favAnimals.splice(idx, 1);
    else this.favAnimals.push(v);
    
    // Auto-save silently
    this.userSvc.updateProfile({ favoriteAnimalTypes: this.favAnimals })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadRecommendations();
          this.notify.showSuccess('Preferences saved!');
        },
        error: () => this.notify.showError('Failed to save preferences')
      });
  }

  addPet(): void {
    if (!this.newPet.name?.trim()) return;
    this.currentPets.push({ ...this.newPet });
    this.newPet = { animalType: 0, name: '' };
    
    // Auto-save silently
    this.userSvc.updateProfile({ currentPets: this.currentPets })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.notify.showSuccess('Pet added!'),
        error: () => {
          this.currentPets.pop(); // revert on error
          this.notify.showError('Failed to save pet');
        }
      });
  }

  removePet(i: number): void {
    this.currentPets.splice(i, 1);
    this.userSvc.updateProfile({ currentPets: this.currentPets })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.notify.showSuccess('Pet removed!'),
        error: () => this.notify.showError('Failed to remove pet')
      });
  }

  loadRecommendations(): void {
    if (!this.favAnimals.length) { this.recoProducts = []; return; }
    this.recoLoading = true;
    this.productSvc.getProducts({ category: this.favAnimals[0], pageSize: 4, page: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => { this.recoProducts = r.items; this.recoLoading = false; },
        error: () => this.recoLoading = false,
      });
  }

  addToCart(p: Product): void {
    this.cartSvc.addItem({ productId: p.id, quantity: 1 }).subscribe({
      next: () => this.notify.showSuccess(`"${p.name}" added to cart!`),
    });
  }

  goToProduct(id: string): void { 
    this.router.navigate(['/products', id]); 
  }

  toggleRecoWishlist(event: MouseEvent, p: Product): void {
    event.stopPropagation();
    if (this.wishlistIds.has(p.id)) {
      this.wishlistSvc.removeFromWishlist(p.id).subscribe(() =>
        this.notify.showSuccess('Removed from wishlist'));
    } else {
      this.wishlistSvc.addToWishlist(p.id).subscribe(() =>
        this.notify.showSuccess('Added to wishlist'));
    }
  }

  getEmoji(type: number): string { return this.animalOptions.find(a => a.value === type)?.emoji ?? '🐾'; }
  getLabel(type: number): string { return this.animalOptions.find(a => a.value === type)?.label ?? 'Other'; }
}
