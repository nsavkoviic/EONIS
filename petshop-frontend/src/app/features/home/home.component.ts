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
    <!-- HERO -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">🐾 Trusted by 10,000+ pet owners</div>
        <h1 class="hero-title">
          Everything Your<br>
          <span class="hero-highlight">Pet Deserves</span>
        </h1>
        <p class="hero-subtitle">
          Premium food, toys and accessories for dogs, cats, birds and more.
          Delivered with love to your door.
        </p>
        <div class="hero-actions">
          <a mat-raised-button color="primary" routerLink="/products" class="hero-cta">
            <mat-icon>shopping_bag</mat-icon> Shop Now
          </a>
          <a mat-stroked-button routerLink="/auth/register" class="hero-cta-secondary">
            Join Free →
          </a>
        </div>
        <div class="hero-stats">
          <div class="stat"><strong>500+</strong><span>Products</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>Free</strong><span>Shipping €50+</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>5★</strong><span>Rated</span></div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-blob"></div>
        <div class="floating-card fc1">🐕 Royal Canin<br><small>Just added</small></div>
        <div class="floating-card fc2">⭐ Top Rated<br><small>KONG Classic</small></div>
        <div class="floating-card fc3">🚚 Free Shipping<br><small>Orders €50+</small></div>
        <div class="pet-emoji-grid">
          <span>🐕</span><span>🐈</span><span>🐦</span>
          <span>🐠</span><span>🦎</span><span>🐹</span>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="features-section">
      <div class="features-grid">
        <div class="feature-card" *ngFor="let f of features"
          [class.clickable]="f.route"
          [routerLink]="f.route">
          <div class="feature-icon">{{ f.icon }}</div>
          <div class="feature-content">
            <h3>{{ f.title }}</h3>
            <p>{{ f.text }}</p>
            <span class="feature-link" *ngIf="f.route">Try it now →</span>
          </div>
        </div>
      </div>
    </section>

    <!-- CATEGORIES -->
    <section class="categories-section">
      <div class="section-header">
        <h2>Shop by Category</h2>
        <p>Find exactly what your pet needs</p>
      </div>
      <div class="categories-grid">
        <button *ngFor="let c of categories"
          class="category-card" (click)="goToCategory(c.value)">
          <span class="cat-emoji">{{ c.icon }}</span>
          <span class="cat-label">{{ c.label }}</span>
          <mat-icon class="cat-arrow">arrow_forward</mat-icon>
        </button>
      </div>
    </section>

    <!-- CTA BANNER -->
    <section class="cta-banner">
      <div class="cta-content">
        <h2>🎉 First time here?</h2>
        <p>Use code <strong>WELCOME10</strong> for 10% off your first order</p>
        <a mat-raised-button routerLink="/auth/register" class="cta-btn">
          Create Account & Save
        </a>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 48px; align-items: center;
      max-width: 1280px; margin: 0 auto;
      padding: 64px 24px 80px;
    }
    .hero-badge {
      display: inline-flex; align-items: center;
      background: #fff3e0; color: #92400e;
      border: 1px solid #fed7aa;
      padding: 6px 16px; border-radius: 20px;
      font-size: .85rem; font-weight: 600; margin-bottom: 20px;
    }
    .hero-title {
      font-size: clamp(2.5rem, 5vw, 3.5rem);
      font-weight: 800; line-height: 1.1;
      color: #1a1a1a; margin: 0 0 16px;
    }
    .hero-highlight {
      background: linear-gradient(135deg, #f57c00, #e65100);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .hero-subtitle {
      font-size: 1.1rem; color: #6b7280;
      line-height: 1.6; margin-bottom: 32px; max-width: 480px;
    }
    .hero-actions { display: flex; gap: 12px; margin-bottom: 40px; flex-wrap: wrap; }
    .hero-cta { height: 52px; padding: 0 28px; font-size: 1rem !important; }
    .hero-cta-secondary {
      height: 52px; padding: 0 24px; border-radius: 10px; font-weight: 600;
      border-color: #e5e7eb !important; color: #374151 !important;
      text-decoration: none; display: flex; align-items: center;
    }
    .hero-cta-secondary:hover { border-color: #f57c00 !important; color: #f57c00 !important; background: #fff3e0 !important; }
    .hero-stats { display: flex; align-items: center; gap: 20px; }
    .stat { display: flex; flex-direction: column; }
    .stat strong { font-size: 1.3rem; font-weight: 800; color: #f57c00; }
    .stat span { font-size: .8rem; color: #9ca3af; }
    .stat-divider { width: 1px; height: 32px; background: #e5e7eb; }
    .hero-visual {
      position: relative; display: flex;
      align-items: center; justify-content: center; height: 400px;
    }
    .hero-blob {
      width: 320px; height: 320px; border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
      background: linear-gradient(135deg, #fff3e0, #ffe0b2, #ffcc02);
      animation: blob 6s ease-in-out infinite; position: absolute;
    }
    @keyframes blob {
      0%, 100% { border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%; }
      50% { border-radius: 40% 60% 30% 70% / 60% 40% 50% 40%; }
    }
    .pet-emoji-grid {
      position: relative; display: grid;
      grid-template-columns: repeat(3,1fr); gap: 20px; z-index: 1;
    }
    .pet-emoji-grid span {
      font-size: 3.5rem; text-align: center;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,.1));
      animation: float 3s ease-in-out infinite;
    }
    .pet-emoji-grid span:nth-child(2) { animation-delay: .5s; }
    .pet-emoji-grid span:nth-child(3) { animation-delay: 1s; }
    .pet-emoji-grid span:nth-child(4) { animation-delay: 1.5s; }
    .pet-emoji-grid span:nth-child(5) { animation-delay: 2s; }
    .pet-emoji-grid span:nth-child(6) { animation-delay: 2.5s; }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .floating-card {
      position: absolute; background: white;
      border-radius: 12px; padding: 10px 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,.12);
      font-size: .8rem; font-weight: 600;
      line-height: 1.4; color: #1a1a1a;
      animation: float 4s ease-in-out infinite;
    }
    .floating-card small { color: #9ca3af; font-weight: 400; }
    .fc1 { top: 20px; left: 0; animation-delay: .3s; }
    .fc2 { bottom: 60px; right: 0; animation-delay: 1.2s; }
    .fc3 { top: 50%; left: -20px; animation-delay: .7s; }
    .features-section {
      background: white; padding: 48px 24px;
      border-top: 1px solid #f0e6d3; border-bottom: 1px solid #f0e6d3;
    }
    .features-grid {
      max-width: 1280px; margin: 0 auto;
      display: grid; grid-template-columns: repeat(4,1fr); gap: 32px;
    }
    .feature-card {
      display: flex; align-items: flex-start; gap: 16px; padding: 24px;
      border-radius: 16px; background: #fafafa;
      border: 1px solid #f0e6d3; transition: all .2s;
    }
    .feature-card:hover { background: #fff3e0; border-color: #fed7aa; transform: translateY(-2px); }
    .feature-card.clickable { cursor: pointer; }
    .feature-card.clickable:hover { 
      background: #fff3e0; border-color: #fed7aa; 
      transform: translateY(-2px); 
    }
    .feature-link { 
      display: inline-block; margin-top: 8px;
      font-size: .8rem; font-weight: 700; color: #f57c00; 
    }
    .feature-icon { font-size: 2.4rem; line-height: 1; flex-shrink: 0; }
    .feature-content h3 { margin: 0 0 6px; font-size: 1rem; font-weight: 700; }
    .feature-content p { margin: 0; font-size: .9rem; color: #6b7280; line-height: 1.5; }
    .categories-section { max-width: 1280px; margin: 0 auto; padding: 64px 24px; }
    .section-header { text-align: center; margin-bottom: 40px; }
    .section-header h2 { font-size: 2rem; margin: 0 0 8px; }
    .section-header p { color: #6b7280; margin: 0; }
    .categories-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
    .category-card {
      display: flex; align-items: center; gap: 16px;
      padding: 20px 24px; border-radius: 16px;
      background: white; border: 1.5px solid #e5e7eb;
      cursor: pointer; text-align: left; transition: all .2s; width: 100%;
    }
    .category-card:hover {
      border-color: #f57c00; background: #fff3e0; transform: translateX(4px);
    }
    .category-card:hover .cat-arrow { color: #f57c00; transform: translateX(4px); }
    .cat-emoji { font-size: 2.2rem; line-height: 1; }
    .cat-label { font-size: 1rem; font-weight: 600; color: #1a1a1a; flex: 1; }
    .cat-arrow { color: #d1d5db; transition: all .2s; }
    .cta-banner {
      margin: 0 24px 64px;
      background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
      border-radius: 24px; padding: 48px;
      text-align: center; overflow: hidden; position: relative;
    }
    .cta-banner::before {
      content: '🐾'; position: absolute; font-size: 8rem; opacity: .08;
      top: -20px; right: 40px;
    }
    .cta-content { position: relative; z-index: 1; }
    .cta-content h2 { color: white; font-size: 1.8rem; margin: 0 0 8px; }
    .cta-content p { color: rgba(255,255,255,.9); margin: 0 0 24px; font-size: 1rem; }
    .cta-content strong { background: rgba(255,255,255,.2); padding: 2px 10px; border-radius: 6px; }
    .cta-btn {
      background: white !important; color: #f57c00 !important;
      font-weight: 700 !important; font-size: 1rem !important;
      height: 48px; padding: 0 32px;
      border-radius: 12px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,.15) !important;
    }
    @media (max-width: 768px) {
      .hero { grid-template-columns: 1fr; }
      .hero-visual { display: none; }
      .features-grid { grid-template-columns: repeat(2,1fr); }
      .categories-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) {
      .features-grid { grid-template-columns: 1fr; }
    }
  `]
})
export default class HomeComponent {
  features = [
    { icon: '🚚', title: 'Free Delivery', 
      text: 'Free shipping on all orders over €50. Fast and reliable delivery to your door.',
      route: null },
    { icon: '⭐', title: 'Premium Quality', 
      text: 'Carefully curated products from trusted brands your pets will love.',
      route: null },
    { icon: '💳', title: 'Secure Payments', 
      text: 'Safe checkout powered by Stripe. Your data is always protected.',
      route: null },
    { icon: '🤖', title: 'AI Pet Assistant', 
      text: 'Get personalized product recommendations powered by AI. Just describe your pet!',
      route: '/ai-assistant' },
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
