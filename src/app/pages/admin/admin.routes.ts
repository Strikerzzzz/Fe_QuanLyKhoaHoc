import { Route } from "@angular/router";
import { AdminComponent } from "./admin.component";
import { UserManagementComponent } from "./user-management/user-management.component";
import { SystemStatsComponent } from "./system-stats/system-stats.component";

export const ADMIN_ROUTES: Route[] = [
    {
        path: "",
        component: AdminComponent,
        children: [
            { path: "", redirectTo: "user-management", pathMatch: "full" },
            { path: "user-management", component: UserManagementComponent },
            { path: "system-stats", component: SystemStatsComponent }
        ]
    }
];