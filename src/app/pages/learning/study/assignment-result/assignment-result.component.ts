import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Client } from '../../../../shared/api-client';
import { CommonModule } from '@angular/common';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
@Component({
  selector: 'app-assignment-result',
  imports: [CommonModule, NzMenuModule, NzIconModule, NzLayoutModule],
  templateUrl: './assignment-result.component.html',
  styleUrl: './assignment-result.component.scss'
})
export class AssignmentResultComponent implements OnInit{
  score: number = 0;
  lessonId: number = 0;
  courseId: number = 0;
  isCollapsed = false;
  lessons: any[] = [];
  selectedLesson: any = null;
  lessonProgress: { [lessonId: number]: number } = {};

  constructor(private route: ActivatedRoute, private client: Client,private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.score = params['score'] ? Number(params['score']) : 0;
      this.lessonId = Number(params['lessonId']) || 1;
      this.courseId = params['courseId'] ? Number(params['courseId']) : 1;
      this.loadLessons();
    });
  
    this.route.params.subscribe(params => {
      this.lessonId = Number(params['lessonId']) || 1;
    });
    
  }
  
  loadLessons(): void {
    this.client.lessonLearn(this.courseId).subscribe({
      next: (result: any) => {
        this.lessons = result?.data || [];
  
        this.lessonProgress = {};
        this.lessons.forEach(lesson => {
          this.lessonProgress[lesson.lessonId] = lesson.completed ? 100 : 0;
        });
  
        if (!this.selectedLesson || this.selectedLesson.lessonId !== this.lessonId) {
      this.selectedLesson = this.lessons.find(lesson => lesson.lessonId === this.lessonId);
    }
      },
      error: () => {
        console.error('Lỗi khi tải danh sách bài học');
      }
    });
  }
  
  isAssignmentResultPage(): boolean {
    return this.router.url.includes('/assignmentResult');
  }
  
selectLesson(lesson: any): void {
    this.lessonId = lesson.lessonId;
    this.router.navigate(['/learning', this.courseId, 'study', lesson.lessonId]);
    this.selectedLesson = lesson;
  }
  goToPreviousLesson() {
    const currentIndex = this.lessons.findIndex(lesson => lesson.lessonId === this.lessonId);
  
    if (currentIndex > 0) {
      const previousLessonId = this.lessons[currentIndex - 1].lessonId;
      this.router.navigate([`/learning/${this.courseId}/study/${previousLessonId}`], { queryParams: { lessonId: previousLessonId } });
    } 
  }
  
  goToNextLesson() {
    const currentIndex = this.lessons.findIndex(lesson => lesson.lessonId === this.lessonId);
    if (currentIndex < this.lessons.length - 1) {
      const nextLessonId = this.lessons[currentIndex + 1].lessonId;
      this.router.navigate([`/learning/${this.courseId}/study/${nextLessonId}`], {
        queryParams: { lessonId: nextLessonId }
      });
    }
  }
  
  
  
  get isAllLessonsCompleted(): boolean {
    return this.lessons.length > 0 && this.lessons.every(lesson => this.lessonProgress[lesson.lessonId] === 100);
  }
  goToExam(): void {
    this.router.navigate(['learning', this.courseId, 'exam']);

  }
  
}
