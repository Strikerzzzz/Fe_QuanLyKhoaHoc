import { Component, OnInit } from '@angular/core';
import { Client, User, UserIEnumerableResult } from '../../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  imports: [NzTableModule, NzCardModule, NzButtonModule, CommonModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading: boolean = false;

  constructor(private apiClient: Client, private message: NzMessageService) { }

  ngOnInit(): void {
    this.loadUsers();
  }
  loadUsers(): void {
    this.loading = true;
    this.apiClient.usersGET().subscribe({
      next: (response: UserIEnumerableResult) => {
        this.loading = false;
        if (response.succeeded) {
          this.users = response.data || [];
        } else {
          this.message.error('Lỗi khi tải danh sách người dùng!');
        }
      },
      error: () => {
        this.loading = false;
        this.message.error('Không thể kết nối đến API.');
      }
    });
  }
  deleteUser(id: string): void {
    this.apiClient.usersDELETE(id).subscribe({
      next: () => {
        this.message.success('Xóa người dùng thành công!');
        this.loadUsers();
      },
      error: () => {
        this.message.error('Lỗi khi xóa người dùng!');
      }
    });
  }
}
