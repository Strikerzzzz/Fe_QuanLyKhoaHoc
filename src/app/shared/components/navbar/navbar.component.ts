import { Component } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Client } from '../../api-client';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NzLayoutModule, NzButtonModule, NzModalModule, NzFormModule, ReactiveFormsModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isAuthPopupVisible: boolean = false;
  isRegisterMode: boolean = false;
  authForm!: FormGroup;

  constructor(private fb: FormBuilder, private apiClient: Client, private message: NzMessageService) {
    this.initializeForm();
  }
  initializeForm(): void {
    this.authForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }
  // Hiển thị popup với chế độ đăng nhập/đăng ký
  openAuthPopup(isRegister: boolean): void {
    this.isRegisterMode = isRegister;
    this.isAuthPopupVisible = true;
    this.authForm.reset();
    // Reset form và bật/tắt validation cho trường "username"
    if (isRegister) {
      this.authForm.controls['username'].setValidators([Validators.required]);
    } else {
      this.authForm.controls['username'].clearValidators();
    }
    this.authForm.controls['username'].updateValueAndValidity();
  }
  closeAuthPopup(): void {
    this.isAuthPopupVisible = false;
    this.authForm.reset();
  }
  handleSubmit(): void {
    if (this.authForm.valid) {
      const formData = this.authForm.value;

      if (this.isRegisterMode) {
        // Gửi yêu cầu đăng ký
        this.apiClient.register(formData).subscribe(
          (response: any) => {
            this.message.info('Đăng ký thành công:', response);
            console.log('Đăng ký thành công:', response);
            this.isAuthPopupVisible = false;
          },
          (error) => {
            this.message.info('Lỗi đăng ký:', error);
            console.error('Lỗi đăng ký:', error);
          }
        );
      } else {
        this.apiClient.login(formData).subscribe(
          (response: any) => {
            this.message.info('Đăng nhập thành công:', response);
            console.log('Đăng nhập thành công:', response);
            this.isAuthPopupVisible = false;
          },
          (error) => {
            this.message.info('Lỗi đăng nhập:', error);
            console.error('Lỗi đăng nhập:', error);
          }
        );
      }
    }
  }
}