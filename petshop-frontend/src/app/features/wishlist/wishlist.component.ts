import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WishlistItem } from '../../core/models/wishlist.models';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export default class WishlistComponent implements OnInit, OnDestroy {
  items: WishlistItem[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private wishlistSvc: WishlistService,
    private cartSvc: CartService,
    private notify: NotificationService,
    public router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.wishlistSvc.wishlist$.pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.items = items;
      this.isLoading = false;
    });

    // Initial load
    this.wishlistSvc.getWishlist().pipe(takeUntil(this.destroy$)).subscribe({
      error: () => this.isLoading = false
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeItem(productId: string): void {
    this.wishlistSvc.removeFromWishlist(productId).subscribe(() => {
      this.notify.showSuccess(this.translate.instant('TOAST.REMOVED_FROM_WISHLIST'));
    });
  }

  addToCart(item: WishlistItem): void {
    this.cartSvc.addItem({ productId: item.productId, quantity: 1 }).subscribe(() => {
      this.notify.showSuccess(this.translate.instant('TOAST.ADDED_TO_CART'));
    });
  }
}
