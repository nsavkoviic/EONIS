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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatDividerModule, MatProgressSpinnerModule, MatTooltipModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
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
    private router: Router,
    private translate: TranslateService
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
      next: p => { this.profile = p; this.savingInfo = false; this.notify.showSuccess(this.translate.instant('TOAST.PROFILE_SAVED')); },
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
          this.notify.showSuccess(this.translate.instant('TOAST.PROFILE_SAVED'));
        },
        error: () => this.notify.showError(this.translate.instant('TOAST.ERROR_GENERIC'))
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
        next: () => this.notify.showSuccess(this.translate.instant('TOAST.PROFILE_SAVED')),
        error: () => {
          this.currentPets.pop(); // revert on error
          this.notify.showError(this.translate.instant('TOAST.ERROR_GENERIC'));
        }
      });
  }

  removePet(i: number): void {
    this.currentPets.splice(i, 1);
    this.userSvc.updateProfile({ currentPets: this.currentPets })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.notify.showSuccess(this.translate.instant('TOAST.PROFILE_SAVED')),
        error: () => this.notify.showError(this.translate.instant('TOAST.ERROR_GENERIC'))
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
      next: () => this.notify.showSuccess(this.translate.instant('TOAST.ADDED_TO_CART')),
    });
  }

  goToProduct(id: string): void { 
    this.router.navigate(['/products', id]); 
  }

  toggleRecoWishlist(event: MouseEvent, p: Product): void {
    event.stopPropagation();
    if (this.wishlistIds.has(p.id)) {
      this.wishlistSvc.removeFromWishlist(p.id).subscribe(() =>
        this.notify.showSuccess(this.translate.instant('TOAST.REMOVED_FROM_WISHLIST')));
    } else {
      this.wishlistSvc.addToWishlist(p.id).subscribe(() =>
        this.notify.showSuccess(this.translate.instant('TOAST.ADDED_TO_WISHLIST')));
    }
  }

  getEmoji(type: number): string { return this.animalOptions.find(a => a.value === type)?.emoji ?? '🐾'; }
  getLabel(type: number): string { return this.animalOptions.find(a => a.value === type)?.label ?? 'Other'; }
}
