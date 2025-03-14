import { Component, Input, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { Client, ObjectIEnumerableResult } from '../../../../shared/api-client';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { ActivatedRoute, Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-student-results',
  imports: [CommonModule, NgxEchartsModule, NzTableModule, NzButtonModule],
  templateUrl: './student-results.component.html',
  styleUrl: './student-results.component.scss'
})
export class StudentResultsComponent implements OnInit {
  @Input() courseId!: number;
  chartOptions: EChartsOption = {};
  assignments: any[] = [];
  examId!: number;
  loading: boolean = false;

  constructor(private route: ActivatedRoute,
    private router: Router,
    private examService: Client) { }

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      this.courseId = Number(params.get('courseId'));
      if (this.courseId) {
        this.loadExamId();
        this.loadChartData();
        this.loadAssignments();
      }
    });
  }

  loadExamId(): void {
    this.examService.course(this.courseId).subscribe(
      (res) => {
        if (res?.data?.examId) {
          this.examId = res.data.examId;
        } else {
          console.warn("Không tìm thấy examId.");
        }
      },
      (error) => {
        console.error("Lỗi khi lấy examId:", error);
      }
    );
  }

  loadChartData(): void {
    this.examService.scoreLineExam(this.courseId).subscribe(
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
            text: "Biểu đồ phân bố điểm số bài kiểm tra",
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
  loadAssignments(): void {
    this.loading = true;
    this.examService.listBy(this.courseId).subscribe(
      (result: ObjectIEnumerableResult) => {
        if (result && result.data) {
          this.assignments = result.data;
        } else {
          this.assignments = [];
        }
        this.loading = false;
      },
      (error) => {
        console.error("Lỗi khi tải bài tập:", error);
        this.assignments = [];
        this.loading = false;
      }
    );
  }
  viewAssignment(assignmentId: number, assignmentTitle: string) {
    this.router.navigate(
      [`/lecturer/courses-content/${this.courseId}/results/assignment`, assignmentId],
      { queryParams: { title: assignmentTitle } }
    );
  }


  viewExam(examId: number) {
    if (!examId) {
      console.warn("examId chưa được tải.");
      return;
    }
    this.router.navigate([`/lecturer/courses-content/${this.courseId}/results/exam`, examId]);
  }
}
