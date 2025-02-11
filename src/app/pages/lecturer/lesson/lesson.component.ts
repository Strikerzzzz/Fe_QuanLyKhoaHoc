import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client, CreateLessonRequest, UpdateLessonRequest } from '../../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzInputModule } from 'ng-zorro-antd/input';
@Component({
  selector: 'app-lesson',
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,        
    NzButtonModule,         
    NzPopconfirmModule,   
    NzModalModule,
    NzFormModule,
    NzPaginationModule,
    NzInputModule, 
    RouterModule 
  ],
  templateUrl: './lesson.component.html',
  styleUrl: './lesson.component.scss'
})
export class LessonComponent implements OnInit {
  courseTitle: string = ''; // Tên khóa học
  lessons: any[] = [];
  displayedLessons: any[] = [];
  lessonData: Partial<CreateLessonRequest | UpdateLessonRequest> = {};
  selectedLessonId?: number;

  isVisible = false;    // Điều khiển hiển thị modal
  isEditMode = false;   // true: cập nhật, false: tạo mới

  currentPage = 1;
  pageSize = 5;
  courseId!: number; // ID khóa học chứa bài học

  constructor(
    private client: Client,
    private message: NzMessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId = Number(params.get('courseId'));
      this.courseTitle = ''; 
      this.loadCourseInfo();
      this.loadLessons();
    });
  }

  // 📌 Lấy thông tin khóa học theo ID
  loadCourseInfo(): void {
    this.client.coursesGET(this.courseId).subscribe(
      res => {
        if (res.data && typeof res.data === 'string') {
          this.courseTitle = res.data;
        } else {
          this.courseTitle = 'Không xác định';
        }
      },
      err => {
        console.error("Lỗi khi gọi API:", err);
        this.message.error("Lỗi khi lấy thông tin khóa học!");
        this.courseTitle = 'Không xác định';
      }
    );
  }
  
  // Lấy danh sách bài học của khóa học
  loadLessons(): void {
    this.client.course2(this.courseId).subscribe(
      res => {
        this.lessons = res.data || [];
        this.updateDisplayedLessons();
      },
      err => {
        this.message.error("Lỗi khi tải danh sách bài học!");
      }
    );
  }

  // Cập nhật danh sách hiển thị
  updateDisplayedLessons(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.displayedLessons = this.lessons.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(pageIndex: number): void {
    this.currentPage = pageIndex;
    this.updateDisplayedLessons();
  }

  showModal(isEdit: boolean, lesson?: any): void {
    this.isEditMode = isEdit;
    if (isEdit && lesson) {
      this.selectedLessonId = lesson.lessonId; 
      this.lessonData = { ...lesson };
    } else {
      this.selectedLessonId = undefined;
      this.lessonData = {};
    }
    this.isVisible = true;
  }
  

  handleOk(): void {
    this.isEditMode ? this.updateLesson() : this.addLesson();
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  // Thêm bài học
  addLesson(): void {
    (this.lessonData as any).courseId = this.courseId;

    this.client.lessonsPOST(this.lessonData as CreateLessonRequest).subscribe(
      () => {
        this.message.success("Thêm bài học thành công!");
        this.isVisible = false;
        this.loadLessons();
      },
      () => this.message.error("Lỗi khi thêm bài học!")
    );
  }

  // Cập nhật bài học
  updateLesson(): void {
    if (!this.selectedLessonId) {
      console.error("Không xác định được id của bài học để cập nhật:", this.lessonData);
      this.message.error("Không xác định được id của bài học!");
      return;
    }
    (this.lessonData as any).courseId = this.courseId;
    this.client.lessonsPUT(this.selectedLessonId, this.lessonData as UpdateLessonRequest).subscribe(
      () => {
        this.message.success("Cập nhật bài học thành công!");
        this.isVisible = false;
        this.loadLessons();
      },
      err => {
        console.error("Lỗi khi cập nhật bài học:", err);
        this.message.error("Lỗi khi cập nhật bài học!");
      }
    );
  }
  

  // Xóa bài học
  deleteLesson(lesson: any): void {
    const id = lesson.lessonId;
    if (!id) {
      this.message.error("Không xác định được id của bài học!");
      return;
    }
    this.client.lessonsDELETE(id).subscribe(
      () => {
        this.message.success("Xóa bài học thành công!");
        this.loadLessons();
      },
      () => this.message.error("Lỗi khi xóa bài học!")
    );
  }
  


  // Điều hướng
  goToContent(lessonId: number): void {
    this.router.navigate(['/lecturer/lesson-content', lessonId]);
  }

  goToAssignment(lessonId: number): void {
    this.router.navigate(['/lecturer/lesson-assignment', lessonId]);
  }
}
