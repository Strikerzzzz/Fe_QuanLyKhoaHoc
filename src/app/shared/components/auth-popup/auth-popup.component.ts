import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth-popup',
  standalone: true,
  imports: [NzModalModule, NzFormModule, NzInputModule, ReactiveFormsModule],
  templateUrl: './auth-popup.component.html',
  styleUrl: './auth-popup.component.scss'
})
export class AuthPopupComponent implements OnInit {
  isVisible = false;
  loginForm!: FormGroup;
  ngOnInit(): void {
  }
  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  openPopup(): void {
    this.isVisible = true;
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  submitForm(): void {
    console.log('Đăng nhập thành công', this.loginForm.value);
    this.isVisible = false;
  }
}
