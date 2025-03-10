import { Component, OnInit } from '@angular/core';
import { Client } from '../../shared/api-client';
import { AuthService } from '../../services/auth.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { CommonModule } from '@angular/common';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError } from 'rxjs/operators';
import { throwError, of, forkJoin } from 'rxjs';
import { NzProgressModule } from 'ng-zorro-antd/progress';
@Component({
  selector: 'app-my-learning',
  imports: [NzSpinModule, NzAlertModule, NzCardModule, CommonModule, NzGridModule, NzPageHeaderModule,
    NzPaginationModule, NzInputModule, NzButtonModule, FormsModule, NzCarouselModule,NzProgressModule],
  templateUrl: './my-learning.component.html',
  styleUrl: './my-learning.component.scss'
})
export class MyLearningComponent implements OnInit {
  ongoingCourses: any[] = [];  // Chỉ hiển thị khóa học có tiến trình
  filteredCourses: any[] = []; // Chứa danh sách hiển thị sau khi tìm kiếm
  loading = true;
  error = '';
  searchOptions = '';

  currentPage = 1;
  pageSize = 8;
  totalItems = 0;

  constructor(private client: Client, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.loadOngoingCourses();
  }

  loadOngoingCourses(): void {
    if (!this.authService.isAuthenticated()) {
      this.loading = false;
      return;
    }
    //Gọi API lấy danh sách khóa học
    this.client.public(1, 50, '').subscribe({
      next: (result) => {
        if (result.data?.courses) {
          const courses = result.data.courses;
          //Gọi API myProgress() cho từng khóa Dùng catchError() để bỏ qua khóa không có tiến trình
          const progressRequests = courses.map(course =>
            this.client.myProgress(course.courseId).pipe(
              catchError((error) => {
                if (error.status === 404) {
                  return of(null);  // Trả về null để tránh chặn các khóa học khác
                }
                return throwError(() => error);
              })
            )
          );
          //forkJoin() chờ tất cả API hoàn tất Lọc chỉ lấy các khóa có tiến trình
          forkJoin(progressRequests).subscribe({
            next: (progressResults) => {
              console.log("📌 Kết quả API myProgress():", progressResults);
          
              this.ongoingCourses = courses
                .map((course, index) => ({
                  ...course,
                  progress: progressResults[index]?.data?.completionRate !== undefined
                  ? Math.round(progressResults[index].data.completionRate) // ✅ Làm tròn %
                  : null
                }))
                .filter(course => course.progress !== null); // Chỉ giữ lại khóa có tiến trình
          
              this.filteredCourses = [...this.ongoingCourses]; 
              this.totalItems = this.filteredCourses.length;
              this.loading = false;
            }
          });
        }
      },
      error: () => {
        this.error = 'Lỗi khi tải danh sách khóa học!';
        this.loading = false;
      }
    });
  }


  searchCourses(): void {
    if (!this.searchOptions.trim()) {
      // Nếu ô tìm kiếm rỗng, reset lại danh sách gốc
      this.filteredCourses = [...this.ongoingCourses];
    } else {
      // Lọc danh sách khóa học theo tiêu chí tìm kiếm
      this.filteredCourses = this.ongoingCourses.filter(course =>
        course.title.toLowerCase().includes(this.searchOptions.toLowerCase())
      );
    }
    this.totalItems = this.filteredCourses.length;
    this.currentPage = 1; // Reset về trang đầu tiên sau khi tìm kiếm
  }

  goToCourseDetail(courseId: number): void {
    this.router.navigate(['/my-learning/statistics', courseId]);
  }

  onPageIndexChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
  }
}
