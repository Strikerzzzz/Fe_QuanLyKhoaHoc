import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { ExamStateService } from '../../../services/exam-state.service';

@Component({
  selector: 'app-course-content',
  imports: [NzLayoutModule, RouterModule, NzMenuModule, NzIconModule, FormsModule,
    NzModalModule, NzFormModule, NzInputModule, NzButtonModule, CommonModule
  ],
  templateUrl: './course-content.component.html',
  styleUrl: './course-content.component.scss'
})
export class CourseContentComponent implements OnInit {
  isCollapsed = false;
  courseTitle: string = '';
  courseId!: number;
  examExists: boolean = false;
  selectedCourseId?: number;
  examData: Partial<CreateExamRequest> = {};
  isAssignmentModalVisible = false;
  exam: any[] = [];
  constructor(
    private client: Client,
    private message: NzMessageService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private cdr: ChangeDetectorRef,
    private examStateService: ExamStateService
  ) {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
  }
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId = Number(params.get('courseId'));
      this.loadCourseInfo();
      this.checkExamExists();
    });
    this.examStateService.examExists$.subscribe((exists: boolean) => {
      this.examExists = exists;
      this.cdr.detectChanges();
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

  checkExamExists(): void {
    this.client.course(this.courseId).subscribe(
      (response) => {
        const exists = response && response.succeeded && response.data?.examId ? true : false;
        // Cập nhật trạng thái vào service
        this.examStateService.setExamExists(exists);
        this.cdr.detectChanges();
      },
      (error) => {
        this.examStateService.setExamExists(false);
        this.cdr.detectChanges();
      }
    );
  }

  goBack(): void {
    this.location.back();
  }

  openCreateExamModal(): void {
    this.isAssignmentModalVisible = true;
    this.examData = { title: '', description: '' };
  }



  handleExamtOk(): void {
    if (!this.examData.title || !this.examData.description) {
      this.message.warning("Vui lòng nhập đủ thông tin bài kiểm tra!");
      return;
    }

    const newAssignment = new CreateExamRequest();
    newAssignment.courseId = this.courseId;
    newAssignment.title = this.examData.title;
    newAssignment.description = this.examData.description;

    this.client.examsPOST(newAssignment).subscribe(
      (response) => {
        this.message.success("Tạo bài kiểm tra thành công!");
        this.isAssignmentModalVisible = false;
        this.examExists = true;
        this.examStateService.setExamExists(true);
        this.cdr.detectChanges();
        this.router.navigate([`/lecturer/courses-content/${this.courseId}/exam`]);
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
