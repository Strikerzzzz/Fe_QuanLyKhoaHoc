import { Component, OnInit } from '@angular/core';
import { Client } from '../../shared/api-client';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { CommonModule } from '@angular/common';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
@Component({
  selector: 'app-learning',
  imports: [NzSpinModule, NzAlertModule, NzCardModule, CommonModule, NzGridModule, NzPageHeaderModule],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.scss'
})
export class LearningComponent implements OnInit {
  courses: any[] = [];
  loading = true;
  error = '';
  constructor(private client: Client) { }
  ngOnInit(): void {
    this.loadCourses();
  }
  loadCourses(): void {
    this.client.public().subscribe({
      next: (result) => {
        this.courses = result.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Lỗi khi tải danh sách khóa học!';
        console.error(err);
        this.loading = false;
      }
    });
  }
}
