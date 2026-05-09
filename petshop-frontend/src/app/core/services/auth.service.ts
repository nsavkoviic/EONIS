import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserInfo } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'petshop_token';
  private readonly USER_KEY = 'petshop_user';
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  currentUser$ = new BehaviorSubject<UserInfo | null>(null);

  isLoggedIn$ = this.currentUser$.pipe(map(u => u !== null));
  isAdmin$ = this.currentUser$.pipe(map(u => u?.role === 'Admin'));

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  register(dto: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, dto).pipe(
      tap(res => this.storeToken(res))
    );
  }

  login(dto: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, dto).pipe(
      tap(res => this.storeToken(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser$.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────
  private storeToken(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    const decoded = this.decodeToken(response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(decoded));
    this.currentUser$.next(decoded);
  }

  private restoreSession(): void {
    const token = this.getToken();
    if (!token) return;

    try {
      const decoded = this.decodeToken(token);
      // Check expiry
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload['exp'] && Date.now() / 1000 > payload['exp']) {
        this.logout();
        return;
      }
      this.currentUser$.next(decoded);
    } catch {
      this.logout();
    }
  }

  private decodeToken(token: string): UserInfo {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    // ClaimTypes.Role from .NET encodes as the full URI claim type
    const roleClaim =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      payload['role'] ?? '';

    return {
      id: payload['sub'] ?? '',
      email: payload['email'] ?? '',
      firstName: payload['given_name'] ?? '',
      lastName: payload['family_name'] ?? '',
      role: roleClaim,
      phoneNumber: payload['phone_number'] ?? null,
      address: payload['address'] ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }
}
