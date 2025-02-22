import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface QuestionData {
  question: string;
  choices: string[];
  correctAnswerIndex: number | null;
}

@Component({
  selector: 'app-question',
  imports: [FormsModule, CommonModule],
  templateUrl: './question.component.html',
  styleUrl: './question.component.scss'
})
export class QuestionComponent {
  // Chuỗi mẫu nhập vào, có định dạng như yêu cầu
  rawText: string = `Câu 1. Nội dung câu hỏi?
  A. Đáp án A
  *B. Đáp án B
  C. Đáp án C
  D. Đáp án D
  
  Câu 2. Nội dung câu hỏi khác?
  A. Lựa chọn A
  *B. Lựa chọn B
  C. Lựa chọn C
  D. Lựa chọn D`;

  parsedQuestions: QuestionData[] = [];

  parseText(): void {
    // Sử dụng regex để tách các block câu hỏi theo từ "Câu" và số thứ tự.
    const regex = /Câu\s+\d+\..*?(?=Câu\s+\d+\.|$)/gs;
    const matches = this.rawText.match(regex);

    if (matches) {
      this.parsedQuestions = matches.map(block => {
        // Tách block thành các dòng, loại bỏ khoảng trắng thừa và dòng rỗng.
        const lines = block.split('\n').map(line => line.trim()).filter(line => line !== '');
        const questionTitle = lines[0];
        let correctAnswerIndex: number | null = null;
        // Xử lý các dòng đáp án: nếu bắt đầu bằng "*" thì đó là đáp án đúng.
        const choices = lines.slice(1).map((line, index) => {
          if (line.startsWith('*')) {
            correctAnswerIndex = index;
            return line.substring(1).trim(); // Loại bỏ dấu "*" khỏi đáp án.
          }
          return line;
        });
        console.log(questionTitle, choices, correctAnswerIndex);
        return { question: questionTitle, choices: choices, correctAnswerIndex: correctAnswerIndex };
      });
    } else {
      this.parsedQuestions = [];
    }
  }
}
