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
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { LessonLearnDtoListResult } from '../../../shared/api-client';

@Component({
  selector: 'app-statistics',
  imports: [NzPageHeaderModule, NzSpinModule, NzAlertModule, CommonModule,
    NzListModule, NzIconModule, NzAvatarModule, RouterModule, ReactiveFormsModule, NzProgressModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements OnInit {
  course: any;
  courseId: number = 0;
  lessons: any[] = [];
  selectedLesson: any = null;

  loading = true;
  error = '';

  testName: string | null = null;
  testScore: number | null = null;

  constructor(private router: Router, private route: ActivatedRoute, private client: Client, private authService: AuthService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = Number(params['courseId']);
      this.loadCourseDetail(this.courseId);
      this.loadLessons(this.courseId);
      this.loadExam(this.courseId);
    });
  }

  goToStudy(): void {
    if (!this.course || !this.course.courseId || !this.lessons || this.lessons.length === 0) {
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

    forkJoin({
      course: this.client.details(id), // API lấy chi tiết khóa học
      progress: this.client.myProgress(id).pipe(
        catchError(() => of({ data: { completionRate: 0 } })) // Nếu lỗi, đặt mặc định 0%
      )
    }).subscribe({
      next: ({ course, progress }) => {
        this.course = course.data || {}; // Gán thông tin khóa học
        this.course.progress = Math.round(progress.data?.completionRate || 0); // Gán tiến trình (%)
        this.loading = false;
      },
      error: () => {
        this.error = 'Lỗi khi tải thông tin khóa học!';
        this.loading = false;
      }
    });
  }


  loadLessons(courseId: number): void {
    this.client.learningProgress(courseId).subscribe({
      next: (result: any) => {
        this.lessons = result.data;
      },
      error: () => {
        console.log("Lỗi khi tải dữ liệu!");
      }
    });
  }
  loadExam(courseId: number): void {
    this.client.result(courseId).pipe(
      catchError(() => of({ data: '{}' }))
    ).subscribe({
      next: (testResult) => {
        try {
          let data = typeof testResult.data === 'string' ? JSON.parse(testResult.data) : testResult.data;

          // Kiểm tra nếu data hợp lệ thì gán giá trị
          if (data && typeof data === 'object') {
            this.testName = data.title || ' ';
            this.testScore = data.score ?? null;
          } else {
            console.error("Dữ liệu bài kiểm tra không hợp lệ:", testResult.data);
          }
        } catch (error) {
          console.error("Lỗi khi parse JSON:", error, testResult.data);
        }
      },
      error: () => {
        console.error('Lỗi khi tải thông tin bài kiểm tra!');
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
