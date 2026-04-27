import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WishlistItem } from '../models/wishlist.models';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = `${environment.apiUrl}/wishlist`;
  wishlist$ = new BehaviorSubject<WishlistItem[]>([]);

  constructor(private http: HttpClient) {}

  getWishlist(): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(this.apiUrl).pipe(
      tap(items => this.wishlist$.next(items))
    );
  }

  addToWishlist(productId: string): Observable<WishlistItem> {
    return this.http.post<WishlistItem>(`${this.apiUrl}/${productId}`, {}).pipe(
      tap(item => {
        const current = this.wishlist$.value;
        if (!current.some(w => w.productId === productId)) {
          this.wishlist$.next([item, ...current]);
        }
      })
    );
  }

  removeFromWishlist(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${productId}`).pipe(
      tap(() => {
        const current = this.wishlist$.value.filter(w => w.productId !== productId);
        this.wishlist$.next(current);
      })
    );
  }

  isInWishlist(productId: string): boolean {
    return this.wishlist$.value.some(w => w.productId === productId);
  }

  checkWishlist(productId: string): Observable<{isInWishlist: boolean}> {
    return this.http.get<{isInWishlist: boolean}>(`${this.apiUrl}/check/${productId}`);
  }
}
