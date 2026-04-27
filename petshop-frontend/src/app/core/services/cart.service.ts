import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddToCartRequest, Cart, UpdateCartItemRequest } from '../models/cart.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly apiUrl = `${environment.apiUrl}/cart`;

  cart$ = new BehaviorSubject<Cart | null>(null);

  constructor(private http: HttpClient) {}

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.apiUrl).pipe(
      tap(cart => this.cart$.next(cart))
    );
  }

  addItem(dto: AddToCartRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/items`, dto).pipe(
      tap(cart => this.cart$.next(cart))
    );
  }

  updateItem(productId: string, dto: UpdateCartItemRequest): Observable<Cart> {
    return this.http.put<Cart>(`${this.apiUrl}/items/${productId}`, dto).pipe(
      tap(cart => this.cart$.next(cart))
    );
  }

  removeItem(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${productId}`).pipe(
      tap(() => {
        const current = this.cart$.value;
        if (current) {
          const updatedItems = current.items.filter(i => i.productId !== productId);
          this.cart$.next({
            ...current,
            items:      updatedItems,
            totalPrice: updatedItems.reduce((s, i) => s + i.totalPrice, 0),
            totalItems: updatedItems.reduce((s, i) => s + i.quantity,   0),
          });
        }
      })
    );
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(this.apiUrl).pipe(
      tap(() => this.cart$.next(null))
    );
  }
}
