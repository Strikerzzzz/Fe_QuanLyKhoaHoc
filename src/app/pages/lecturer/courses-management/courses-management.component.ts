import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Client, CreateCourseRequest, UpdateCourseRequest, UpdateAvatarRequest, AvatarUploadResponse } from '../../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AvatarUploadService } from '../../../services/avatar-upload.service';
import { HttpClient, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';

@Component({
  selector: 'app-courses-management',
  imports: [RouterModule, NzTableModule, NzModalModule, NzFormModule, FormsModule, CommonModule,
    NzPopconfirmModule, NzPaginationModule, NzButtonModule, NzInputModule, NzSelectModule],
  templateUrl: './courses-management.component.html',
  styleUrl: './courses-management.component.scss'
})

export class CoursesManagementComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  courses: any[] = [];
  courseData: Partial<CreateCourseRequest | UpdateCourseRequest> = {};
  selectedCourseId?: number;

  isVisible = false;
  isEditMode = false;

  currentPage = 1;
  pageSize = 5;
  displayedCourses: any[] = [];


  difficultyLevels = [
    { label: 'Dễ', value: 'Dễ' },
    { label: 'Trung bình', value: 'Trung bình' },
    { label: 'Khó', value: 'Khó' }
  ];

  filteredKeywords: string[] = [];

  keywordString: string[] = [];

  suggestedKeywords: string[] = [
    'Lập trình', 'Web Development', 'JavaScript', 'Python', 'Java', 'SQL',
    'React', 'Angular', 'Node.js', 'AI', 'Machine Learning', 'Data Science',
    'Cybersecurity', 'Blockchain', 'DevOps', 'Docker', 'Kubernetes', 'Cloud Computing',
    'UI/UX', 'Figma', 'Photoshop', 'SEO', 'Digital Marketing'
  ];

  // --- Các biến liên quan đến Avatar Upload ---
  isAvatarModalVisible = false;
  selectedCourseForAvatar: any = null;
  selectedAvatarFile: File | null = null;
  avatarUploadProgress = 0;
  avatarPreviewUrl: string | null = null;


  constructor(
    private client: Client,
    private message: NzMessageService,
    private router: Router,
    private modal: NzModalService,
    private http: HttpClient,
    private avatarUploadService: AvatarUploadService
  ) { }

  ngOnInit(): void {
    this.loadCourses();
  }

  // Lấy danh sách khóa học từ API
  loadCourses(): void {
    this.client.coursesGET2().subscribe(
      res => {
        this.courses = res.data || [];
        const totalPages = Math.ceil(this.courses.length / this.pageSize);
        if (this.currentPage > totalPages && totalPages > 0) {
          this.currentPage = totalPages;
        }
        this.updateDisplayedCourses();
      },
      err => {
        this.message.error("Lỗi khi tải danh sách khóa học!");
      }
    );
  }

  // Cập nhật dữ liệu hiển thị theo trang
  updateDisplayedCourses(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.displayedCourses = this.courses.slice(startIndex, startIndex + this.pageSize);
  }

  // Xử lý khi chuyển trang
  onPageChange(pageIndex: number): void {
    this.currentPage = pageIndex;
    this.updateDisplayedCourses();
  }

  /**
   * Hiển thị modal:
   * - Nếu isEdit là true: hiện form cập nhật, lưu tạm id của khóa học cần sửa
   * - Nếu isEdit là false: hiện form tạo mới, xóa selectedCourseId và reset courseData
   */
  showModal(isEdit: boolean, course?: any): void {
    this.isEditMode = isEdit;
    if (isEdit && course) {
      this.selectedCourseId = course.courseId;
      this.courseData = {
        title: course.title,
        description: course.description,
        price: course.price,
        difficulty: course.difficulty,
        keywords: course.keywords,
        avatarUrl: course.avatarUrl
      };

      // Nếu từ khóa là chuỗi, chuyển thành mảng để hiển thị trong select
      this.keywordString = course.keywords
        ? course.keywords.split(", ").map((k: string) => k.trim())
        : [];


    } else {
      this.selectedCourseId = undefined;
      this.courseData = {};
      this.keywordString = [];
    }
    this.isVisible = true;

  }

  // Xử lý nút OK của modal
  handleOk(): void {
    if (this.isEditMode) {
      this.updateCourse();
    } else {
      this.addCourse();
    }
  }

  // Đóng modal
  handleCancel(): void {
    this.isVisible = false;
  }

  // Gọi API thêm khóa học
  addCourse(): void {
    this.client.coursesPOST(this.courseData as CreateCourseRequest).subscribe(
      () => {
        this.message.success("Thêm khóa học thành công!");
        this.isVisible = false;
        this.loadCourses();
      },
      err => {
        this.message.error("Lỗi khi thêm khóa học!");
      }
    );
  }

  // Gọi API cập nhật khóa học
  updateCourse(): void {
    if (!this.selectedCourseId) {
      this.message.error("Không xác định được khóa học cần cập nhật!");
      return;
    }
    this.client.coursesPUT(this.selectedCourseId, this.courseData as UpdateCourseRequest).subscribe(
      () => {
        this.message.success("Cập nhật khóa học thành công!");
        this.isVisible = false;
        this.loadCourses();
      },
      err => {
        this.message.error("Lỗi khi cập nhật khóa học!");
      }
    );
  }

  // Xóa khóa học dựa theo id
  deleteCourse(courseId: number): void {
    this.client.coursesDELETE(courseId).subscribe(
      () => {
        this.message.success("Xóa khóa học thành công!");
        this.loadCourses();
      },
      err => {
        this.message.error("Lỗi khi xóa khóa học!");
      }
    );
  }
  goToContent(courseId: number): void {
    this.router.navigate(['/lecturer/courses-content', courseId]);
  }
  updateKeywordString(): void {
    if (Array.isArray(this.keywordString)) {
      this.courseData.keywords = this.keywordString.join(", ");
    } else {
      this.courseData.keywords = this.keywordString;
    }
  }
  onSearchKeyword(searchValue: string): void {
    this.filteredKeywords = this.suggestedKeywords
      .filter((keyword: string) => keyword.toLowerCase().includes(searchValue.toLowerCase()));
  }

  // ---------------------- Các hàm liên quan đến Avatar Upload ----------------------
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
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.message.error("File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.");
        this.isAvatarModalVisible = false;
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


  openAvatarModal(course: any): void {
    this.selectedCourseForAvatar = course;
    this.isAvatarModalVisible = true;
    this.selectedAvatarFile = null;
    this.avatarPreviewUrl = null;
    this.avatarUploadProgress = 0;
  }

  closeAvatarModal(): void {
    this.isAvatarModalVisible = false;
  }

  handleAvatarUpload(): void {
    if (!this.selectedCourseForAvatar || !this.selectedAvatarFile) {
      this.message.error("Vui lòng chọn file avatar.");
      return;
    }

    const courseId = this.selectedCourseForAvatar.courseId;
    const file = this.selectedAvatarFile;

    // Gọi API để lấy presignedUrl và objectKey qua AvatarUploadService
    this.avatarUploadService.getPresignedUrl(courseId, file.name, file.type).subscribe({
      next: (presignedResponse: AvatarUploadResponse) => {
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
              // Sau khi upload thành công, gọi API cập nhật avatar cho khóa học
              const updateRequest = new UpdateAvatarRequest({ avatarObjectKey: objectKey });

              this.client.avatarCourse(courseId, updateRequest).subscribe({
                next: () => {
                  const cloudFrontDomain = 'https://drui9ols58b43.cloudfront.net';
                  const avatarUrl = `${cloudFrontDomain}/${objectKey}`;
                  this.selectedCourseForAvatar.avatarUrl = avatarUrl;

                  this.message.success("Avatar cập nhật thành công!");
                  this.closeAvatarModal();
                },
                error: (err) => {
                  this.message.error("Lỗi cập nhật avatar: " + err);
                }
              });
            }
          },
          error: (err) => {
            this.message.error("Lỗi upload file lên S3: ");
            console.error(err);
          }
        });
      },
      error: (err) => {
        this.message.error("Lỗi lấy Presigned URL ");
        console.error(err);
      }
    });
  }
}

