import { Routes } from "@angular/router";
import { MyLearningComponent } from "./my-learning.component";
import { StatisticsComponent } from "./statistics/statistics.component";

export const MYLEARNING_ROUTES: Routes = [
    { path: '', component: MyLearningComponent },
    { path: 'statistics/:courseId', component: StatisticsComponent }
];