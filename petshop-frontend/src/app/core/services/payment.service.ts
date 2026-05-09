import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CheckoutSessionResponse,
  CreateCheckoutSessionRequest,
  Transaction
} from '../models/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  createCheckoutSession(
    dto: CreateCheckoutSessionRequest
  ): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.apiUrl}/checkout-session`,
      dto
    );
  }

  getTransactions(from?: Date, to?: Date): Observable<Transaction[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from.toISOString());
    if (to)   params = params.set('to', to.toISOString());
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`, { params });
  }

  validateDiscount(code: string): Observable<any> {
    const params = new HttpParams().set('code', code);
    return this.http.get<any>(`${this.apiUrl}/validate-discount`, { params });
  }

  // ── Admin Coupon CRUD ─────────────────────────────────────────────────
  getDiscountCodes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/discount-codes`);
  }

  createDiscountCode(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/discount-codes`, dto);
  }

  updateDiscountCode(id: string, dto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/discount-codes/${id}`, dto);
  }

  deleteDiscountCode(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/discount-codes/${id}`);
  }
}
