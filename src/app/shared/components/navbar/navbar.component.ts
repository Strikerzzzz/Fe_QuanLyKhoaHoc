import { Component, OnInit } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Client } from '../../api-client';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router, RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon'; // ADDED: Import cho icon

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NzLayoutModule, NzButtonModule, NzModalModule, NzFormModule, ReactiveFormsModule, CommonModule, RouterModule, NzIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  isAuthPopupVisible: boolean = false;
  isRegisterMode: boolean = false;
  roles: string[] = [];
  isLoggedIn: boolean = false;
  authForm!: FormGroup;
  userName: string = '';

  // ADDED: Các biến để điều khiển hiển thị mật khẩu (toggle giữa password và text)
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;

  private jwtHelper = new JwtHelperService();

  constructor(private fb: FormBuilder, private apiClient: Client, private message: NzMessageService, private router: Router) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadUserRoles();
  }

  initializeForm(): void {
    this.authForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [''] // Thêm control này để xác nhận mật khẩu
    });
  }

  // Validator cho confirmPassword: so sánh với trường password
  confirmPasswordValidator(control: AbstractControl): { [key: string]: boolean } | null {
    // Kiểm tra xem control đã được gắn với form group hay chưa
    if (!control.parent) return null;
    const password = control.parent.get('password');
    if (!password) return null;
    return control.value === password.value ? null : { mismatch: true };
  }

  // Hiển thị popup với chế độ đăng nhập/đăng ký
  openAuthPopup(isRegister: boolean): void {
    this.isRegisterMode = isRegister;
    this.isAuthPopupVisible = true;
    this.authForm.reset();
    // Reset form và bật/tắt validation cho trường "username"
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
    this.authForm.reset();
  }
  handleSubmit(): void {
    if (this.authForm.valid) {
      const formData = this.authForm.value;

      // Nếu đang ở chế độ đăng ký, kiểm tra lại confirmPassword
      if (this.isRegisterMode) {
        if (formData.password !== formData.confirmPassword) {
          this.message.error('Mật khẩu và xác nhận mật khẩu không khớp');
          return; // Không gửi yêu cầu đăng ký nếu 2 trường không khớp
        }
        // Gửi yêu cầu đăng ký
        this.apiClient.register(formData).subscribe(
          (response: any) => {
            this.message.info(response.data);
            this.isAuthPopupVisible = false;
          },
          (error) => {
            this.message.info('Lỗi đăng ký: ' + error.errors);
          }
        );
      } else {
        this.apiClient.login(formData).subscribe(
          (response: any) => {
            this.message.info('Đăng nhập thành công');
            this.isAuthPopupVisible = false;
            this.saveToken(response.data);
          },
          (error) => {
            this.message.info('Lỗi đăng nhập: ' + error.errors);
          }
        );
      }
    }
  }

  // Lưu token vào localStorage sau khi đăng nhập
  saveToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.loadUserRoles(); // Cập nhật thông tin user sau khi đăng nhập
  }

  // Giải mã token và lấy thông tin role
  loadUserRoles(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decodedToken = this.jwtHelper.decodeToken(token);
        this.roles = decodedToken?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || [];
        this.userName = decodedToken?.name || '';
        this.isLoggedIn = true;
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
    localStorage.removeItem('access_token');
    this.roles = [];
    this.userName = '';
    this.isLoggedIn = false;
    this.router.navigate(['/home']);
  }
   // ADDED: Hàm chuyển đổi hiển thị mật khẩu cho trường "password" và "confirmPassword"
   togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.passwordVisible = !this.passwordVisible;
    } else if (field === 'confirmPassword') {
      this.confirmPasswordVisible = !this.confirmPasswordVisible;
    }
  }
}