import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home',
    loadComponent: () => import('./features/home/home.component') },

  { path: 'products',
    loadComponent: () => import('./features/products/product-list/product-list.component') },

  { path: 'products/:id',
    loadComponent: () => import('./features/products/product-detail/product-detail.component') },

  { path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component') },

  { path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component') },

  { path: 'wishlist',
    canActivate: [authGuard],
    loadComponent: () => import('./features/wishlist/wishlist.component') },

  { path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./features/cart/cart.component') },

  { path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.component') },

  { path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component') },

  { path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/my-orders/my-orders.component') },

  { path: 'admin/products',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/product-management/product-management.component') },

  { path: 'admin/orders',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/order-management/order-management.component') },

  { path: 'admin/transactions',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/transactions/transactions.component') },

  { path: 'ai-assistant',
    loadComponent: () => import('./features/ai-assistant/ai-assistant.component') },

  { path: '**', redirectTo: 'home' },
];
