import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateOrderRequest, Order, OrderStatus,
  OrderSummary, UpdateStatusRequest
} from '../models/order.models';
import { PagedResponse } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  createOrder(dto: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, dto);
  }

  getMyOrders(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${this.apiUrl}/my`);
  }

  getAllOrders(
    page: number = 1,
    pageSize: number = 10,
    status?: OrderStatus
  ): Observable<PagedResponse<Order>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (status !== undefined) {
      params = params.set('status', status.toString());
    }
    return this.http.get<PagedResponse<Order>>(this.apiUrl, { params });
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: OrderStatus): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status } as UpdateStatusRequest);
  }
}
