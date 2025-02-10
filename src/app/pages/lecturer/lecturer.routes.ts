import { Route } from "@angular/router";
import { LecturerComponent } from "./lecturer.component";
import { CoursesManagementComponent } from "./courses-management/courses-management.component";
import { LessonComponent } from "./lesson/lesson.component";
import { ExamComponent } from "./exam/exam.component";

export const LECTURER_ROUTES: Route[] = [
    {
        path: "",
        component: LecturerComponent,
        children: [
            { path: "", redirectTo: "courses-management", pathMatch: "full" },
            { path: "courses-management", component: CoursesManagementComponent },
            { path: "lesson/:courseId", component: LessonComponent },
            { path: "exam/:courseId", component: ExamComponent }
        ]
    }
];