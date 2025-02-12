import { Route } from "@angular/router";
import { LecturerComponent } from "./lecturer.component";
import { CoursesManagementComponent } from "./courses-management/courses-management.component";
import { CourseContentComponent } from "./course-content/course-content.component";
import { LessonComponent } from "./course-content/lesson/lesson.component";
import { ExamComponent } from "./course-content/exam/exam.component";
import { LessonAssignmentComponent } from "./course-content/lesson-assignment/lesson-assignment.component";
import { LessonContentComponent } from "./course-content/lesson-content/lesson-content.component";
export const LECTURER_ROUTES: Route[] = [
    {
        path: "",
        component: LecturerComponent,
        children: [
            { path: "", redirectTo: "courses-management", pathMatch: "full" },
            { path: "courses-management", component: CoursesManagementComponent },
            {
                path: "courses-content/:courseId",
                component: CourseContentComponent,
                children: [
                    { path: "", redirectTo: "lesson", pathMatch: "full" },
                    { path: "lesson", component: LessonComponent },
                    { path: "exam", component: ExamComponent },
                    { path: "assignment", component: LessonAssignmentComponent },
                    { path: "content", component: LessonContentComponent }
                ]
            }
        ]
    }
];