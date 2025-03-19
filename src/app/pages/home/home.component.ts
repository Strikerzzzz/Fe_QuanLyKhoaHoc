import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Client } from '../../shared/api-client';
import { NzCardModule } from 'ng-zorro-antd/card';     // Cho nz-card
import { NzGridModule } from 'ng-zorro-antd/grid';     // Cho nz-row, nz-col
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzGridModule, NzSpinModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('whyChooseUs') whyChooseUs!: ElementRef;
  @ViewChild('featuredCourses') featuredCourses!: ElementRef; // Thêm tham chiếu cho phần 3
  @ViewChild('statsSection') statsSection!: ElementRef;

  isVisible: boolean[] = [false, false, false, false];
  isTitleVisible: boolean = false;

  // Không dùng hiệu ứng, set mặc định là true
  isCoursesTitleVisible: boolean = true;
  isCoursesVisible: boolean[] = [true, true, true, true];

  // Biến cho phần khóa học
  loading: boolean = false;
  courses: any[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 4; // Giới hạn 4 khóa học
  searchOptions: any = {}; // Điều chỉnh tùy theo API của bạn

  constructor(private client: Client, private message: NzMessageService, private router: Router) { }

  ngAfterViewInit() {
    // Observer cho phần 2
    const observerWhy = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.isTitleVisible = true;
          this.isVisible.forEach((_, index) => {
            setTimeout(() => {
              this.isVisible[index] = true;
            }, index * 200);
          });
          observerWhy.unobserve(this.whyChooseUs.nativeElement);
        }
      },
      { threshold: 0.2 }
    );
    observerWhy.observe(this.whyChooseUs.nativeElement);

    const observerFeaturedCourses  = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.2 });
  
    const section = document.querySelector('.featured-courses');
    if (section) observerFeaturedCourses .observe(section);

    // Observer cho phần 4 (Thống Kê)
    const observerStats = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.startCounterAnimation(); // Chạy hiệu ứng đếm số
            observerStats.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    observerStats.observe(this.statsSection.nativeElement);

    this.loadCourses();
  }

  loadCourses(): void {
    this.client.public(this.currentPage, this.pageSize, this.searchOptions).subscribe({
      next: (result) => {
        if (result?.data) {
          this.courses = (result.data.courses || []).slice(0, 4);
          this.totalItems = result.data.totalCount || 0;
          const maxPage = Math.max(Math.ceil(this.totalItems / this.pageSize), 1);
          if (this.currentPage > maxPage) {
            this.currentPage = maxPage;
          }
        }
      },
      error: (err) => {
        console.error('Home API Error:', err);
      }
    });
  }

  goToCourseDetail(id: number): void {
    this.router.navigate(['/learning', id]);
  }

  // Hàm điều hướng đến trang /learning
  goToLearning(): void {
    this.router.navigate(['/learning']);
  }

  // Hàm chạy hiệu ứng đếm số
  startCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    const speed = 500; // Tốc độ đếm (càng nhỏ càng nhanh)

    counters.forEach((counter: any) => {
      const updateCount = () => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText.replace(/[^0-9]/g, '');

        const increment = target / speed;

        if (count < target) {
          counter.innerText = Math.ceil(count + increment).toLocaleString() + '+';
          setTimeout(updateCount, 1);
        } else {
          counter.innerText = target.toLocaleString() + '+';
        }
      };

      updateCount();
    });
  }
}