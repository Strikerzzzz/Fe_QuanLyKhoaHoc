import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Client } from '../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { UploadService } from '../../services/avatar-upload.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { UpdateUserProfileRequest, UploadResponse } from '../../shared/api-client'; // Đảm bảo import đúng
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NzAvatarModule, NzSpinModule, NzAlertModule, NzModalModule, NzButtonModule, NzProgressModule, NzIconModule, FormsModule, NzFormModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  user: any = null;
  editData: Partial<UpdateUserProfileRequest> = {};
  isLoading: boolean = true;
  errorMessage: string = '';
  isEditModalVisible: boolean = false;

  avatarUploadProgress = 0;
  avatarPreviewUrl: string | null = null;
  allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
  allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  maxFileSize = 5 * 1024 * 1024;
  selectedAvatarFile: File | null = null;

  private cloudFrontDomain = 'https://drui9ols58b43.cloudfront.net';
  private avatarPrefix = 'images/avatars/'; // Thêm tiền tố theo backend

  constructor(
    private client: Client,
    private message: NzMessageService,
    private http: HttpClient,
    private avatarUploadService: UploadService,
    private authService: AuthService // Thêm AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
      if (this.user) {
        this.editData.fullName = this.user.fullName || '';
        this.editData.phoneNumber = this.user.phoneNumber || '';
        this.editData.avatarUrl = this.user.avatarUrl || '';
        this.avatarPreviewUrl = this.user.avatarUrl || null;
      }
    });
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.client.profileGET().subscribe({
      next: (data) => {
        this.user = data.data;
        if (this.user && typeof this.user.createdAt === 'string') {
          this.user.createdAt = new Date(this.user.createdAt);
        }
        this.editData.fullName = this.user.fullName || '';
        this.editData.phoneNumber = this.user.phoneNumber || '';
        // Xây dựng lại avatarUrl chỉ khi cần
        if (this.user.avatarUrl && !this.user.avatarUrl.startsWith('http')) {
          this.user.avatarUrl = `${this.cloudFrontDomain}/${this.user.avatarUrl}`; // Không thêm avatarPrefix nữa
        }
        this.editData.avatarUrl = this.user.avatarUrl || '';
        this.avatarPreviewUrl = this.user.avatarUrl || null;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Không thể tải thông tin người dùng!';
        this.message.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  openEditModal(): void {
    this.isEditModalVisible = true;
    this.avatarPreviewUrl = this.user.avatarUrl || null;
    this.selectedAvatarFile = null;
    this.avatarUploadProgress = 0;
  }

  closeEditModal(): void {
    this.isEditModalVisible = false;
    this.avatarPreviewUrl = this.user.avatarUrl || null;
    this.selectedAvatarFile = null;
    this.avatarUploadProgress = 0;
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      this.onAvatarFileSelected({ target: { files: event.dataTransfer.files } });
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
  }

  onAvatarFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!this.isValidImageFile(file)) {
        return;
      }
      this.selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  isValidImageFile(file: File): boolean {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !this.allowedExtensions.includes('.' + fileExtension)) {
      this.message.error("Định dạng file không hợp lệ! Chỉ chấp nhận JPG, JPEG, PNG, GIF, BMP, WEBP.");
      return false;
    }
    if (!this.allowedImageTypes.includes(file.type)) {
      this.message.error("Loại file không hợp lệ! Chỉ chấp nhận file ảnh.");
      return false;
    }
    if (file.size > this.maxFileSize) {
      this.message.error("File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.");
      return false;
    }
    return true;
  }

  saveProfileChanges(): void {
    if (this.selectedAvatarFile) {
      this.handleAvatarUpload();
    } else {
      this.updateProfileWithoutAvatar();
    }
  }

  handleAvatarUpload(): void {
    if (!this.selectedAvatarFile) {
      this.message.error("Vui lòng chọn file avatar.");
      return;
    }
  
    const file = this.selectedAvatarFile;
  
    this.avatarUploadService.getPresignedUrl(file.name, file.type, 'avatar').subscribe({
      next: (presignedResponse: UploadResponse) => {
        if (!presignedResponse.presignedUrl || !presignedResponse.objectKey) {
          this.message.error("Dữ liệu Presigned URL không hợp lệ.");
          return;
        }
  
        const objectKey = presignedResponse.objectKey;
        const headers = new HttpHeaders({ 'Content-Type': file.type });
  
        const req = new HttpRequest('PUT', presignedResponse.presignedUrl, file, {
          reportProgress: true,
          headers: headers
        });
  
        this.http.request(req).subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              this.avatarUploadProgress = Math.round((100 * event.loaded) / event.total);
            } else if (event.type === HttpEventType.Response) {
              const updateRequest = new UpdateUserProfileRequest({
                fullName: this.editData.fullName,
                phoneNumber: this.editData.phoneNumber,
                avatarUrl: objectKey // Gửi objectKey
              });
  
              this.client.profilePUT(updateRequest).subscribe({
                next: (response) => {
                  const newAvatarUrl = `${this.cloudFrontDomain}/${objectKey}`; // Không thêm avatarPrefix
                  this.user.avatarUrl = newAvatarUrl;
                  this.editData.avatarUrl = newAvatarUrl;
                  this.avatarPreviewUrl = newAvatarUrl;
                  this.authService.updateUser(this.user); // Cập nhật user trong AuthService
                  this.message.success("Cập nhật thông tin và avatar thành công!");
                  this.closeEditModal();
                  this.authService.loadUserProfile(); // Đảm bảo đồng bộ với server
                },
                error: (err) => {
                  this.message.error("Lỗi cập nhật avatar: " + err);
                }
              });
            }
          },
          error: (err) => {
            this.message.error("Lỗi upload file lên S3: ");
          }
        });
      },
      error: (err) => {
        this.message.error("Lỗi lấy Presigned URL: " + (err.message || 'undefined'));
      }
    });
  }

  updateProfileWithoutAvatar(): void {
    const updateRequest = new UpdateUserProfileRequest({
      fullName: this.editData.fullName,
      phoneNumber: this.editData.phoneNumber,
      avatarUrl: this.user.avatarUrl ? this.user.avatarUrl.split('/').pop() : undefined // Lấy objectKey
    });

    this.client.profilePUT(updateRequest).subscribe({
      next: (response) => {
        this.user.fullName = this.editData.fullName;
        this.user.phoneNumber = this.editData.phoneNumber;
        this.message.success("Cập nhật thông tin thành công!");
        this.closeEditModal();
        this.loadUserProfile(); // Đảm bảo đồng bộ với server
      },
      error: (err) => {
        this.message.error("Lỗi cập nhật thông tin: " + err);
      }
    });
  }
}
