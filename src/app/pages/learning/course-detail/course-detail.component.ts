import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Client } from '../../../shared/api-client';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { CommonModule } from '@angular/common';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { AuthService } from '../../../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateProgressRequest } from '../../../shared/api-client';

@Component({
  selector: 'app-course-detail',
  imports: [NzPageHeaderModule, NzSpinModule, NzAlertModule, CommonModule,
    NzListModule, NzIconModule, NzAvatarModule, RouterModule, ReactiveFormsModule
  ],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss'
})
export class CourseDetailComponent implements OnInit {
  course: any;
  courseId: number = 0;
  lessons: any[] = [];
  selectedLesson: any = null;

  loading = true;
  error = '';

  isLoggedIn: boolean = false;
  hasProgress: boolean = false;

  constructor(private router: Router, private route: ActivatedRoute, private client: Client, private authService: AuthService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = Number(params['courseId']);
      this.loadCourseDetail(this.courseId);
      this.loadLessons(this.courseId);
    });
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (this.isLoggedIn) {
        this.checkProgress();
      }
    });
  }
  checkProgress(): void {
    this.client.myProgress(this.courseId).subscribe({
      next: (result) => {
        this.hasProgress = result ? true : false;
      },
      error: () => {
        this.hasProgress = false;
      }
    });
  }

  registerProgress(): void {
    const request = new CreateProgressRequest({ courseId: this.courseId });
  
    this.client.create(request).subscribe({
      next: (response) => {
        console.log('Đăng ký tiến độ học tập thành công', response);
        this.hasProgress = true;
      },
      error: (err) => {
        console.error('Lỗi khi đăng ký tiến độ học tập:', err);
      },
    });
  }
  
  

  goToStudy(): void {
    if (!this.course || !this.course.courseId || !this.lessons || this.lessons.length === 0) {
      console.error("Lỗi: Không thể vào học vì dữ liệu chưa đủ!");
      return;
    }
  
    const firstLessonId = this.lessons[0].lessonId; // Lấy bài học đầu tiên
    this.router.navigate(['/learning', this.course.courseId, 'study', firstLessonId]);
  }
  
  
  openLoginPopup() {
    setTimeout(() => this.authService.showLoginPopup(), 100);
  }

  loadCourseDetail(id: number): void {
    this.loading = true;
    this.client.details(id).subscribe({
      next: (result) => {
        this.course = result.data || {};
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Lỗi khi tải thông tin khóa học!';
        this.loading = false;
      }
    });
  }

  loadLessons(courseId: number): void {
    this.client.course2(courseId, 1, 10).subscribe({
      next: (result: any) => {
        this.lessons = result?.data?.lessons || [];
      },
      error: (err) => {
        this.error = 'Lỗi khi tải thông tin khóa học!';
      }
    });
  }

  selectLesson(lesson: any) {
    this.selectedLesson = lesson;
    this.router.navigate(['/learning', this.courseId, 'study', lesson.lessonId]);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
  get keywordList(): string[] {
    return this.course?.keywords ? this.course.keywords.split(/,\s*/) : [];
  }

}
