import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Client, ProgressPagedResult } from '../../../../shared/api-client';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-student-progress',
  standalone: true,
  imports: [
    CommonModule,
    NgxEchartsModule,
    NzSpinModule,
    NzCardModule,
    NzStatisticModule,
    NzDividerModule,
    NzTableModule,
    NzPaginationModule,
    NzButtonModule,
    FormsModule,
    NzProgressModule,
    NzInputModule
  ],
  templateUrl: './student-progress.component.html',
  styleUrls: ['./student-progress.component.scss']
})
export class StudentProgressComponent implements OnInit {
  selectedCourseId!: number;
  pieChartData: { name: string; value: number }[] = [];
  loading = false;
  progresses: any[] = [];
  totalProgresses = 0;
  currentPage = 1;
  pageSize = 10;
  search: string | undefined = undefined;
  sortBy: boolean = false;

  pieChartOptions: any = {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [
      {
        name: 'Tiến độ',
        type: 'pie',
        radius: ['40%', '70%'],
        data: []
      }
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private client: Client,
    private message: NzMessageService
  ) { }

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      this.selectedCourseId = Number(params.get('courseId'));
      if (this.selectedCourseId) {
        this.loadPieChartData(this.selectedCourseId);
        this.loadProgresses();
      }
    });
  }

  loadPieChartData(courseId: number): void {
    this.loading = true;
    this.client.piechart(courseId).subscribe({
      next: (result) => {

        const labels = result.data?.labels ?? [];
        const values = result.data?.values ?? [];

        this.pieChartData = labels.map((label, index) => ({
          name: label,
          value: values[index] ?? 0
        }));

        this.pieChartOptions = {
          tooltip: { trigger: 'item' },
          legend: { top: '5%', left: 'center' },
          series: [
            {
              name: 'Tiến độ',
              type: 'pie',
              radius: ['40%', '70%'],
              label: {
                show: true,
                formatter: '{b}: {c} ({d}%)'
              },
              data: [...this.pieChartData]
            }
          ]
        };

        this.loading = false;
      },
      error: (err) => {
        this.message.error('Không thể tải dữ liệu biểu đồ');
        console.error('Lỗi khi tải biểu đồ tròn:', err);
        this.loading = false;
      }
    });
  }

  loadProgresses(): void {
    this.loading = true;
    this.client.progress(
      this.selectedCourseId,
      this.currentPage,
      this.pageSize,
      this.search,
      this.sortBy
    ).subscribe({
      next: (res) => {
        this.loading = false;

        if (res?.succeeded && res.data) {
          // Ép kiểu dữ liệu trả về thành ProgressPagedResult
          const data = res.data as ProgressPagedResult;
          this.progresses = data.progresses || [];
          this.totalProgresses = data.totalCount || 0;

          const maxPage = Math.max(Math.ceil(this.totalProgresses / this.pageSize), 1);
          if (this.currentPage > maxPage) {
            this.currentPage = maxPage;
            this.loadProgresses();
          }
        } else {
          this.progresses = [];
          this.totalProgresses = 0;
          this.message.error(res?.errors?.join(", ") || "Lỗi khi tải danh sách tiến độ!");
        }
      },
      error: (err) => {
        console.error("API Error:", err);
        this.loading = false;
        this.progresses = [];
        this.totalProgresses = 0;
      }
    });
  }
  getTotalValue(): number {
    return this.pieChartData.reduce((acc, cur) => acc + cur.value, 0);
  }
  onPageIndexChange(page: number): void {
    this.currentPage = page;
    this.loadProgresses();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.loadProgresses();
  }

  toggleSort(): void {
    this.sortBy = !this.sortBy;
    this.loadProgresses();
  }

  onSearch(searchValue: string): void {
    this.search = searchValue;
    this.currentPage = 1;
    this.loadProgresses();
  }
  getProgressColor(completionRate: number): string {
    if (completionRate <= 30) {
      return '#ff4d4f'; // Đỏ khi dưới 30%
    } else if (completionRate <= 70) {
      return '#faad14'; // Vàng khi từ 30% đến 70%
    } else {
      return '#52c41a'; // Xanh khi trên 70%
    }
  }
}
