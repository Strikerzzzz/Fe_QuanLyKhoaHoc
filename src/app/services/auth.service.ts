import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Client,UserResult, RefreshTokenResponseResult, RefreshTokenRequest, LoginRequest, RegisterRequest } from '../shared/api-client';
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

    private userSubject = new BehaviorSubject<any>(null); // Thêm để lưu thông tin user (bao gồm avatarUrl)
    public user$ = this.userSubject.asObservable(); // Cho phép các component subscribe

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
        this.userSubject.next(null); // Xóa thông tin user khi logout
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
            if (Array.isArray(roles)) {
                return roles.includes('Admin');
            } else if (typeof roles === 'string') {
                return roles === 'Admin';
            }
        }
        return false;
    }

    isLecturer(): boolean {
        const decodedToken = this.getDecodedToken();
        if (decodedToken) {
            const roles = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            if (Array.isArray(roles)) {
                return roles.includes('Lecturer');
            } else if (typeof roles === 'string') {
                return roles === 'Lecturer';
            }
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
                    this.loadUserProfile(); // Tải lại thông tin user sau khi refresh token
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
                    this.loadUserProfile(); // Tải thông tin user sau khi đăng nhập
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

    // Tải thông tin người dùng từ API
    // auth.service.ts
loadUserProfile(): void {
  this.apiClient.profileGET().subscribe({
    next: (data: UserResult) => {
      console.log('User profile loaded:', data);
      let avatarUrl = data.data?.avatarUrl || ''; // Sử dụng optional chaining
      if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('https')) {
        avatarUrl = `https://drui9ols58b43.cloudfront.net/${avatarUrl}`;
      }
      const userData = data.data ? { ...data.data, avatarUrl } : null; // Tạo object mới nếu data tồn tại
      this.updateUser(userData); // Cập nhật user
    },
    error: (err) => {
      console.error('Error loading user profile:', err);
    }
  });
}
    // Phương thức công khai để cập nhật thông tin user
    updateUser(user: any): void {
        this.userSubject.next(user);
    }
}
