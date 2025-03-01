import { Component, OnInit } from '@angular/core';
import { Client } from '../../shared/api-client';
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

@Component({
  selector: 'app-learning',
  imports: [NzSpinModule, NzAlertModule, NzCardModule, CommonModule, NzGridModule, NzPageHeaderModule,
    NzPaginationModule, NzInputModule, NzButtonModule, FormsModule, NzCarouselModule
  ],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.scss'
})
export class LearningComponent implements OnInit {
  courses: any[] = [];
  loading = true;
  error = '';

  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 20;
  searchOptions: string = '';

  images = [
    '../../../../../assets/images/lg1.png',
    '../../../../../assets/images/lg2.png',
    '../../../../../assets/images/lg3.png',
    '../../../../../assets/images/lg4.png',
    '../../../../../assets/images/lg5.png',
    '../../../../../assets/images/lg6.png',
    '../../../../../assets/images/lg7.png',
    '../../../../../assets/images/lg8.png',
  ];

  constructor(private client: Client, private router: Router, private message: NzMessageService) { }
  ngOnInit(): void {
    this.loadCourses();
  }
  loadCourses(): void {
    this.loading = true;
    this.client.public(this.currentPage, this.pageSize, this.searchOptions).subscribe({
      next: (result) => {
        if (result?.data) {
          this.courses = result.data.courses || [];
          this.totalItems = result.data.totalCount || 0;

          // Kiểm tra nếu currentPage vượt quá số trang hợp lệ
          const maxPage = Math.max(Math.ceil(this.totalItems / this.pageSize), 1);
          if (this.currentPage > maxPage) {
            this.currentPage = maxPage;
            this.loadCourses(); // Gọi lại để đảm bảo dữ liệu đúng
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.message.error('Không tìm thấy dữ liệu!');
        console.error(err);
        this.loading = false;
      }
    });
  }

  // Xử lý khi chuyển trang
  onPageIndexChange(page: number): void {
    this.currentPage = page;
    this.loadCourses();
  }

  // Xử lý khi thay đổi số lượng bản ghi trên mỗi trang
  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.currentPage = 1; // Reset về trang đầu khi thay đổi pageSize
    this.loadCourses();
  }

  // Xử lý tìm kiếm khóa học
  searchCourses(): void {
    this.currentPage = 1; // Reset về trang đầu khi tìm kiếm
    this.loadCourses();
  }

  goToCourseDetail(id: number): void {
    this.router.navigate(['/learning', id]);
  }
}
