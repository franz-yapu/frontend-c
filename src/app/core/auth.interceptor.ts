
import {
  HttpRequest,
  HttpEvent,
  HttpInterceptorFn,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, catchError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';
import { GeneralService } from './gerneral.service';


export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const storage = inject(GeneralService);
  const translate = inject(TranslateService);
  const token = storage.getToken();

  // Solo adjuntar el header si hay token real
  const headers: Record<string, string> = {
    'platform-seed': environment.platformSeed,
  };

  if (token) {
    // Agregar prefijo Bearer si el token no lo tiene ya
    headers['Authorization'] = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;
  }

  req = req.clone({
    setHeaders: headers,
    withCredentials: false
  });

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          storage.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};

