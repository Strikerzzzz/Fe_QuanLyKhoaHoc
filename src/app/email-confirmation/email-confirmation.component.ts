import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Client, ConfirmEmailRequest } from '../shared/api-client';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-email-confirmation',
  standalone: true,
  imports: [NzAlertModule],
  templateUrl: './email-confirmation.component.html',
  styleUrls: ['./email-confirmation.component.scss']
})
export class EmailConfirmationComponent implements OnInit {
  message: string = 'Processing email confirmation...';

  constructor(private apiClient: Client, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      const token = decodeURIComponent(params['token']);

      if (!email || !token) {
        this.message = 'Liên kết xác nhận không hợp lệ hoặc đã hết hạn.';
        return;
      }

      const request = new ConfirmEmailRequest();
      request.init({
        email: email,
        token: token
      });

      this.apiClient.confirmEmail(request).subscribe({
        next: (response) => {
          if (response.succeeded) {
            this.message = 'Email đã được xác nhận thành công!';
            setTimeout(() => this.router.navigate(['/']), 5000);
          } else {
            this.message = 'Lỗi xác nhận email: ' + response.errors?.join(', ');
          }
        },
        error: (err) => {
          this.message = 'Không thể xác nhận email. ' + err.errors?.join(', ');
          console.error(err.errors);
        }
      });
    });
  }
}
