import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EChartsOption } from 'echarts';
import { AssignmentResultDto, Client } from '../../../../../shared/api-client';
import { NgxEchartsModule } from 'ngx-echarts';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzInputModule } from 'ng-zorro-antd/input';
import { CommonModule } from '@angular/common';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-assignment-rsprogres',
  imports: [NgxEchartsModule,
    NzCardModule,
    NzSpaceModule,
    NzPaginationModule,
    NzInputModule,
    NzTableModule,
    FormsModule,
    NzInputModule,
    NzButtonComponent,
    CommonModule],
  templateUrl: './assignment-rsprogres.component.html',
  styleUrl: './assignment-rsprogres.component.scss'
})
export class AssignmentRsprogresComponent implements OnInit {
  @Input() assignmentId!: number;
  chartOptions: EChartsOption = {};
  assignmentTitle: string | any = "";
  assignmentResults: AssignmentResultDto[] = [];
  totalCount: number = 0;

  loading = false;
  page = 1;
  pageSize = 10;
  studentName: string | undefined;
  sortByScore: boolean | undefined = undefined;

  constructor(private route: ActivatedRoute,
    private client: Client,
    private message: NzMessageService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.assignmentId = Number(params.get('assignmentId'));
      if (this.assignmentId) {
        this.loadChartData();
        this.loadResults();
      }
    });

    this.route.queryParamMap.subscribe(params => {
      this.assignmentTitle = params.get('title');
    });
  }
  loadChartData(): void {
    this.client.scoreLineChart(this.assignmentId).subscribe(
      (data) => {
        if (!data?.data || data.data.length === 0) {
          console.warn("Không có dữ liệu để hiển thị biểu đồ.");
          return;
        }

        // Lọc bỏ giá trị undefined/null
        const categories = data.data
          .map((item) => item?.title)
          .filter((title): title is string => title !== undefined && title !== null);

        const values = data.data
          .map((item) => item?.value)
          .filter((value): value is number => value !== undefined && value !== null);

        if (categories.length !== values.length) {
          console.error("Dữ liệu không hợp lệ: categories và values có độ dài không khớp.");
          return;
        }

        this.chartOptions = {
          title: {
            text: "Biểu đồ phân bố điểm số bài tập    " + this.assignmentTitle,
            left: "center",
            textStyle: {
              fontSize: 18,
              fontWeight: "bold",
              fontFamily: "Arial, sans-serif",
              color: "#333",
            },
          },
          tooltip: { trigger: "axis" },
          grid: { left: "10%", right: "10%", bottom: "15%", containLabel: true },
          xAxis: {
            type: "category",
            data: categories,
            axisLabel: {
              fontSize: 12,
              fontFamily: "Arial, sans-serif",
              color: "#666",
              rotate: 25,
            },
            axisLine: { lineStyle: { color: "#888" } },
          },
          yAxis: {
            type: "value",
            axisLabel: {
              fontSize: 12,
              fontFamily: "Arial, sans-serif",
              color: "#666",
            },
            splitLine: { lineStyle: { type: "dashed", color: "#ddd" } },
          },
          series: [
            {
              type: "line",
              data: values,
              smooth: true,
              symbol: "circle",
              symbolSize: 8,
              lineStyle: { width: 2, color: "#007bff" },
              itemStyle: { color: "#007bff", borderColor: "#fff", borderWidth: 2 },
              emphasis: { itemStyle: { color: "#ff5722" } },
            },
          ],
        };
      },
      (error) => {
        console.error("Lỗi khi tải dữ liệu:", error);
      }
    );
  }
  loadResults(): void {
    this.loading = true;
    this.client.results(this.assignmentId, this.page, this.pageSize, this.studentName, this.sortByScore)
      .subscribe({
        next: (response) => {
          this.assignmentResults = response.data?.results ?? [];
          this.totalCount = response.data?.totalCount ?? 0;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

  search(): void {
    this.page = 1;
    this.loadResults();
  }

  changeSortOrder(): void {
    this.sortByScore = !this.sortByScore;
    this.search();
}

  changePage(page: number): void {
    this.page = page;
    this.loadResults();
  }
}
