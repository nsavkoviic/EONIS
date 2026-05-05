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
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
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
