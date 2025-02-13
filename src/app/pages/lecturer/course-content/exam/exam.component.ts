import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute, } from '@angular/router';
import { Client, CreateCourseRequest, UpdateCourseRequest } from '../../../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

@Component({
  selector: 'app-exam',
  imports: [RouterModule, NzTableModule, NzModalModule, NzFormModule, FormsModule, CommonModule,
    NzPopconfirmModule, NzPaginationModule, NzButtonModule, NzInputModule, NzTabsModule],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.scss'
})
export class ExamComponent implements OnInit {
  // Thông tin bài kiểm tra và khóa học
  examTitle: string = '';
  examDescription: string = '';
  courseTitle: string = '';

  // Danh sách câu hỏi được phân loại theo loại (MC: trắc nghiệm, FIB: điền vào chỗ trống)
  multipleChoiceQuestions: any[] = [];
  fillInBlankQuestions: any[] = [];
  totalQuestions: number = 0;

  // Thuộc tính phân trang
  currentPage: number = 1;
  pageSize: number = 5;

  // Thuộc tính modal cho thêm/sửa câu hỏi
  isQuestionModalVisible: boolean = false;
  isEditingQuestion: boolean = false;
  questionData: any = {}; // Dữ liệu cho câu hỏi (chứa content, type,...)
  selectedQuestionId?: number;

  // Các tham số nhận từ route
  examId!: number;
  courseId!: number;

  constructor(
    private client: Client,
    private message: NzMessageService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.courseId = Number(this.route.parent?.snapshot.paramMap.get('courseId'));
    this.loadExamInfo();
    this.loadCourseInfo();
    this.loadQuestions();
  }
  handleCancel(): void {
    this.isQuestionModalVisible = false;
  }

  handleOk(): void {
    // Nếu cần kiểm tra dữ liệu trước khi đóng
    if (!this.questionData.content) {
      this.message.error("Nội dung câu hỏi không được để trống!");
      return;
    }
    this.isQuestionModalVisible = false;
  }

  // Lấy thông tin bài kiểm tra
  loadExamInfo(): void {
    this.client.course(this.examId).subscribe(
      res => {
        if (res.data) {
          const exam = res.data;
          this.examTitle = exam.title || 'Không xác định';
          this.examDescription = exam.description || '';
        } else {
          this.examTitle = 'Không xác định';
          this.examDescription = '';
        }
      },
      err => {
        console.error('Lỗi khi lấy thông tin bài kiểm tra:', err);
        this.message.error('Lỗi khi lấy thông tin bài kiểm tra!');
      }
    );
  }


  // Lấy thông tin khóa học (sử dụng coursesGET với id)
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


  // Lấy danh sách câu hỏi của bài kiểm tra
  loadQuestions(): void {
    // Giả sử API trả về danh sách câu hỏi qua hàm results2(examId)
    this.client.results2(this.examId).subscribe(
      res => {
        if (res.data && Array.isArray(res.data)) {
          const questions = res.data;
          // Giả sử mỗi câu hỏi có thuộc tính "type" để phân loại
          this.multipleChoiceQuestions = questions.filter(q => q.type === 'MC');
          this.fillInBlankQuestions = questions.filter(q => q.type === 'FIB');
          this.totalQuestions = questions.length;
        }
      },
      err => {
        console.error('Lỗi khi tải danh sách câu hỏi:', err);
        this.message.error('Lỗi khi tải danh sách câu hỏi!');
      }
    );
  }

  // Xử lý phân trang (nếu cần)
  onPageChange(pageIndex: number): void {
    this.currentPage = pageIndex;
  }

  openMCQuestionModal(): void {
    this.isEditingQuestion = false;
    this.questionData = { type: 'MC', content: '' };
    this.isQuestionModalVisible = true;
  }

  openFIBQuestionModal(): void {
    this.isEditingQuestion = false;
    this.questionData = { type: 'FIB', content: '' };
    this.isQuestionModalVisible = true;
  }

  editMCQuestion(question: any): void {
    this.isEditingQuestion = true;
    this.selectedQuestionId = question.id;
    this.questionData = { ...question };
    this.isQuestionModalVisible = true;
  }

  editFIBQuestion(question: any): void {
    this.isEditingQuestion = true;
    this.selectedQuestionId = question.id;
    this.questionData = { ...question };
    this.isQuestionModalVisible = true;
  }

  // Xóa câu hỏi (hiện tại mô phỏng)
  deleteMCQuestion(question: any): void {
    const id = question.id;
    if (!id) {
      this.message.error('Không xác định được id của câu hỏi!');
      return;
    }
    // Gọi API xóa câu hỏi nếu có, hoặc mô phỏng
    this.message.success('Xóa câu hỏi trắc nghiệm thành công!');
    this.loadQuestions();
  }
}
