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
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Join PetShop today</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="row-2">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName"
                  (blur)="form.get('firstName')?.markAsTouched()">
                <mat-error *ngIf="form.get('firstName')?.hasError('required')">First name is required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName"
                  (blur)="form.get('lastName')?.markAsTouched()">
                <mat-error *ngIf="form.get('lastName')?.hasError('required')">Last name is required</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email"
                (blur)="form.get('email')?.markAsTouched()">
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
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

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput [type]="showPwd ? 'text' : 'password'" formControlName="confirmPassword"
                (blur)="form.get('confirmPassword')?.markAsTouched()">
              <mat-error *ngIf="form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone Number (optional)</mat-label>
              <input matInput formControlName="phoneNumber">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Address (optional)</mat-label>
              <textarea matInput formControlName="address" rows="2"></textarea>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit"
              class="full-width submit-btn" [disabled]="isLoading">
              <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
              <span *ngIf="!isLoading">Create Account</span>
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <p>Already have an account? <a routerLink="/auth/login">Sign in</a></p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display:flex; justify-content:center; padding:40px 16px; }
    .auth-card { width:100%; max-width:480px; padding:16px; }
    mat-card-title { font-size:1.6rem; }
    mat-card-header { margin-bottom:24px; }
    .full-width { width:100%; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .row-2 mat-form-field { width:100%; }
    .submit-btn { margin-top:8px; height:48px; }
    mat-card-actions { text-align:center; }
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
