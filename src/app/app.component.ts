import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { FooterComponent } from "./shared/components/footer/footer.component";
import { NavbarComponent } from "./shared/components/navbar/navbar.component";
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, NzLayoutModule, NzIconModule, NzMenuModule, FooterComponent, NavbarComponent,
    CommonModule // Thêm CommonModule vào đây
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  showFooter = true; //mặc định hiển thị footer
  constructor() {
    const currentRoute = window.location.pathname;
    //this.showFooter = !['/login', '/register'].includes(currentRoute); // Ẩn footer trên trang đăng nhập/đăng ký
  }
}
