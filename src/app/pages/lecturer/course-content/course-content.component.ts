import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { Client } from '../../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Location } from '@angular/common';

@Component({
  selector: 'app-course-content',
  imports: [NzLayoutModule, RouterModule, NzMenuModule, NzIconModule],
  templateUrl: './course-content.component.html',
  styleUrl: './course-content.component.scss'
})
export class CourseContentComponent implements OnInit {
  isCollapsed = false;
  courseTitle: string = '';
  courseId!: number;

  constructor(
    private client: Client,
    private message: NzMessageService,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
  }
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId = Number(params.get('courseId'));
      this.loadCourseInfo();
    });
  }
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
  goBack(): void {
    this.location.back();
  }
}
