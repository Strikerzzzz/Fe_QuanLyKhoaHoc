import { Route } from "@angular/router";
import { LecturerComponent } from "./lecturer.component";

export const LECTURER_ROUTES: Route[] = [
    {
        path: "",
        component: LecturerComponent,
        children: [
            { path: "", redirectTo: "", pathMatch: "full" },
        ]
    }
];