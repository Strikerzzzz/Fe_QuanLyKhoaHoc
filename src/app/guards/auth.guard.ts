import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        // Nếu token hiện tại hợp lệ, kiểm tra role ngay
        if (this.authService.isAuthenticated()) {
            return of(this.checkRole(route));
        }
        // Nếu token đã hết hạn nhưng có refresh token, cố gắng làm mới
        else if (this.authService.getRefreshToken()) {
            return this.authService.refreshToken().pipe(
                map(() => this.checkRole(route)),
                catchError((err) => {
                    this.router.navigate(['/home']);
                    return of(false);
                })
            );
        } else {
            this.router.navigate(['/home']);
            return of(false);
        }
    }

    private checkRole(route: ActivatedRouteSnapshot): boolean {
        const requiredRole = route.data['role'];
        const isAdmin = this.authService.isAdmin();
        const isLecturer = this.authService.isLecturer();
        console.log('Please');
        if (!requiredRole || (requiredRole === 'Admin' && isAdmin) || (requiredRole === 'Lecturer' && isLecturer)) {
            return true;
        }
        this.router.navigate(['/home']);
        return false;
    }
}
