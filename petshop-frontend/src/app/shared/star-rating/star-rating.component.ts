import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="star-rating" [class.interactive]="interactive" [ngClass]="size">
      <ng-container *ngFor="let star of stars; let i = index">
        <mat-icon 
          (click)="onStarClick(i + 1)"
          [class.filled]="star === 'full'"
          [class.half]="star === 'half'"
          [class.empty]="star === 'empty'">
          {{ getIconName(star) }}
        </mat-icon>
      </ng-container>
    </div>
  `,
  styles: [`
    .star-rating { display: flex; align-items: center; gap: 2px; }
    .star-rating mat-icon { color: #d1d5db; transition: all 0.2s; user-select: none; }
    .star-rating mat-icon.filled, .star-rating mat-icon.half { color: #f59e0b; }
    
    .sm mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .md mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .lg mat-icon { font-size: 28px; width: 28px; height: 28px; }

    .interactive mat-icon { cursor: pointer; }
    .interactive mat-icon:hover { transform: scale(1.2); }
  `]
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
