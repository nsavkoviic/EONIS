import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pw  = control.get('password')?.value;
  const cpw = control.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">🐾</div>
        <h2 class="auth-title">Create Account</h2>
        <p class="auth-subtitle">Join PetShop today</p>
        
        <div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="row-2">
              <mat-form-field appearance="outline" class="field-group">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName"
                  (blur)="form.get('firstName')?.markAsTouched()">
                <mat-error *ngIf="form.get('firstName')?.hasError('required')">First name is required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-group">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName"
                  (blur)="form.get('lastName')?.markAsTouched()">
                <mat-error *ngIf="form.get('lastName')?.hasError('required')">Last name is required</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width field-group">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email"
                (blur)="form.get('email')?.markAsTouched()">
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width field-group">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPwd ? 'text' : 'password'" formControlName="password"
                (blur)="form.get('password')?.markAsTouched()">
              <button type="button" mat-icon-button matSuffix (click)="showPwd = !showPwd">
                <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-hint>Min 8 chars, uppercase, lowercase, number</mat-hint>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('minlength')">Min 8 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width field-group">
              <mat-label>Confirm Password</mat-label>
              <input matInput [type]="showPwd ? 'text' : 'password'" formControlName="confirmPassword"
                (blur)="form.get('confirmPassword')?.markAsTouched()">
              <mat-error *ngIf="form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width field-group">
              <mat-label>Phone (optional)</mat-label>
              <input matInput formControlName="phoneNumber">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width field-group">
              <mat-label>Address (optional)</mat-label>
              <input matInput formControlName="address" placeholder="e.g. 123 Main St, City">
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit"
              class="full-width submit-btn" [disabled]="isLoading">
              <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
              <span *ngIf="!isLoading">Create Account</span>
            </button>
          </form>
        </div>
        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/auth/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 68px);
      display: flex; align-items: center; justify-content: center;
      padding: 40px 16px;
      background: linear-gradient(135deg, #fff8f0 0%, #fff3e0 100%);
    }
    .auth-card {
      width: 100%; max-width: 500px;
      background: white; border-radius: 24px;
      border: 1px solid #f0e6d3;
      box-shadow: 0 20px 60px rgba(245,124,0,.12);
      padding: 40px;
    }
    .auth-logo { text-align: center; font-size: 2.5rem; margin-bottom: 8px; }
    .auth-title {
      text-align: center; font-size: 1.8rem; font-weight: 800;
      color: #1a1a1a; margin: 0 0 6px;
    }
    .auth-subtitle { text-align: center; color: #6b7280; margin: 0 0 32px; }
    .field-group { margin-bottom: 16px; }
    .field-label { font-size: .85rem; font-weight: 600; color: #374151; margin-bottom: 6px; display: block; }
    .full-width { width: 100%; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .row-2 mat-form-field { width:100%; }
    .submit-btn {
      width: 100%; height: 52px; font-size: 1rem !important;
      font-weight: 700 !important; border-radius: 12px !important;
      margin-top: 8px;
      background: linear-gradient(135deg, #f57c00, #e65100) !important;
      box-shadow: 0 4px 16px rgba(245,124,0,.35) !important;
    }
    .submit-btn:hover { transform: translateY(-1px) !important; box-shadow: 0 8px 24px rgba(245,124,0,.45) !important; }
    .auth-footer { text-align: center; margin-top: 24px; color: #6b7280; font-size: .9rem; }
    .auth-footer a { color: #f57c00; font-weight: 600; text-decoration: none; }
    .error-msg { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c;
      padding: 10px 14px; border-radius: 10px; font-size: .85rem; margin-bottom: 16px; }
  `]
})
export default class RegisterComponent {
  form = this.fb.group({
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    phoneNumber:     [''],
    address:         [''],
  }, { validators: passwordMatchValidator });

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
    const { confirmPassword, ...dto } = this.form.value as any;
    this.auth.register(dto).subscribe({
      next: () => {
        this.notify.showSuccess('Account created successfully!');
        this.router.navigate(['/home']);
      },
      error: () => { this.isLoading = false; },
    });
  }
}
