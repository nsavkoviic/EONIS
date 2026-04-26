import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule, MatMenuModule],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <a routerLink="/home" class="logo">🐾 PetShop</a>
      <a mat-button routerLink="/home" routerLinkActive="link-active">Home</a>
      <a mat-button routerLink="/products" routerLinkActive="link-active">Products</a>
      <span class="spacer"></span>

      <ng-container *ngIf="auth.isLoggedIn$ | async; else notLoggedIn">
        <button mat-icon-button routerLink="/cart">
          <mat-icon
            [matBadge]="(cart.cart$ | async)?.totalItems || null"
            [matBadgeHidden]="!((cart.cart$ | async)?.totalItems)"
            matBadgeColor="accent">shopping_cart</mat-icon>
        </button>
        <a mat-button routerLink="/orders">My Orders</a>

        <ng-container *ngIf="auth.isAdmin$ | async">
          <button mat-button [matMenuTriggerFor]="adminMenu">
            Admin <mat-icon>arrow_drop_down</mat-icon>
          </button>
          <mat-menu #adminMenu="matMenu">
            <a mat-menu-item routerLink="/admin/products"><mat-icon>inventory_2</mat-icon> Products</a>
            <a mat-menu-item routerLink="/admin/orders"><mat-icon>receipt_long</mat-icon> Orders</a>
            <a mat-menu-item routerLink="/admin/transactions"><mat-icon>payments</mat-icon> Transactions</a>
          </mat-menu>
        </ng-container>

        <span class="username">{{ (auth.currentUser$ | async)?.firstName }}</span>
        <button mat-button (click)="logout()"><mat-icon>logout</mat-icon> Logout</button>
      </ng-container>

      <ng-template #notLoggedIn>
        <a mat-button routerLink="/auth/login">Login</a>
        <a mat-raised-button color="accent" routerLink="/auth/register">Register</a>
      </ng-template>
    </mat-toolbar>
  `,
  styles: [`
    .navbar { position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,.2); }
    .logo { font-size: 1.3rem; font-weight: 700; text-decoration: none; color: white; margin-right: 8px; }
    .spacer { flex: 1; }
    .username { margin: 0 8px; font-weight: 500; }
    .link-active { background: rgba(255,255,255,.15); border-radius: 4px; }
  `]
})
export class NavbarComponent implements OnInit {
  constructor(public auth: AuthService, public cart: CartService, private router: Router) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      if (user) this.cart.getCart().subscribe();
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}
