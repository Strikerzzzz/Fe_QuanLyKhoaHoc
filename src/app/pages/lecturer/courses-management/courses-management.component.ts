import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Client, CreateCourseRequest, UpdateCourseRequest } from '../../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-courses-management',
  imports: [RouterModule, NzTableModule, NzModalModule, NzFormModule, FormsModule, CommonModule,
    NzPopconfirmModule, NzPaginationModule, NzButtonModule, NzInputModule],
  templateUrl: './courses-management.component.html',
  styleUrl: './courses-management.component.scss'
})

export class CoursesManagementComponent {
  courses: any[] = [];

  // Dữ liệu form dùng để tạo mới hoặc cập nhật khóa học  
  courseData: Partial<CreateCourseRequest | UpdateCourseRequest> = {};

  // Lưu tạm id của khóa học cần cập nhật
  selectedCourseId?: number;

  isVisible = false;   // Điều khiển hiển thị modal
  isEditMode = false;  // true: cập nhật, false: tạo mới

  // Các biến phân trang
  currentPage = 1;
  pageSize = 5;
  displayedCourses: any[] = [];

  constructor(private client: Client,
    private message: NzMessageService,
    private router: Router) { }

  ngOnInit(): void {
    this.loadCourses();
  }

  // Lấy danh sách khóa học từ API
  loadCourses(): void {
    this.client.coursesGET().subscribe(
      res => {
        this.courses = res.data || [];
        this.currentPage = 1; // reset trang khi load lại dữ liệu
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
    } else {
      this.selectedCourseId = undefined;
      this.courseData = {};
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
  goToLesson(courseId: number): void {
    this.router.navigate(['/lecturer/lesson', courseId]);
  }
  goToExam(courseId: number): void {
    this.router.navigate(['/lecturer/exam', courseId]);
  }
}

