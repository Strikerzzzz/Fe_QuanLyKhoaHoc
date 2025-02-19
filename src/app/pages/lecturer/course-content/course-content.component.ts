import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { Client, CreateExamRequest } from '../../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';  
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
@Component({
  selector: 'app-course-content',
  imports: [NzLayoutModule, RouterModule, NzMenuModule, NzIconModule,FormsModule,
    NzModalModule, NzFormModule, NzInputModule, NzButtonModule
  ],
  templateUrl: './course-content.component.html',
  styleUrl: './course-content.component.scss'
})
export class CourseContentComponent implements OnInit {
  isCollapsed = false;
  courseTitle: string = '';
  courseId!: number;
  selectedCourseId?: number;
  exemData: Partial<CreateExamRequest> = {};
  isAssignmentModalVisible = false;
  exam: any[] = [];
  constructor(
    private client: Client,
    private message: NzMessageService,
    private route: ActivatedRoute,
    private router: Router,
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
        this.message.error("Lỗi khi lấy thông tin khóa học!");
        this.courseTitle = 'Không xác định';
      }
    );
  }
  goBack(): void {
    this.location.back();
  }
  goToExam(courseId?: number): void {
    if (!courseId || isNaN(courseId)) {
      this.message.error("Lỗi: Không tìm thấy ID khóa học!");
      return;
    }
  
    this.client.course(courseId).subscribe(
      response => {
        if (response && response.succeeded && response.data) {
          const examId = response.data.examId;
          if (examId) {
            this.router.navigate([`/lecturer/courses-content/${courseId}/exam`, this.courseId]);
          } else {
            this.isAssignmentModalVisible = true;
            this.exemData = { title: '', description: '' };
          }
        } else {
          this.isAssignmentModalVisible = true;
          this.exemData = { title: '', description: '' };
        }
      },
      error => {
        this.isAssignmentModalVisible = true;
        this.exemData = { title: '', description: '' };
      }
    );
  }
  
  handleExamtOk(): void {
    if (!this.exemData.title || !this.exemData.description) {
      this.message.warning("Vui lòng nhập đủ thông tin bài kiểm tra!");
      return;
    }
  
    console.log("🔍 Đang gửi yêu cầu tạo bài kiểm tra:", this.exemData);
  
    const newAssignment = new CreateExamRequest();
    newAssignment.courseId = this.courseId;
    newAssignment.title = this.exemData.title;
    newAssignment.description = this.exemData.description;
  
    this.client.examsPOST(newAssignment).subscribe(
      (response) => {
        this.message.success("Tạo bài kiểm tra thành công!");
        this.isAssignmentModalVisible = false;
      if (response && response.data) {
        this.router.navigate([`/lecturer/courses-content/${this.courseId}/exam`,this.courseId]);
      } else {
        this.message.error("Lỗi: Không tìm thấy ID bài kiểm tra sau khi tạo!");
      }
    },
      (error) => {
        this.message.error("Lỗi khi tạo mới bài kiểm tra!");
      }
    );
  }
  
  
  handleExamCancel(): void {
      this.isAssignmentModalVisible = false;
    }
  
}
