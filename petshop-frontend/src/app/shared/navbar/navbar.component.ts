import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule, MatMenuModule, MatTooltipModule, MatDividerModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  wishlistCount: number = 0;
  menuOpen = false;
  private destroy$ = new Subject<void>();

  constructor(public auth: AuthService, public cart: CartService, public wishlistSvc: WishlistService, private router: Router) { }

  ngOnInit(): void {
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.cart.getCart().pipe(takeUntil(this.destroy$)).subscribe();
          this.wishlistSvc.getWishlist().pipe(takeUntil(this.destroy$)).subscribe();
          this.wishlistSvc.wishlist$.pipe(takeUntil(this.destroy$))
            .subscribe(w => this.wishlistCount = w.length);
        } else {
          this.cart.cart$.next(null);
          this.wishlistSvc.wishlist$.next([]);
          this.wishlistCount = 0;
        }
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}
