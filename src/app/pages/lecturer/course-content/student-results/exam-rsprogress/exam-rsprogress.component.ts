import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Client, ExamResultDto } from '../../../../../shared/api-client';
import { EChartsOption } from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTableModule } from 'ng-zorro-antd/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';

@Component({
  selector: 'app-exam-rsprogress',
  standalone: true,
  imports: [
    NgxEchartsModule,
    NzCardModule,
    NzSpaceModule,
    NzPaginationModule,
    NzTableModule,
    NzInputModule,
    FormsModule,
    NzButtonComponent,
    CommonModule
  ],
  templateUrl: './exam-rsprogress.component.html',
  styleUrl: './exam-rsprogress.component.scss'
})
export class ExamRsprogressComponent implements OnInit {
  @Input() courseId!: number;
  examId!: number;
  chartOptions: EChartsOption = {};
  examResults: ExamResultDto[] = [];
  totalCount: number = 0;
  loading = false;
  page = 1;
  pageSize = 10;
  studentName: string | undefined;
  sortByScore: boolean | undefined = undefined;

  constructor(
    private route: ActivatedRoute,
    private examService: Client,
    private message: NzMessageService
  ) { }

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      this.courseId = Number(params.get('courseId'));
      if (this.courseId) {
        this.loadChartData();
      }
    });
    this.route.paramMap.subscribe(params => {
      this.examId = Number(params.get('examId'));
      if (this.examId) {
        this.loadResults();
      }
    });
  }

  loadChartData(): void {
    this.examService.scoreLineExam(this.courseId).subscribe(
      (data) => {
        if (!data?.data || data.data.length === 0) {
          console.warn('Không có dữ liệu để hiển thị biểu đồ.');
          return;
        }

        const categories = data.data.map(item => item?.title).filter((title): title is string => !!title);
        const values = data.data.map(item => item?.value).filter((value): value is number => value !== undefined && value !== null);

        if (categories.length !== values.length) {
          console.error('Dữ liệu không hợp lệ: categories và values có độ dài không khớp.');
          return;
        }

        this.chartOptions = {
          title: {
            text: 'Biểu đồ phân bố điểm số bài kiểm tra',
            left: 'center',
            textStyle: {
              fontSize: 18,
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif',
              color: '#333',
            },
          },
          tooltip: { trigger: 'axis' },
          grid: { left: '10%', right: '10%', bottom: '15%', containLabel: true },
          xAxis: {
            type: 'category',
            data: categories,
            axisLabel: { fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#666', rotate: 25 },
            axisLine: { lineStyle: { color: '#888' } },
          },
          yAxis: {
            type: 'value',
            axisLabel: { fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#666' },
            splitLine: { lineStyle: { type: 'dashed', color: '#ddd' } },
          },
          series: [
            {
              type: 'line',
              data: values,
              smooth: true,
              symbol: 'circle',
              symbolSize: 8,
              lineStyle: { width: 2, color: '#007bff' },
              itemStyle: { color: '#007bff', borderColor: '#fff', borderWidth: 2 },
              emphasis: { itemStyle: { color: '#ff5722' } },
            },
          ],
        };
      },
      (error) => {
        console.error('Lỗi khi tải dữ liệu:', error);
      }
    );
  }

  loadResults(): void {
    this.loading = true;
    this.examService.results2(this.examId, this.page, this.pageSize, this.studentName, this.sortByScore)
      .subscribe({
        next: (response) => {
          this.examResults = response.data?.results ?? [];
          this.totalCount = response.data?.totalCount ?? 0;
          this.loading = false;
        },
        error: (err) => {
          console.error('Lỗi khi tải danh sách sinh viên:', err);
          this.loading = false;
          this.examResults = [];
          this.totalCount = 0;
        }
      });
  }

  search(): void {
    this.page = 1;
    this.loadResults();
  }

  changeSortOrder(): void {
    this.sortByScore = !this.sortByScore;
    this.page = 1;
    this.loadResults();
  }

  changePage(page: number): void {
    if (this.page !== page) {
      this.page = page;
      this.loadResults();
    }
  }
}
