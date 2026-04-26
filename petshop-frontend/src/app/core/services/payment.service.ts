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
}
