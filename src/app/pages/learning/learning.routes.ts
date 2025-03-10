import { Routes } from '@angular/router';
import { LearningComponent } from './learning.component';
import { CourseDetailComponent } from './course-detail/course-detail.component';
import { StudyComponent } from './study/study.component';
import { ExamComponent } from './exam/exam.component';
import { AssignmentResultComponent } from './study/assignment-result/assignment-result.component';
export const LEARNING_ROUTES: Routes = [
  { path: '', component: LearningComponent },
  { path: ':courseId', component: CourseDetailComponent },
  { path: ':courseId/study/:lessonId', component: StudyComponent },
  { path: ':courseId/exam', component: ExamComponent },
  {path: ':courseId/study/:lessonId/assignmentResult', component: AssignmentResultComponent}
];
