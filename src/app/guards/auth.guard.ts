import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/home']);
            return false;
        }
        const requiredRole = route.data['role'];
        const isAdmin = this.authService.isAdmin();
        const isLecturer = this.authService.isLecturer();
        if (!requiredRole || (requiredRole === 'Admin' && isAdmin) || (requiredRole === 'Lecturer' && isLecturer)) {
            return true;
        }
        this.router.navigate(['/home']);
        return false;
    }
}
