import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { FooterComponent } from "./shared/components/footer/footer.component";
import { NavbarComponent } from "./shared/components/navbar/navbar.component";
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NzLayoutModule, NzIconModule, NzMenuModule, FooterComponent, NavbarComponent,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  showFooter = true;
  constructor() {
    const currentRoute = window.location.pathname;
    //this.showFooter = !['/login', '/register'].includes(currentRoute); // Ẩn footer trên trang đăng nhập/đăng ký
  }
}
