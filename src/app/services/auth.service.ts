import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Client, RefreshTokenResponseResult, RefreshTokenRequest, LoginRequest, RegisterRequest } from '../shared/api-client';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private jwtHelper = new JwtHelperService();
    private readonly accessTokenKey = 'access_token';
    private readonly refreshTokenKey = 'refresh_token';
    private isLoggedInSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
    public isLoggedIn$ = this.isLoggedInSubject.asObservable();

    private userNameSubject = new BehaviorSubject<string | null>(this.getUserName());
    public userName$ = this.userNameSubject.asObservable();
    private showLoginPopupSubject = new BehaviorSubject<boolean>(false);
    public showLoginPopup$ = this.showLoginPopupSubject.asObservable();


    constructor(private apiClient: Client) { }
    showLoginPopup(): void {
        this.showLoginPopupSubject.next(true);
    }

    hideLoginPopup(): void {
        this.showLoginPopupSubject.next(false);
    }

    getToken(): string | null {
        return localStorage.getItem('access_token');
    }

    setToken(token: string): void {
        localStorage.setItem(this.accessTokenKey, token);
        this.isLoggedInSubject.next(true);
        this.userNameSubject.next(this.getUserName());
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshTokenKey);
    }

    setRefreshToken(token: string): void {
        localStorage.setItem(this.refreshTokenKey, token);
    }

    clearTokens(): void {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        this.isLoggedInSubject.next(false);
        this.userNameSubject.next(null);
    }

    // Giải mã JWT và lấy thông tin người dùng
    getDecodedToken(): any {
        const token = this.getToken();
        return token ? this.jwtHelper.decodeToken(token) : null;
    }

    // Kiểm tra xem token có hợp lệ không
    isAuthenticated(): boolean {
        const token = this.getToken();
        return token !== null && !this.jwtHelper.isTokenExpired(token);
    }
    getUserName(): string | null {
        const token = this.getToken();
        if (token) {
            try {
                const decoded = this.jwtHelper.decodeToken(token);
                return decoded?.name || null;
            } catch (error) {
                console.error('Error decoding token:', error);
                return null;
            }
        }
        return null;
    }

    isAdmin(): boolean {
        const decodedToken = this.getDecodedToken();
        if (decodedToken) {
            const roles = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            return Array.isArray(roles) && roles.includes('Admin');
        }
        return false;
    }
    isLecturer(): boolean {
        const decodedToken = this.getDecodedToken();
        if (decodedToken) {
            const roles = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            return Array.isArray(roles) && roles.includes('Lecturer');
        }
        return false;
    }
    refreshToken(): Observable<RefreshTokenResponseResult> {
        const refresh = this.getRefreshToken();
        if (!refresh) {
            return throwError(() => new Error('No refresh token available'));
        }

        const request = new RefreshTokenRequest();
        request.refreshToken = refresh;

        return this.apiClient.refreshToken(request).pipe(
            tap((result: RefreshTokenResponseResult) => {
                if (result?.succeeded && result?.data?.accessToken && result?.data?.refreshToken) {
                    this.setToken(result.data.accessToken);
                    this.setRefreshToken(result.data.refreshToken);
                } else {
                    this.clearTokens();
                }
            }),
            catchError(err => {
                this.clearTokens();
                return throwError(() => err);
            })
        );
    }

    login(data: LoginRequest): Observable<any> {
        return this.apiClient.login(data).pipe(
            tap((response: any) => {
                if (response?.data) {
                    this.setToken(response.data.accessToken);
                    this.setRefreshToken(response.data.refreshToken);
                }
            }),
            catchError(err => {
                return throwError(() => err);
            })
        );
    }

    register(data: RegisterRequest): Observable<any> {
        return this.apiClient.register(data).pipe(
            tap((response: any) => {
                console.log('Registration successful:', response);
            }),
            catchError(err => {
                return throwError(() => err);
            })
        );
    }

    logout(): void {
        this.clearTokens();
        window.location.href = '/home';
    }
}
