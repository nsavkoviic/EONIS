import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { Cart, CartItem } from '../../core/models/cart.models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDividerModule, MatInputModule, MatFormFieldModule, TranslateModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export default class CartComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  cart: Cart | null = null;
  isLoading = true;

  constructor(
    private cartSvc: CartService,
    private router: Router,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.cartSvc.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.isLoading = false);

    this.cartSvc.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(c => this.cart = c);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  changeQty(item: CartItem, qty: number): void {
    if (qty < 1) {
      this.removeItem(item.productId);
    } else {
      this.cartSvc.updateItem(item.productId, { quantity: qty }).subscribe();
    }
  }

  removeItem(productId: string): void {
    this.cartSvc.removeItem(productId).subscribe();
  }

  clearCart(): void {
    this.cartSvc.clearCart().subscribe(() =>
      this.notify.showSuccess('Cart cleared')
    );
  }

  checkout(): void {
    this.router.navigate(['/checkout']);
  }
}
