import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() maxStars: number = 5;
  @Input() interactive: boolean = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Output() ratingChange = new EventEmitter<number>();

  get stars(): string[] {
    const arr = [];
    for (let i = 1; i <= this.maxStars; i++) {
      if (this.rating >= i) {
        arr.push('full');
      } else if (this.rating >= i - 0.5) {
        arr.push('half');
      } else {
        arr.push('empty');
      }
    }
    return arr;
  }

  getIconName(state: string): string {
    if (state === 'full') return 'star';
    if (state === 'half') return 'star_half';
    return 'star_border';
  }

  onStarClick(index: number): void {
    if (this.interactive) {
      this.ratingChange.emit(index);
    }
  }
}
