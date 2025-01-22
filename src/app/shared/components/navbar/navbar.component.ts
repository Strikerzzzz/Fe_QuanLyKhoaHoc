import { Component } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NzLayoutModule, NzButtonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  openAuthPopup(): void {
  }
  Login(){

  }
  Register(){

  }
}
