import { Component, OnInit } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';
import { RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AuthService } from '../../../services/auth.service';
import { LoginRequest } from '../../api-client';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzDividerModule } from 'ng-zorro-antd/divider';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NzLayoutModule, NzButtonModule, NzInputModule, NzModalModule, NzAvatarModule, NzDropDownModule,
    NzFormModule, ReactiveFormsModule, CommonModule, RouterModule, NzIconModule, NzDividerModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  isAuthPopupVisible: boolean = false;
  isRegisterMode: boolean = false;
  roles: string[] = [];
  isLoggedIn: boolean = false;
  authForm!: FormGroup;
  userName: string | null = null;
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;
  isDropdownOpen = false;
  user: any = null; // Lưu thông tin user
  
  private jwtHelper = new JwtHelperService();

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private message: NzMessageService,) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((status) => this.isLoggedIn = status);
    this.authService.userName$.subscribe((name) => this.userName = name);
    this.authService.showLoginPopup$.subscribe(show => {
      if (show) {
        this.openAuthPopup(false)
      }
    });
    this.authService.user$.subscribe(user => {
      this.user = user; // Cập nhật user khi có thay đổi
      console.log('Navbar user updated:', this.user); // Debug
    });
    this.loadUserRoles();
  }

  initializeForm(): void {
    this.authForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  confirmPasswordValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (!control.parent) return null;
    const password = control.parent.get('password');
    if (!password) return null;
    return control.value === password.value ? null : { mismatch: true };
  }

  // Hiển thị popup với chế độ đăng nhập/đăng ký
  openAuthPopup(isRegister: boolean): void {
    this.isRegisterMode = isRegister;
    this.isAuthPopupVisible = true;
    if (!this.authForm) {
      this.initializeForm();
    } else {
      this.authForm.reset();
      Object.keys(this.authForm.controls).forEach(key => {
        this.authForm.controls[key].setErrors(null);
      });
    }

    if (isRegister) {
      this.authForm.controls['username'].setValidators([Validators.required]);
      this.authForm.controls['confirmPassword'].setValidators([Validators.required, this.confirmPasswordValidator.bind(this)]);
    } else {
      this.authForm.controls['username'].clearValidators();
      this.authForm.controls['confirmPassword'].clearValidators();
    }
    this.authForm.controls['username'].updateValueAndValidity();
    this.authForm.controls['confirmPassword'].updateValueAndValidity();

  }
  closeAuthPopup(): void {
    this.isAuthPopupVisible = false;
    this.authService.hideLoginPopup();
    this.authForm.reset();
  }

  switchToRegister() {
    this.isRegisterMode = true;
  }

  switchToLogin() {
    this.isRegisterMode = false;
  }

  handleSubmit(): void {
    if (this.authForm.valid) {
      const formData = this.authForm.value;

      if (this.isRegisterMode) {
        if (formData.password !== formData.confirmPassword) {
          this.message.error('Mật khẩu và xác nhận mật khẩu không khớp');
          return;
        }
        // Gửi yêu cầu đăng ký
        this.authService.register(formData).subscribe(
          (response: any) => {
            this.message.info(response.data);
            this.isAuthPopupVisible = false;
          },
          (error) => {
            this.message.info('Lỗi đăng ký: ' + error.errors);
          }
        );
      } else {
        const loginData = new LoginRequest({
          email: formData.email,
          password: formData.password
        });
        this.authService.login(loginData).subscribe(
          () => {
            this.message.info('Đăng nhập thành công');
            this.isAuthPopupVisible = false;
            this.loadUserRoles();
          },
          (error) => {
            this.message.info('Lỗi đăng nhập: ' + error.errors);
          }
        );
      }
    }
  }

  loadUserRoles(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decodedToken = this.jwtHelper.decodeToken(token);
        this.roles = decodedToken?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || [];
        this.userName = decodedToken?.name || '';
        this.isLoggedIn = true;
        this.authService.loadUserProfile(); // Đảm bảo tải thông tin user
      } catch (error) {
        console.error('Lỗi khi giải mã token:', error);
        this.logout();
      }
    } else {
      this.roles = [];
      this.userName = '';
      this.isLoggedIn = false;
    }
  }

  // Kiểm tra user có vai trò cụ thể hay không
  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  logout(): void {
    this.authService.logout();
    this.roles = [];
    this.userName = '';
    this.isLoggedIn = false;
    this.isDropdownOpen = false;
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.passwordVisible = !this.passwordVisible;
    } else if (field === 'confirmPassword') {
      this.confirmPasswordVisible = !this.confirmPasswordVisible;
    }
  }
}