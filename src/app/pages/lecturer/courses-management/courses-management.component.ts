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
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-courses-management',
  imports: [RouterModule, NzTableModule, NzModalModule, NzFormModule, FormsModule, CommonModule,
    NzPopconfirmModule, NzPaginationModule, NzButtonModule, NzInputModule, NzSelectModule],
  templateUrl: './courses-management.component.html',
  styleUrl: './courses-management.component.scss'
})

export class CoursesManagementComponent {
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

  constructor(private client: Client,
    private message: NzMessageService,
    private router: Router) { }

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


}

