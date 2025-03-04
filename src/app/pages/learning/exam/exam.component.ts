import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Client } from '../../../shared/api-client';
import { FormsModule } from '@angular/forms';
import { SubmitExamRequest } from '../../../shared/api-client';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exam',
  imports: [FormsModule, CommonModule],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.scss'
})
export class ExamComponent implements OnInit {
  courseId: number = 0;
  exam: any = null;
  lessons: any[] = [];
  questions: any[] = [];
  selectedAnswers: { [questionId: number]: number } = {}; // Lưu đáp án đã chọn

  constructor(private route: ActivatedRoute, private client: Client, private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = Number(params['courseId']);
      this.loadExam(this.courseId);
    });
  }


  loadExam(courseId: number): void {
    this.client.course(courseId).subscribe({
      next: (result: any) => {
        this.exam = result?.data || null;
        if (this.exam) {
          this.loadQuestions(this.exam.examId);
        }
      },
      error: () => console.error('Lỗi khi tải bài kiểm tra')
    });
  }


  loadQuestions(examId: number): void {
    if (!examId) return;

    this.client.questions2(examId).subscribe({
      next: (result: any) => {
        this.questions = (result?.data || []).map((question: any, index: number) => ({
          id: question.id || index,
          text: question.content || 'Không có nội dung',
          type: question.type,
          correctAnswerIndex: question.correctAnswerIndex,
          correctAnswer: question.correctAnswer,
          answers: question.type === 1
            ? JSON.parse(question.choices || '[]').map((choice: string, idx: number) => ({ id: idx, text: choice }))
            : [],
          userAnswer: ''
        }));
      },
      error: () => {
        this.questions = [];
        console.error('Lỗi khi tải câu hỏi');
      }
    });
  }


  onAnswerSelect(questionId: number, answerIndex: number): void {
    this.selectedAnswers[questionId] = answerIndex;
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      question.selectedAnswer = answerIndex;
    }
  }

  submitAssignment(): void {
    if (!this.exam) return;

    let totalQuestions = this.questions.length;
    let correctAnswers = this.questions.filter(q => (q.type === 1 && q.selectedAnswer === q.correctAnswerIndex) || (q.type === 2 && q.userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase())).length;

    const submitRequest = new SubmitExamRequest();
    submitRequest.score = Math.round((correctAnswers / totalQuestions) * 100);

    this.client.submit2(this.exam.examId, submitRequest).subscribe({
      next: () => alert(`Nộp bài thành công! Điểm của bạn: ${submitRequest.score}`),
      error: () => alert("Lỗi khi nộp bài, vui lòng thử lại.")
    });
  }
  
}
