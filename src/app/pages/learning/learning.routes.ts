import { Routes } from '@angular/router';
import { LearningComponent } from './learning.component';
import { CourseDetailComponent } from './course-detail/course-detail.component';

export const LEARNING_ROUTES: Routes = [
  { path: '', component: LearningComponent },
  { path: ':courseId', component: CourseDetailComponent } 
];
