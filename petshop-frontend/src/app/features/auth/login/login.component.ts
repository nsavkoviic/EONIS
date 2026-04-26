import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Welcome Back</mat-card-title>
          <mat-card-subtitle>Sign in to your PetShop account</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email"
                autocomplete="email"
                (blur)="form.get('email')?.markAsTouched()">
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPwd ? 'text' : 'password'"
                formControlName="password" autocomplete="current-password"
                (blur)="form.get('password')?.markAsTouched()">
              <button type="button" mat-icon-button matSuffix (click)="showPwd = !showPwd">
                <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit"
              class="full-width submit-btn" [disabled]="isLoading">
              <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
              <span *ngIf="!isLoading">Sign In</span>
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <p>Don't have an account? <a routerLink="/auth/register">Register</a></p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display:flex; justify-content:center; padding:40px 16px; }
    .auth-card { width:100%; max-width:400px; padding:16px; }
    mat-card-title { font-size:1.6rem; }
    mat-card-header { margin-bottom:24px; }
    .full-width { width:100%; }
    .submit-btn { margin-top:8px; height:48px; }
    mat-card-actions { text-align:center; }
  `]
})
export default class LoginComponent {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  isLoading = false;
  showPwd   = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private notify: NotificationService
  ) {}

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.auth.login(this.form.value as any).subscribe({
      next: () => {
        this.notify.showSuccess('Welcome back!');
        this.router.navigate(['/home']);
      },
      error: () => { this.isLoading = false; },
    });
  }
}
