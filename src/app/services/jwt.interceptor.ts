import { HttpInterceptorFn, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next: HttpHandlerFn): Observable<any> => {
    const authService = inject(AuthService);
    const token = authService.getToken();
    if (req.url.includes('amazonaws.com')) {
        return next(req);
    }

    let authReq = req;
    if (token) {
        authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                return handle401Error(authReq, next, authService);
            }
            return throwError(() => error);
        })
    );
};

// Hàm xử lý lỗi 401 (token hết hạn)
const handle401Error = (req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService): Observable<any> => {
    return authService.refreshToken().pipe(
        switchMap(() => {
            const newAuthReq = req.clone({
                setHeaders: { Authorization: `Bearer ${authService.getToken()}` }
            });
            return next(newAuthReq);
        }),
        catchError(err => {
            authService.clearTokens();
            window.location.href = '/home';
            return throwError(() => err);
        })
    );
};
