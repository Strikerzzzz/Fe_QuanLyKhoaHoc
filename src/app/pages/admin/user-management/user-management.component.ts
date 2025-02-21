import { Component, OnInit } from '@angular/core';
import { Client, User, UserPagedResultResult, AssignRoleRequest, RemoveRoleRequest } from '../../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { FormsModule } from '@angular/forms';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-user-management',
  imports: [
    NzTableModule,
    NzCardModule,
    NzButtonModule,
    CommonModule,
    NzModalModule,
    NzListModule,
    NzCheckboxModule,
    FormsModule,
    NzPopconfirmModule,
    NzInputNumberModule,
    NzPaginationModule,
    NzInputModule
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  allRoles: string[] = ['Admin', 'Lecturer', 'User'];
  loading: boolean = false;
  showRolePopup: boolean = false;
  selectedUser: User | null = null;
  currentRoles: string[] = [];
  originalRoles: string[] = [];

  // Các biến phân trang và tìm kiếm
  currentPage: number = 1;
  pageSize: number = 2;
  searchOptions: string = '';
  totalItems: number = 0;

  // Các biến liên quan đến Lock User
  lockPopupVisible: boolean = false;
  selectedUserId: string | null = null;
  lockDuration: Date = new Date(0, 0, 0, 0, 0, 0);
  remainingLockTime: number | null = null;
  lockoutInterval: any;
  lockDays: number = 0;
  lockHours: number = 0;
  lockMinutes: number = 0;
  lockoutRemainingMap = new Map<string | any, string>();

  constructor(
    private apiClient: Client,
    private message: NzMessageService,
    private modal: NzModalService,
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    setInterval(() => this.updateRemainingTimes(), 1000);
  }

  updateRemainingTimes(): void {
    this.users.forEach(user => {
      if (user.lockoutEnd) {
        this.lockoutRemainingMap.set(user.id, this.getRemainingLockTimeFormatted(user.lockoutEnd));
      }
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.apiClient.usersGET(this.currentPage, this.pageSize, this.searchOptions).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.succeeded) {
          this.users = response.data.users || [];
          this.totalItems = response.data.totalCount || 0;
          const maxPage = Math.ceil(this.totalItems / this.pageSize) || 1;
          if (this.currentPage > maxPage) {
            this.currentPage = maxPage;
            this.loadUsers();
          }
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

  onPageIndexChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  // Hàm xử lý thay đổi số lượng bản ghi trên mỗi trang
  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.loadUsers();
  }

  // Hàm tìm kiếm người dùng theo options
  searchUsers(): void {
    this.loadUsers();
  }

  editRoles(user: User): void {
    this.selectedUser = user;
    this.currentRoles = [];
    this.originalRoles = [];

    this.apiClient.roles(user.email!).subscribe({
      next: (response) => {
        this.originalRoles = response.data ? [...response.data] : []; // Lưu danh sách vai trò gốc
        this.currentRoles = response.data ? [...response.data] : []; // Gán giá trị cho UI
        this.showRolePopup = true;
      },
      error: () => this.message.error('Lỗi khi lấy danh sách vai trò!')
    });
  }

  onRoleChange(role: string, checked: boolean): void {
    if (checked) {
      this.currentRoles.push(role);
    } else {
      this.currentRoles = this.currentRoles.filter(r => r !== role);
    }
  }

  async saveRoles(): Promise<void> {
    if (!this.selectedUser || !this.selectedUser.email) {
      this.message.error('Không thể xác định người dùng!');
      return;
    }

    const rolesToAdd = this.currentRoles.filter(role => !this.originalRoles.includes(role));
    const rolesToRemove = this.originalRoles.filter(role => !this.currentRoles.includes(role));

    try {
      for (const role of rolesToAdd) {
        await this.apiClient.assignRole(new AssignRoleRequest({ email: this.selectedUser.email, role })).toPromise();
      }

      for (const role of rolesToRemove) {
        await this.apiClient.removeRole(new RemoveRoleRequest({ email: this.selectedUser.email, role })).toPromise();
      }

      this.message.success('Cập nhật vai trò thành công!');
      this.showRolePopup = false;
      this.loadUsers();
    } catch (error) {
      this.message.error('Lỗi khi cập nhật vai trò!');
    }
  }

  openLockUserModal(userId: string): void {
    this.selectedUserId = userId;
    this.resetLockTime();
    this.lockPopupVisible = true;
  }

  resetLockTime(): void {
    this.lockDays = 0;
    this.lockHours = 0;
    this.lockMinutes = 0;
  }

  async saveLock(): Promise<void> {
    if (!this.selectedUserId) {
      this.message.error('Không thể xác định người dùng!');
      return;
    }

    const totalMinutes = this.calculateLockDuration();
    if (totalMinutes <= 0) {
      this.message.warning('Thời gian khóa phải lớn hơn 0!');
      return;
    }

    try {
      await this.apiClient.lock(this.selectedUserId, totalMinutes).toPromise();
      this.message.success(`Tài khoản đã bị khóa trong ${this.formatDuration(totalMinutes)}`);
      this.lockPopupVisible = false;
      this.loadUsers();
    } catch (error) {
      console.error('❌ Lỗi khi khóa tài khoản:', error);
      this.message.error('Không thể khóa tài khoản. Vui lòng thử lại!');
    }
  }
  calculateLockDuration(): number {
    return (this.lockDays * 1440) + (this.lockHours * 60) + this.lockMinutes;
  }

  formatDuration(totalMinutes: number): string {
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return `${days} ngày ${hours} giờ ${minutes} phút`;
  }

  unlockUser(userId: string): void {
    this.apiClient.unlock(userId).subscribe({
      next: () => {
        this.message.success('Mở khóa tài khoản thành công!');
        this.loadUsers();
      },
      error: () => this.message.error('Lỗi khi mở khóa tài khoản!'),
    });
  }

  getRemainingLockTimeFormatted(lockoutEnd?: Date): string {
    if (!lockoutEnd) return 'Không có dữ liệu';

    const remainingMs = new Date(lockoutEnd).getTime() - new Date().getTime();
    if (remainingMs <= 0) return 'Hết hạn';

    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${days} ngày ${hours} giờ ${minutes} phút`;
  }

  clearLockoutTimer(): void {
    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.clearLockoutTimer();
  }
  isLocked(lockoutEnd?: Date): boolean {
    return lockoutEnd ? new Date(lockoutEnd) > new Date() : false;
  }
  deleteUser(id: string): void {
    this.apiClient.usersDELETE(id).subscribe({
      next: () => {
        this.message.success('Xóa người dùng thành công!');
        this.loadUsers();
      },
      error: (error) => {
        this.message.error('Lỗi khi xóa người dùng!' + error.errors);
      }
    });
  }
}
