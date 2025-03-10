import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Client } from '../../../shared/api-client';
import { CommonModule } from '@angular/common';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { SubmitAssignmentRequest } from '../../../shared/api-client';
import { FormsModule } from '@angular/forms';
import { VideoPlayerComponent } from "../../video-player/video-player.component";

@Component({
  selector: 'app-study',
  imports: [CommonModule, NzMenuModule, NzIconModule, NzLayoutModule, FormsModule, VideoPlayerComponent],
  templateUrl: './study.component.html',
  styleUrl: './study.component.scss'
})
export class StudyComponent implements OnInit {
  courseId: number = 0;
  lessonId: number = 0;
  lessons: any[] = [];
  selectedLesson: any = null;
  lessonProgress: { [lessonId: number]: number } = {};

  lessonContent: { mediaType: string; content: string; mediaUrl?: string }[] = [];

  private hasScrolledToBottom = false;
  private timeSpent = 0;
  private timer: any = null;
  private completionRate: number = 0;
  isCollapsed = false; // ✅ Biến để điều khiển sidebar thu gọn

  assignment: any = null; // Bài tập của bài học
  questions: any[] = []; // Danh sách câu hỏi
  currentAssignment: any = null; //biến để lưu bài tập
  selectedAnswers: { [questionId: number]: number } = {}; // Lưu đáp án đã chọn

  constructor(private route: ActivatedRoute, private client: Client, private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = Number(params['courseId']);
      this.lessonId = params['lessonId'] ? Number(params['lessonId']) : 0;
      this.loadLessons();
    });
  }

  loadLessons(): void {
    this.client.lessonLearn(this.courseId).subscribe({
      next: (result: any) => {
        this.lessons = result?.data || [];

        // Cập nhật tiến trình học từ `IsCompleted`
        this.lessonProgress = {};
        this.lessons.forEach(lesson => {
          this.lessonProgress[lesson.lessonId] = lesson.completed ? 100 : 0;
        });

        if (this.lessons.length > 0) {
          const currentLesson = this.lessons.find(lesson => lesson.lessonId === this.lessonId);
          if (currentLesson) {
            this.selectLesson(currentLesson);
          }
        }
      },
      error: () => {
        console.error('Lỗi khi tải danh sách bài học');
      }
    });
  }

  loadLessonProgress(): void {
    this.client.lessonLearn(this.courseId).subscribe({
      next: (result: any) => {
        if (result && result.data) {

          // Cập nhật trạng thái hoàn thành của từng bài học
          this.lessons = result.data || [];
          this.lessonProgress = {};

          this.lessons.forEach(lesson => {
            this.lessonProgress[lesson.lessonId] = lesson.completed ? 100 : 0;
          });
        } 
      },
      error: (err) => {
        console.error('Lỗi khi lấy tiến trình bài học:', err);
      }
    });
  }

  selectLesson(lesson: any): void {
    this.lessonId = lesson.lessonId;
    this.router.navigate(['/learning', this.courseId, 'study', lesson.lessonId]);
    this.selectedLesson = lesson;
    this.assignment = null;
    this.questions = [];
    this.loadLessonContent(lesson.lessonId);
    this.loadAssignment(lesson.lessonId);
    this.hasScrolledToBottom = false;
    this.timeSpent = 0;
    this.startTimer();
  }

  loadLessonContent(lessonId: number): void {
    this.client.lessonContentsGET(lessonId).subscribe({
      next: (result: any) => {
        this.lessonContent = Array.isArray(result?.data) && result.data.length > 0
          ? result.data.map((item: any) => ({
              lessonContentId: item.lessonContentId,
              lessonId: item.lessonId,
              mediaType: item.mediaType,
              mediaUrl: item.mediaUrl,
              content: item.content
            }))
          : [{ mediaType: 'text', content: 'Nội dung bài học không có sẵn.' }];
      },
      error: () => {
        this.lessonContent = [{ mediaType: 'text', content: 'Lỗi khi tải nội dung bài học.' }];
      }
    });
  }
  

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (!this.selectedLesson) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      this.hasScrolledToBottom = true;
    }
  }

  private startTimer(): void {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeSpent += 1;
      if (this.hasScrolledToBottom && this.timeSpent >= 15) {
        this.completeLesson(this.selectedLesson.lessonId);
      }
    }, 1000);
  }

  completeLesson(lessonId: number): void {
    if (this.lessonProgress[lessonId] === 100) return;

    this.lessonProgress[lessonId] = 100;
    this.lessons.find(lesson => lesson.lessonId === lessonId)!.isCompleted = true;
    this.client.updateLessonProgress(this.courseId, lessonId).subscribe({
      next: () => {
        this.updateCourseProgress(); // Gọi để cập nhật lại thanh tiến trình
      },
      error: (err) => console.error("Lỗi API:", err)
    });

    clearInterval(this.timer);
  }
  private updateCourseProgress(): void {
    this.loadLessonProgress(); 
  }

  get isTestAvailable(): boolean {
    return this.completionRate === 100;
  }
  loadAssignment(lessonId: number): void {
    this.client.lesson(lessonId).subscribe({
      next: (result: any) => {
        console.log("API response:", result);
        this.assignment = result?.data || null;
        if (this.assignment) {
          this.loadQuestions(this.assignment.assignmentId);
        }else {
          this.questions = [];
        }
      },
      error: () => console.error('Lỗi khi tải bài tập')
    });

  }
  loadQuestions(assignmentId: number): void {
    if (!assignmentId) {
      return;
    }
    console.log("🔍 Đang tải câu hỏi cho Assignment ID:", assignmentId);
    this.client.questions(assignmentId).subscribe({
      next: (result: any) => {

        const allQuestions = result?.data || [];

        // Lọc câu hỏi theo từng loại
        const multipleChoiceQuestions = allQuestions
          .filter((q: any) => q.type === 1) // Chỉ lấy câu hỏi trắc nghiệm
          .sort(() => Math.random() - 0.5) // Trộn ngẫu nhiên
          .slice(0, this.assignment.randomMultipleChoiceCount || 5) // Giới hạn số lượng

        const fillInTheBlankQuestions = allQuestions
          .filter((q: any) => q.type === 2); // Hiển thị toàn bộ câu hỏi điền từ

        // Xử lý định dạng câu hỏi
        this.questions = [
          ...multipleChoiceQuestions.map((question: any, index: number) => ({
            id: question.id || index,
            text: question.content || 'Không có nội dung',
            type: 1, // Trắc nghiệm
            correctAnswerIndex: question.correctAnswerIndex, // 🟢 Lấy chỉ số đáp án đúng
            answers: question.choices ? JSON.parse(question.choices).map((choice: string, idx: number) => ({
              id: idx,
              text: choice
            })) : []
          })),
          ...fillInTheBlankQuestions.map((question: any, index: number) => ({
            id: question.id || index + 1000, // Tránh trùng id
            text: question.content || 'Không có nội dung',
            type: 2, // Điền từ
            correctAnswer: question.correctAnswer, // 🟢 Lấy đáp án đúng cho câu điền từ
            userAnswer: '' // Lưu câu trả lời của user
          }))
        ];

        console.log('Danh sách câu hỏi đã xử lý:', this.questions);
      },
      error: (err) => {
        this.questions = [];
      }
    });
  }


  // Người dùng chọn đáp án radio
  onAnswerSelect(questionId: number, answerIndex: number) {
    this.selectedAnswers[questionId] = answerIndex;
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      question.selectedAnswer = answerIndex;
    }
  }


  // Nộp bài
  submitAssignment() {
    if (!this.assignment) {
      return;
    }

    let totalQuestions = this.questions.length;
    let correctAnswers = 0;

    this.questions.forEach((question, index) => {
      console.log(`Câu hỏi ${index + 1}:`, question);
      
      if (question.type === 1) {
        console.log(`- Đáp án đúng: ${question.correctAnswerIndex}`);
        console.log(`- Đáp án đã chọn: ${question.selectedAnswer}`);
    
        if (question.selectedAnswer === question.correctAnswerIndex) {
          correctAnswers++;
        }
      } else if (question.type === 2) {
        console.log(`- Đáp án đúng: ${question.correctAnswer}`);
        console.log(`- Đáp án nhập vào: ${question.userAnswer}`);
    
        if ((question.userAnswer ?? '').trim().toLowerCase() === (question.correctAnswer ?? '').trim().toLowerCase()) {
          correctAnswers++;
        }
      }
    });
    

    // ✅ Tạo instance của SubmitAssignmentRequest và gán giá trị
  const submitRequest = new SubmitAssignmentRequest();
 // const requestWithLessonId = Object.assign({}, submitRequest, { lessonId: this.lessonId });
  submitRequest.score = Math.round((correctAnswers / totalQuestions) * 100);

  console.log("Gửi dữ liệu nộp bài:", submitRequest);
  console.log(`Tổng số câu hỏi: ${totalQuestions}`);
  console.log(`Số câu đúng: ${correctAnswers}`);
  console.log(`Điểm số: ${Math.round((correctAnswers / totalQuestions) * 100)}`);
  
  this.client.submit(this.assignment.assignmentId, submitRequest).subscribe({
    next: (response: any) => {
      this.router.navigate([
        '/learning', this.courseId, 'study', this.lessonId, 'assignmentResult'
      ], { queryParams: { 
        score: submitRequest.score,
        courseId: this.courseId,  // Giữ nguyên courseId khi chuyển trang
        lessonId: this.lessonId   // Giữ nguyên lessonId
         } });
    },  
    error: (err) => {
      alert("Lỗi khi nộp bài, vui lòng thử lại.");
    }
  });
  }

  get isAllLessonsCompleted(): boolean {
    return this.lessons.length > 0 && this.lessons.every(lesson => this.lessonProgress[lesson.lessonId] === 100);
  }
  goToExam(): void {
    this.router.navigate(['learning', this.courseId, 'exam']);

  }
  
}
