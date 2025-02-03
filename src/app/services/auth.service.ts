import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private jwtHelper = new JwtHelperService();

    constructor() { }

    // Lấy access token từ localStorage
    getToken(): string | null {
        return localStorage.getItem('access_token');
    }

    // Giải mã JWT và lấy thông tin người dùng
    getDecodedToken(): any {
        const token = this.getToken();
        if (token) {
            return this.jwtHelper.decodeToken(token);
        }
        return null;
    }

    // Kiểm tra xem token có hợp lệ không
    isAuthenticated(): boolean {
        const token = this.getToken();
        return token !== null && !this.jwtHelper.isTokenExpired(token);
    }

    // Kiểm tra người dùng có phải Admin không
    isAdmin(): boolean {
        const decodedToken = this.getDecodedToken();
        if (decodedToken) {
            const roles = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            return Array.isArray(roles) && roles.includes('Admin');
        }
        return false;
    }
}
