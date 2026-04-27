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
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/home" class="nav-logo">
          <span class="logo-icon">🐾</span>
          <span class="logo-text">PetShop</span>
        </a>

        <button class="hamburger" (click)="menuOpen = !menuOpen"
          [class.open]="menuOpen">
          <span></span><span></span><span></span>
        </button>

        <div class="nav-body" [class.open]="menuOpen">
          <div class="nav-links">
            <a routerLink="/home" routerLinkActive="active" class="nav-link">Home</a>
            <a routerLink="/products" routerLinkActive="active" class="nav-link">Products</a>
            <a routerLink="/ai-assistant" routerLinkActive="active" class="nav-link ai-nav-link">
              <mat-icon style="font-size:16px;vertical-align:middle;margin-right:4px">auto_awesome</mat-icon>
              AI Assistant
            </a>
          </div>
          <div class="nav-actions">
            <ng-container *ngIf="auth.currentUser$ | async as user; else guestActions">
              <button class="nav-icon-btn" routerLink="/cart" matTooltip="Cart">
                <mat-icon [matBadge]="(cart.cart$ | async)?.totalItems || null"
                  [matBadgeHidden]="!((cart.cart$ | async)?.totalItems)"
                  matBadgeColor="warn" matBadgeSize="small">shopping_cart</mat-icon>
              </button>
              <button class="nav-icon-btn" routerLink="/wishlist" matTooltip="Wishlist">
                <mat-icon [matBadge]="wishlistCount || null" 
                  [matBadgeHidden]="!wishlistCount"
                  matBadgeColor="warn" matBadgeSize="small">favorite</mat-icon>
              </button>
              <button class="user-chip-btn" [matMenuTriggerFor]="userMenu">
                <div class="user-avatar">{{ user.firstName[0] }}</div>
                <span class="user-first-name">{{ user.firstName }}</span>
                <mat-icon class="chevron">expand_more</mat-icon>
              </button>

              <mat-menu #userMenu="matMenu" class="user-menu">
                <!-- Profile header inside menu -->
                <div class="menu-header" (click)="$event.stopPropagation()">
                  <div class="menu-avatar">{{ user.firstName[0] }}</div>
                  <div>
                    <div class="menu-name">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="menu-email">{{ user.email }}</div>
                  </div>
                </div>
                <mat-divider></mat-divider>
                <a mat-menu-item routerLink="/profile">
                  <mat-icon>person</mat-icon> My Profile
                </a>
                <a mat-menu-item routerLink="/orders">
                  <mat-icon>receipt_long</mat-icon> My Orders
                </a>
                <mat-divider *ngIf="user.role === 'Admin'"></mat-divider>
                <ng-container *ngIf="user.role === 'Admin'">
                  <div class="menu-section-label" (click)="$event.stopPropagation()">Admin</div>
                  <a mat-menu-item routerLink="/admin/products">
                    <mat-icon>inventory_2</mat-icon> Products
                  </a>
                  <a mat-menu-item routerLink="/admin/orders">
                    <mat-icon>receipt_long</mat-icon> Orders
                  </a>
                  <a mat-menu-item routerLink="/admin/transactions">
                    <mat-icon>payments</mat-icon> Transactions
                  </a>
                </ng-container>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="logout()" class="logout-item">
                  <mat-icon color="warn">logout</mat-icon>
                  <span style="color:#ef4444">Logout</span>
                </button>
              </mat-menu>
            </ng-container>
            <ng-template #guestActions>
              <a routerLink="/auth/login" class="nav-link">Login</a>
              <a routerLink="/auth/register" class="nav-btn-primary">Get Started</a>
            </ng-template>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 1000;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #f0e6d3;
      box-shadow: 0 2px 20px rgba(245,124,0,.08);
    }
    .nav-container {
      max-width: 1280px; margin: 0 auto;
      padding: 0 24px; height: 68px;
      display: flex; align-items: center; gap: 32px;
    }
    .nav-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0; }
    .logo-icon { font-size: 1.8rem; line-height: 1; }
    .logo-text {
      font-size: 1.4rem; font-weight: 800;
      background: linear-gradient(135deg, #f57c00, #e65100);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .nav-body { display: contents; }
    .nav-links { display: flex; gap: 4px; flex: 1; }
    .nav-link {
      padding: 6px 14px; border-radius: 8px; color: #374151; font-weight: 500; font-size: .95rem;
      text-decoration: none; cursor: pointer; border: none; background: none;
      transition: all .15s; display: flex; align-items: center;
    }
    .nav-link:hover { background: #fff3e0; color: #f57c00; }
    .nav-link.active { background: #fff3e0; color: #f57c00; font-weight: 600; }
    .nav-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
    .nav-icon-btn {
      width: 40px; height: 40px; border-radius: 10px; border: 1px solid #e5e7eb;
      background: white; cursor: pointer; display: flex; align-items: center;
      justify-content: center; transition: all .15s; color: #374151;
    }
    .nav-icon-btn:hover { background: #fff3e0; border-color: #f57c00; color: #f57c00; }
    .nav-btn-primary {
      padding: 8px 20px; border-radius: 10px;
      background: linear-gradient(135deg, #f57c00, #e65100);
      color: white; font-weight: 600; font-size: .9rem;
      text-decoration: none; box-shadow: 0 2px 8px rgba(245,124,0,.35); transition: all .2s;
    }
    .nav-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(245,124,0,.45); }
    .user-chip-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 10px 4px 4px;
      background: #fff3e0; border-radius: 20px;
      border: 1px solid #fed7aa; cursor: pointer;
      transition: all .2s; font-family: inherit;
    }
    .user-chip-btn:hover { background: #ffe0b2; border-color: #f57c00; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #f57c00, #e65100);
      color: white; display: flex; align-items: center;
      justify-content: center; font-size: .85rem; font-weight: 700;
      flex-shrink: 0;
    }
    .user-first-name { font-size: .9rem; font-weight: 600; color: #92400e; }
    .chevron { font-size: 18px; width: 18px; height: 18px; color: #92400e; }
    .menu-header {
      padding: 12px 16px; display: flex; align-items: center; gap: 12px;
      background: #fff8f0;
    }
    .menu-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #f57c00, #e65100);
      color: white; display: flex; align-items: center;
      justify-content: center; font-weight: 700; font-size: .9rem; flex-shrink: 0;
    }
    .menu-name { font-weight: 700; font-size: .9rem; }
    .menu-email { font-size: .78rem; color: #9ca3af; }
    .menu-section-label {
      padding: 6px 16px; font-size: .72rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .8px; color: #9ca3af;
    }
    .logout-item { color: #ef4444 !important; }
    .ai-nav-link {
      background: linear-gradient(135deg, #fff3e0, #fff8f0) !important;
      color: #f57c00 !important; border: 1px solid #fed7aa;
    }
    .ai-nav-link:hover {
      background: #fff3e0 !important;
      box-shadow: 0 2px 8px rgba(245,124,0,.2);
    }
    .hamburger {
      display: none; flex-direction: column; gap: 5px;
      background: none; border: none; cursor: pointer; padding: 4px;
    }
    .hamburger span {
      display: block; width: 22px; height: 2px;
      background: #374151; border-radius: 2px; transition: all .3s;
    }
    .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger.open span:nth-child(2) { opacity: 0; }
    .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    @media (max-width: 768px) {
      .hamburger { display: flex; margin-left: auto; }
      .nav-body {
        display: none; flex-direction: column;
        position: absolute; top: 68px; left: 0; right: 0;
        background: white; border-bottom: 1px solid #f0e6d3;
        padding: 16px 24px; gap: 8px; z-index: 999;
        box-shadow: 0 8px 24px rgba(0,0,0,.08);
      }
      .nav-body.open { display: flex; }
      .nav-links { flex-direction: column; }
      .nav-actions {
        flex-direction: column; align-items: flex-start;
        margin-left: 0; gap: 8px;
      }
      .nav-link { width: 100%; }
      .nav-btn-primary { text-align: center; }
    }
  `]
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
