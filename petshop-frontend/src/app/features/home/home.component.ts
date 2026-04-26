import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <h1>Find Everything Your Pet Needs</h1>
        <p>Quality food, toys and accessories for dogs, cats, birds and more.</p>
        <button mat-raised-button color="primary" routerLink="/products" class="hero-btn">
          <mat-icon>shopping_bag</mat-icon> Shop Now
        </button>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <mat-card class="feature-card" *ngFor="let f of features">
        <mat-card-header>
          <span class="feature-icon">{{ f.icon }}</span>
          <mat-card-title>{{ f.title }}</mat-card-title>
        </mat-card-header>
        <mat-card-content><p>{{ f.text }}</p></mat-card-content>
      </mat-card>
    </section>

    <!-- Categories -->
    <section class="categories">
      <h2>Shop by Category</h2>
      <div class="category-grid">
        <button mat-stroked-button class="cat-btn"
          *ngFor="let c of categories"
          (click)="goToCategory(c.value)">
          {{ c.icon }} {{ c.label }}
        </button>
      </div>
    </section>
  `,
  styles: [`
    .hero { background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
      color: white; padding: 80px 24px; text-align: center; border-radius: 12px; margin-bottom: 40px; }
    h1 { font-size: 2.5rem; margin-bottom: 16px; }
    .hero p { font-size: 1.2rem; opacity: .9; margin-bottom: 32px; }
    .hero-btn { font-size: 1.1rem; padding: 8px 32px; }
    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 48px; }
    .feature-card { text-align: center; padding: 8px; }
    .feature-icon { font-size: 2.5rem; display: block; margin-bottom: 8px; }
    .categories { text-align: center; }
    h2 { font-size: 1.8rem; margin-bottom: 24px; color: #3f51b5; }
    .category-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .cat-btn { font-size: 1rem; padding: 8px 20px; border-radius: 24px; }
    @media (max-width: 768px) { .features { grid-template-columns: 1fr; } h1 { font-size: 1.8rem; } }
  `]
})
export default class HomeComponent {
  features = [
    { icon: '🚚', title: 'Fast Delivery', text: 'Get your order delivered to your door' },
    { icon: '⭐', title: 'Premium Quality', text: 'Carefully selected products for your pets' },
    { icon: '💳', title: 'Secure Payment', text: 'Safe checkout powered by Stripe' },
  ];

  categories = [
    { label: 'Dogs', icon: '🐕', value: 0 },
    { label: 'Cats', icon: '🐈', value: 1 },
    { label: 'Birds', icon: '🐦', value: 2 },
    { label: 'Fish', icon: '🐠', value: 3 },
    { label: 'Reptiles', icon: '🦎', value: 4 },
    { label: 'Small Animals', icon: '🐹', value: 5 },
  ];

  constructor(private router: Router) {}

  goToCategory(value: number): void {
    this.router.navigate(['/products'], { queryParams: { category: value } });
  }
}
