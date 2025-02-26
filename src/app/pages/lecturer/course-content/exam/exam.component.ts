import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute, } from '@angular/router';
import { Client, MultipleChoiceQuestionImportDto } from '../../../../shared/api-client';
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
import { QuestionType } from '../../../../shared/api-client';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { switchMap } from 'rxjs';
import { ExamStateService } from '../../../../services/exam-state.service';

interface QuestionData {
  question: string;
  choices?: string[];
  correctAnswerIndex?: number | null;
  answerGroupNumber?: number;
}

@Component({
  selector: 'app-exam',
  imports: [RouterModule, NzTableModule, NzModalModule, NzFormModule, FormsModule, CommonModule,
    NzPopconfirmModule, NzPaginationModule, NzButtonModule, NzInputModule, NzTabsModule,
    NzSelectModule],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.scss'
})
export class ExamComponent implements OnInit {
  examTitle: string = '';
  examDescription: string = '';
  courseTitle: string = '';
  randomMultipleChoiceCount: number = 0;

  multipleChoiceQuestions: any[] = [];
  fillInBlankQuestions: any[] = [];
  totalQuestions: number = 0;

  currentPage: number = 1;
  pageSize: number = 5;
  isQuestionModalVisible: boolean = false;
  isEditingQuestion: boolean = false;
  questionData: any = {};
  selectedQuestionId?: number;

  isFillBlankModalVisible: boolean = false;
  question: any = {};

  isEditModalVisible: boolean = false;
  editExamData: any = {};

  examId!: number;
  courseId!: number;

  editingQuestion: any | null = null;
  isEditMode = false;

  rawText: string = `dạng 1
  Câu 1. Nội dung câu hỏi?
  A. Đáp án A
  *B. Đáp án B
  C. Đáp án C
  D. Đáp án D
  
  Câu 2. Nội dung câu hỏi khác?
  A. Lựa chọn A
  *B. Lựa chọn B
  C. Lựa chọn C
  D. Lựa chọn D
  
  dạng 2
  Câu 3. Nội dung câu hỏi mới?
  A. Option A
  *B. Option B
  C. Option C
  D. Option D`;

  parsedQuestions: QuestionData[] = [];

  constructor(
    private client: Client,
    private message: NzMessageService,
    private route: ActivatedRoute,
    private router: Router,
    private examStateService: ExamStateService
  ) {
  }
  ngOnInit(): void {
    this.route.parent?.paramMap
      .pipe(
        switchMap(params => {
          this.courseId = Number(params.get('courseId'));
          return this.client.course(this.courseId);
        })
      )
      .subscribe(
        res => {
          if (res.data) {
            this.examId = res.data.examId;
            this.examTitle = res.data.title;
            this.examDescription = res.data.description;
            this.randomMultipleChoiceCount = res.data.randomMultipleChoiceCount;
            this.loadQuestions();
          } else {
            this.message.error('Không tìm thấy bài kiểm tra!');
          }
        },
        err => {
          this.message.error('Lỗi khi tải dữ liệu bài kiểm tra!');
        }
      );
  }

  // Lấy danh sách câu hỏi của bài kiểm tra
  loadQuestions(): void {
    if (!this.examId) {
      this.message.error("Không thể tải danh sách câu hỏi vì examID không hợp lệ!");
      return;
    }

    this.client.questions3("exam", this.examId, QuestionType._1).subscribe(
      res => {
        if (res.data && Array.isArray(res.data)) {
          this.multipleChoiceQuestions = res.data.map(q => {
            let choiceArray: string[] = [];

            try {
              if (typeof q.choices === "string") {
                // Chuyển đổi dấu ' thành " để tránh lỗi JSON
                let fixedJson = q.choices.replace(/'/g, '"');
                choiceArray = Object.values(JSON.parse(fixedJson));
              } else if (typeof q.choices === "object" && q.choices !== null) {
                choiceArray = Object.values(q.choices);
              }
            } catch (error) {
              choiceArray = []; // Nếu lỗi, gán mảng rỗng để tránh crash
            }

            let correctAnswerText = "Chưa có đáp án đúng";
            if (
              typeof q.correctAnswerIndex === "number" &&
              q.correctAnswerIndex >= 0 &&
              q.correctAnswerIndex < choiceArray.length
            ) {
              correctAnswerText = choiceArray[q.correctAnswerIndex];
            }

            return {
              ...q,
              choices: choiceArray, // Chuyển thành mảng hợp lệ
              correctAnswer: correctAnswerText // Lấy đáp án đúng
            };
          });

        }
      },
    );
    this.client.questions3("exam", this.examId, QuestionType._2).subscribe(
      res => {
        if (res.data && Array.isArray(res.data)) {
          this.fillInBlankQuestions = res.data.map(q => ({
            ...q,
            choices: null,
            correctAnswerIndex: null,
            correctAnswer: q.correctAnswer
          }));

        }
      }
    );

  }
  getAnswerLabel(index: number): string {
    const labels = ["A", "B", "C", "D", "E"];
    return labels[index] || String.fromCharCode(65 + index);
  }

  fixChoices(choices: any): any {
    if (typeof choices === "string") {
      try {
        // Chuyển dấu ' thành " để thành JSON hợp lệ
        return JSON.parse(choices.replace(/'/g, '"'));
      } catch (error) {
        console.error("Lỗi parse JSON từ choices:", choices, error);
        return {}; // Trả về object rỗng nếu có lỗi
      }
    }
    return choices;
  }

  // Thêm đáp án mới vào câu hỏi trắc nghiệm
  addAnswer(): void {
    if (!this.questionData.answers) {
      this.questionData.answers = [];
    }
    this.questionData.answers.push('');
  }

  // Xóa đáp án theo chỉ mục
  removeAnswer(index: number): void {
    if (this.questionData.answers && this.questionData.answers.length > 2) {
      this.questionData.answers.splice(index, 1);
    } else {
      this.message.error('Câu hỏi trắc nghiệm cần có ít nhất 2 đáp án!');
    }
  }

  // nhận diện đúng từng phần tử trong danh sách.
  trackByIndex(index: number, item: any): number {
    return index;
  }

  openMCQuestionModal(): void {
    this.isEditingQuestion = false;
    this.questionData = { type: QuestionType._1, content: '' };
    this.isQuestionModalVisible = true;
  }

  openFIBQuestionModal(): void {
    this.isEditMode = false;
    this.isEditingQuestion = false;
    this.questionData = { type: QuestionType._2, content: '' }; // Điền từ
    this.isFillBlankModalVisible = true;
  }

  addMCQuestion(): void {
    if (!this.questionData.content) {
      this.message.error("Nội dung câu hỏi không được để trống!");
      return;
    }

    if (!this.questionData.answers || this.questionData.answers.length < 2) {
      this.message.error("Câu hỏi trắc nghiệm cần có ít nhất 2 đáp án!");
      return;
    }

    if (this.questionData.correctIndex === undefined || this.questionData.correctIndex < 0 || this.questionData.correctIndex >= this.questionData.answers.length) {
      this.message.error("Vui lòng chọn đáp án đúng hợp lệ!");
      return;
    }

    (this.questionData as any).examId = this.examId;
    this.questionData.type = QuestionType._1;
    this.questionData.choices = JSON.stringify(this.questionData.answers);
    this.questionData.correctAnswerIndex = this.questionData.correctIndex;

    this.client.questionsPOST(this.questionData).subscribe(
      () => {
        this.message.success("Thêm câu hỏi trắc nghiệm thành công!");
        this.isQuestionModalVisible = false;
        this.loadQuestions();
      },
      err => {
        this.message.error("Lỗi khi thêm câu hỏi trắc nghiệm!");
      }
    );

  }
  addFIBQuestion(): void {
    this.questionData.examId = this.examId;
    this.questionData.type = QuestionType._2;
    if (!this.questionData.correctAnswer || this.questionData.correctAnswer.trim() === "") {
      this.message.error("Đáp án đúng không được để trống!");
      return;
    }

    this.client.questionsPOST(this.questionData).subscribe(
      () => {
        this.message.success("Thêm câu hỏi điền từ thành công!");
        this.isFillBlankModalVisible = false;
        this.loadQuestions();
      },
      err => {
        this.message.error("Lỗi khi thêm câu hỏi điền từ!");
      }
    );
  }
  editMCQuestion(question: any): void {
    this.editingQuestion = question;
    this.isEditMode = true;

    this.questionData = {
      content: question.content,
      answers: [...question.choices],
      correctIndex: question.correctAnswerIndex
    };

    this.isQuestionModalVisible = true;
  }

  editFIBQuestion(question: any): void {
    this.isEditMode = true;
    this.isEditingQuestion = true;
    this.questionData = {
      id: question.id,
      content: question.content,
      correctAnswer: question.correctAnswer
    };
    this.isFillBlankModalVisible = true;
  }

  updateMCQuestion(): void {
    if (!this.questionData.id) {
      this.message.error("Không tìm thấy ID câu hỏi!");
      return;
    }

    (this.questionData as any).examId = this.examId;
    this.questionData.type = QuestionType._1;

    if (!this.questionData.answers || this.questionData.answers.length === 0) {
      this.message.error("Danh sách đáp án không được để trống!");
      return;
    }

    this.questionData.choices = JSON.stringify(this.questionData.answers);

    this.client.questionsPUT(this.question.id, this.question).subscribe(
      () => {
        this.message.success("Cập nhật câu hỏi trắc nghiệm thành công!");
        this.isQuestionModalVisible = false;
        this.loadQuestions();
      },
      err => this.message.error("Lỗi khi cập nhật câu hỏi trắc nghiệm!")
    );
  }
  handleEditQuestionOk(): void {
    if (this.editingQuestion) {
      this.editingQuestion.content = this.questionData.content;
      this.editingQuestion.choices = [...this.questionData.answers];
      this.editingQuestion.correctAnswerIndex = this.questionData.correctIndex;
    }

    this.isQuestionModalVisible = false;
    this.isEditMode = false;
    this.editingQuestion = null; // Reset lại sau khi sửa xong
  }
  updateFIBQuestion(): void {
    if (!this.questionData.id) {
      this.message.error("Không tìm thấy ID câu hỏi!");
      return;
    }
    this.questionData.examId = this.examId;
    this.questionData.type = QuestionType._2;

    if (!this.questionData.correctAnswer || this.questionData.correctAnswer.trim() === "") {
      this.message.error("Đáp án không được để trống!");
      return;
    }

    this.client.questionsPUT(this.questionData.id, this.questionData).subscribe(
      (response) => {
        this.message.success("Cập nhật câu hỏi điền từ thành công!");
        this.isFillBlankModalVisible = false;
        this.loadQuestions();
      },
      (err) => {
        this.message.error("Lỗi khi cập nhật câu hỏi điền từ!");
      }
    );
  }

  // Xử lý khi nhấn OK trong modal trắc nghiệm
  handleQuestionOk(): void {
    this.isEditMode ? this.updateMCQuestion() : this.addMCQuestion();
  }
  // Đóng modal
  handleCancel(): void {
    this.isQuestionModalVisible = false;
    this.isFillBlankModalVisible = false;
  }
  // Xử lý khi nhấn OK trong modal điền từ
  handleFillBlankOk(): void {
    this.isEditMode ? this.updateFIBQuestion() : this.addFIBQuestion();
  }
  // Xóa câu hỏi trắc nghiệm
  deleteMCQuestion(question: any): void {
    this.client.questionsDELETE(question.id).subscribe(
      () => {
        this.message.success('Xóa câu hỏi thành công!');
        this.multipleChoiceQuestions = this.multipleChoiceQuestions.filter(q => q.id !== question.id);

        this.loadQuestions();
      },
      err => {
        console.error('Lỗi khi xóa câu hỏi:', err);
        this.message.error('Lỗi khi xóa câu hỏi!');
      }
    );
  }

  // Xóa câu hỏi điền từ
  deleteFIBQuestion(question: any): void {
    this.client.questionsDELETE(question.id).subscribe(
      () => {
        this.message.success('Xóa câu hỏi thành công!');
        this.fillInBlankQuestions = this.fillInBlankQuestions.filter(q => q.id !== question.id);
        this.loadQuestions();
      },
      err => {
        console.error('Lỗi khi xóa câu hỏi:', err);
        this.message.error('Lỗi khi xóa câu hỏi!');
      }
    );
  }
  editExam(): void {
    this.editExamData = {
      title: this.examTitle,
      description: this.examDescription,
      randomMultipleChoiceCount: this.randomMultipleChoiceCount
    };
    this.isEditModalVisible = true;
  }


  handleEditOk(): void {
    if (!this.examId) {
      this.message.error("Không tìm thấy bài kiểm tra!");
      return;
    }

    this.client.examsPUT(this.examId, this.editExamData).subscribe(
      () => {
        this.message.success("Cập nhật bài kiểm tra thành công!");
        this.examTitle = this.editExamData.title;
        this.examDescription = this.editExamData.description;
        this.randomMultipleChoiceCount = this.editExamData.randomMultipleChoiceCount;
        this.isEditModalVisible = false;
      },
      err => {
        this.message.error("Lỗi khi cập nhật bài kiểm tra!");
      }
    );
  }
  // 🔹 Đóng modal chỉnh sửa
  handleEditCancel(): void {
    this.isEditModalVisible = false;
  }
  deleteExam(): void {
    if (!this.examId) {
      this.message.error("Không tìm thấy bài kiểm tra!");
      return;
    }

    console.error("examid: ", this.examId);
    this.client.examsDELETE(this.examId).subscribe(
      () => {
        this.message.success("Xóa bài kiểm tra thành công!");
        this.examId = 0;
        this.examTitle = "";
        this.examDescription = "";
        this.randomMultipleChoiceCount = 0;
        this.examStateService.setExamExists(false);
        // Điều hướng về trang bài học
        this.router.navigate([`/lecturer/courses-content/${this.courseId}/lesson`]);
      },
      err => {
        this.message.error("Bài kiểm tra đang có nội dung không thể xoá!");
      }
    );
  }

  parseText(): void {
    const lines = this.rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
    let currentGroupNumber: number | null = null;
    let currentQuestion: QuestionData | null = null;
    const questions: QuestionData[] = [];
    let answerLines: string[] = [];
    let collectingAnswers = false;

    const finalizeQuestion = () => {
      if (currentQuestion) {
        let correctAnswerIndex: number | null = null;
        // Xử lý đáp án: loại bỏ dấu '*' nếu có và loại bỏ prefix chữ (A., B., …)
        const choices = answerLines.map((line, index) => {
          let processedLine = line;
          if (processedLine.startsWith('*')) {
            processedLine = processedLine.substring(1).trim();
            correctAnswerIndex = index;
          }
          processedLine = processedLine.replace(/^[A-Z]\.\s*/, '');
          return processedLine;
        });
        currentQuestion.choices = choices;
        currentQuestion.correctAnswerIndex = correctAnswerIndex;
        if (currentGroupNumber !== null) {
          currentQuestion.answerGroupNumber = currentGroupNumber;
        }
        // Loại bỏ prefix "Câu X. " khỏi nội dung câu hỏi
        currentQuestion.question = currentQuestion.question.replace(/^Câu\s+\d+\.\s*/, '');
        questions.push(currentQuestion);
        currentQuestion = null;
        answerLines = [];
        collectingAnswers = false;
      }
    };

    // Duyệt qua từng dòng
    for (const line of lines) {
      if (/^dạng\s+\d+/i.test(line)) {
        // Nếu gặp header nhóm ("dạng X"), hoàn thiện câu hỏi hiện tại và cập nhật nhóm
        finalizeQuestion();
        const match = line.match(/^dạng\s+(\d+)/i);
        if (match) {
          currentGroupNumber = parseInt(match[1], 10);
        }
      } else if (/^câu\s+\d+\./i.test(line)) {
        // Khi gặp dòng bắt đầu câu hỏi ("Câu X. ..."), hoàn thiện câu hỏi trước và tạo mới
        finalizeQuestion();
        currentQuestion = { question: line };
        collectingAnswers = true;
      } else {
        // Các dòng còn lại là đáp án
        if (collectingAnswers && currentQuestion) {
          answerLines.push(line);
        }
      }
    }
    finalizeQuestion();
    this.parsedQuestions = questions;
    console.log("Parsed Questions:", this.parsedQuestions);
  }
  importQuestions(): void {
    if (!this.parsedQuestions.length) {
      this.message.warning('Không có câu hỏi để import.');
      return;
    }
    // Chuyển đổi parsedQuestions sang DTO theo định dạng backend
    const dtos: MultipleChoiceQuestionImportDto[] = this.parsedQuestions.map(q =>
      MultipleChoiceQuestionImportDto.fromJS({
        content: q.question,
        // Sử dụng JSON.stringify để chuyển mảng đáp án thành chuỗi JSON
        choices: q.choices ? JSON.stringify(q.choices) : "[]",
        correctAnswerIndex: q.correctAnswerIndex,
        answerGroupNumber: q.answerGroupNumber,
        assignmentId: null,
        examId: this.examId
      })
    );
    this.client.multipleChoice(dtos).subscribe({
      next: result => {
        this.message.success('Import câu hỏi trắc nghiệm thành công.');
        this.loadQuestions();
      },
      error: error => {
        this.message.error('Import thất bại: ' + error);
      }
    });
  }
}
