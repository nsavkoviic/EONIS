import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError(error => {
      let message = 'An unexpected error occurred';

      switch (error.status) {
        case 0:
          message = 'Cannot connect to server. Is the backend running?';
          break;

        case 400:
          if (error.error?.errors) {
            // FluentValidation / ModelState errors object
            const msgs = Object.values(error.error.errors as Record<string, string[]>)
              .map(v => (Array.isArray(v) ? v[0] : v));
            message = msgs.join(', ');
          } else {
            message = error.error?.detail ?? error.error?.title ?? 'Bad request';
          }
          break;

        case 401:
          message = 'Invalid credentials';
          break;

        case 403:
          message = "You don't have permission";
          break;

        case 404:
          message = 'Resource not found';
          break;
      }

      notify.showError(message);
      return throwError(() => error);
    })
  );
};
