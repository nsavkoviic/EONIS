import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-container">

        <!-- Brand -->
        <div class="footer-brand">
          <a routerLink="/home" class="footer-logo">
            <span class="logo-icon">🐾</span>
            <span class="logo-text">PetShop</span>
          </a>
          <p class="footer-tagline">
            Premium products for your beloved pets.
            Delivered with love.
          </p>
          <div class="footer-social">
            <a href="#" class="social-btn" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="#" class="social-btn" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="#" class="social-btn" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="footer-col">
          <h4 class="footer-heading">Quick Links</h4>
          <nav class="footer-nav">
            <a routerLink="/home" class="footer-link">Home</a>
            <a routerLink="/products" class="footer-link">Products</a>
            <a routerLink="/cart" class="footer-link">Shopping Cart</a>
            <a routerLink="/orders" class="footer-link">My Orders</a>
            <a routerLink="/wishlist" class="footer-link">Wishlist</a>
            <a routerLink="/ai-assistant" class="footer-link">🤖 AI Assistant</a>
          </nav>
        </div>

        <!-- Categories -->
        <div class="footer-col">
          <h4 class="footer-heading">Categories</h4>
          <nav class="footer-nav">
            <a routerLink="/products" [queryParams]="{category: 0}" class="footer-link">🐕 Dogs</a>
            <a routerLink="/products" [queryParams]="{category: 1}" class="footer-link">🐈 Cats</a>
            <a routerLink="/products" [queryParams]="{category: 2}" class="footer-link">🐦 Birds</a>
            <a routerLink="/products" [queryParams]="{category: 3}" class="footer-link">🐠 Fish</a>
            <a routerLink="/products" [queryParams]="{category: 5}" class="footer-link">🐹 Small Animals</a>
          </nav>
        </div>

        <!-- Customer Service -->
        <div class="footer-col">
          <h4 class="footer-heading">Customer Service</h4>
          <nav class="footer-nav">
            <span class="footer-info">📧 support&#64;petshop.com</span>
            <span class="footer-info">📞 +381 11 123 4567</span>
            <span class="footer-info">🕐 Mon–Fri, 9am–6pm</span>
          </nav>
          <div class="payment-badges">
            <span class="pay-badge">💳 Stripe</span>
            <span class="pay-badge">🔒 Secure</span>
          </div>
        </div>

      </div>

      <!-- Bottom bar -->
      <div class="footer-bottom">
        <div class="footer-bottom-inner">
          <span>© {{ year }} PetShop EONIS. All rights reserved.</span>
          <span>Made with ❤️ for pet lovers</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #1a1a2e; color: #cbd5e1;
      margin-top: 64px;
    }
    .footer-container {
      max-width: 1280px; margin: 0 auto; padding: 48px 24px 32px;
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px;
    }
    .footer-logo {
      display: flex; align-items: center; gap: 8px;
      text-decoration: none; margin-bottom: 16px;
    }
    .logo-icon { font-size: 1.6rem; }
    .logo-text {
      font-size: 1.3rem; font-weight: 800;
      background: linear-gradient(135deg, #fb8c00, #f57c00);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .footer-tagline {
      font-size: .875rem; line-height: 1.6; color: #94a3b8;
      margin: 0 0 20px; max-width: 240px;
    }
    .footer-social { display: flex; gap: 8px; }
    .social-btn {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,.08); color: #94a3b8;
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; transition: all .2s;
    }
    .social-btn:hover { background: #f57c00; color: white; }
    .footer-heading {
      font-size: .75rem; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: #f57c00; margin: 0 0 16px;
    }
    .footer-nav { display: flex; flex-direction: column; gap: 10px; }
    .footer-link {
      color: #94a3b8; text-decoration: none; font-size: .875rem;
      transition: color .15s;
    }
    .footer-link:hover { color: #f57c00; }
    .footer-info { font-size: .875rem; color: #94a3b8; }
    .payment-badges { display: flex; gap: 8px; margin-top: 16px; }
    .pay-badge {
      background: rgba(255,255,255,.08); padding: 4px 10px;
      border-radius: 8px; font-size: .75rem; color: #94a3b8;
    }
    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,.06);
      padding: 16px 0;
    }
    .footer-bottom-inner {
      max-width: 1280px; margin: 0 auto; padding: 0 24px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .footer-bottom span { font-size: .8rem; color: #64748b; }
    @media (max-width: 1024px) {
      .footer-container { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 600px) {
      .footer-container { grid-template-columns: 1fr; gap: 24px; padding: 32px 24px; }
      .footer-bottom-inner { flex-direction: column; gap: 4px; text-align: center; }
    }
  `]
})
export class FooterComponent {
  year = new Date().getFullYear();
}
