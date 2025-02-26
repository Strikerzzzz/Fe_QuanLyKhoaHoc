import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Client } from '../../../shared/api-client';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { CommonModule } from '@angular/common';
import { LessonPagedResultResult } from '../../../shared/api-client';
import { NzListModule } from 'ng-zorro-antd/list'; 
import { NzIconModule } from 'ng-zorro-antd/icon';  
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
@Component({
  selector: 'app-course-detail',
  imports: [NzPageHeaderModule,NzSpinModule,NzAlertModule,CommonModule,
    NzListModule, NzIconModule, NzAvatarModule
   ],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss'
})
export class CourseDetailComponent implements OnInit {
  course: any;
  lessons: any[] = [];
  selectedLesson: any = null;

  loading = true;
  error = '';

  constructor(private route: ActivatedRoute, private client: Client) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['courseId']); 
      this.loadCourseDetail(id);
      this.loadLessons(id);
    });
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
        this.lessons =  result?.data?.lessons || [];  
      },
      error: (err) => {
        this.error = 'Lỗi khi tải thông tin khóa học!';
      }
    });
  }
  
  selectLesson(lesson: any) {
    this.selectedLesson = lesson;
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
