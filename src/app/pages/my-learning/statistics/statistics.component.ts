import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-statistics',
  imports: [NzPageHeaderModule, NzSpinModule, NzAlertModule, CommonModule,
    NzListModule, NzIconModule, NzAvatarModule, RouterModule, ReactiveFormsModule, NzProgressModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements OnInit, AfterViewChecked {
  @ViewChild('certificateCanvas', { static: false }) certificateCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('certificateContainer', { static: false }) certificateContainer!: ElementRef;
  course: any;
  courseId: number = 0;
  lessons: any[] = [];
  selectedLesson: any = null;

  loading = true;
  error = '';

  testName: string | null = null;
  testScore: number | null = null;
  studentName: string = '';
  currentDate: string = '';

  studentEmail: string = '';

  private isPatternDrawn = false; // Biến để tránh vẽ lại nhiều lần

  constructor(private router: Router, private route: ActivatedRoute, private client: Client, private authService: AuthService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = Number(params['courseId']);
      this.loadCourseDetail(this.courseId);
      this.loadLessons(this.courseId);
      this.loadExam(this.courseId);
      this.loadStudentProgress();
    });
  }
  ngAfterViewInit(): void {
    //this.drawGuillochePattern(); // Vẽ hoa văn sau khi view được khởi tạo
  }
  ngAfterViewChecked(): void {
    if (this.isAllLessonsCompleted() && this.certificateCanvas && !this.isPatternDrawn) {
      this.drawGuillochePattern();
      this.isPatternDrawn = true; // Đánh dấu đã vẽ
    }
  }
  // Hàm vẽ hoa văn Guilloche
  private drawGuillochePattern(): void {
    if (!this.certificateCanvas) return;

    const canvas = this.certificateCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const centerX = canvas.width / 2; // Trung tâm theo chiều ngang
    const centerY = canvas.height / 2; // Trung tâm theo chiều dọc
    const maxRadius = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2; // Bán kính vừa đủ để chạm viền ngoài cùng của canvas
    const step = 10; // Góc bước xoay (độ)

    ctx.strokeStyle = '#daae20'; // Màu vàng nhạt (giữ nguyên)
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.7; // Độ trong suốt (giữ nguyên)

    for (let angle = 0; angle < 360; angle += step) {
      ctx.beginPath();
      for (let i = 0; i <= 360; i += 5) {
        const rad = (i * Math.PI) / 180;
        // Điều chỉnh bán kính để các đường cong vừa chạm viền ngoài
        const r = maxRadius * (0.5 + 0.5 * Math.sin(5 * rad)); // Bắt đầu từ 50% bán kính, mở rộng ra ngoài
        const x = centerX + r * Math.cos(rad + (angle * Math.PI) / 180);
        const y = centerY + r * Math.sin(rad + (angle * Math.PI) / 180);

        // Chỉ vẽ nếu bán kính đủ lớn (loại bỏ phần trung tâm)
        if (r > maxRadius * 0.4) { // Bắt đầu vẽ từ 50% bán kính trở ra ngoài
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
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

  // Trong StatisticsComponent class
  isAllLessonsCompleted(): boolean {
    if (!this.lessons || this.lessons.length === 0) {
      return false;
    }
    return this.lessons.every(lesson => lesson.isCompleted);
  }
  loadStudentProgress() {
    this.client.myProgress(this.courseId).pipe(
      catchError(error => {
        console.error("Lỗi khi gọi API:", error);
        return of(null);
      })
    ).subscribe(response => {
      if (response?.data) {
        const progress: any = response.data; // Không cần khai báo interface

        this.studentName = progress.studentName ?? progress.studentUserName ?? progress.studentEmail ?? "Không có thông tin";
        this.studentEmail = progress.studentEmail ?? "Không có email"; // Lấy email

        // Dùng updatedAt làm ngày cấp chứng chỉ
        this.currentDate = this.formatDate(progress.updatedAt);
      } else {
        console.error("Dữ liệu từ API không hợp lệ:", response);
      }
    });
  }
  // Chuyển đổi ngày từ API sang định dạng "Hà Nội, dd/MM/yyyy"
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `Hà Nội, ${day}/${month}/${year}`;
  }

  // Hàm tải xuống chứng chỉ dưới dạng hình ảnh
  downloadCertificate() {
    if (!this.certificateContainer) return;

    const certificateElement = this.certificateContainer.nativeElement;

    html2canvas(certificateElement, { scale: 2, backgroundColor: null }).then((canvas) => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `ChungChi_${this.course.title}_${this.studentName}.png`;
      link.click();
    });
  }

}
