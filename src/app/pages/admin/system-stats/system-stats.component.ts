import { Component, OnInit } from '@angular/core';
import { Client } from '../../../shared/api-client';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-system-stats',
  imports: [CommonModule, NgxEchartsModule, FormsModule, NzSelectModule],
  templateUrl: './system-stats.component.html',
  styleUrl: './system-stats.component.scss'
})
export class SystemStatsComponent implements OnInit {

  chartOptions: any;
  selectedPeriod: string = 'days';
  periods = [
    { value: 'days', label: 'Ngày' },
    { value: 'months', label: 'Tháng' },
    { value: 'years', label: 'Năm' }
  ];
  constructor(private userService: Client) { }

  ngOnInit(): void {
    this.loadStatistics(this.selectedPeriod);
  }

  loadStatistics(period: string) {
    this.userService.userStatistics(period).subscribe(response => {
      if (response.succeeded) {
        this.updateChart(response.data, period);
      }
    });
  }
  updateChart(data: any[], period: string) {
    let categories: string[] = [];
    let values: number[] = [];

    if (period === 'days') {
      categories = data.map(d => d.date.split('T')[0]);
      values = data.map(d => d.count);
    } else if (period === 'months') {
      categories = data.map(d => `${d.month}/${d.year}`);
      values = data.map(d => d.count);
    } else if (period === 'years') {
      categories = data.map(d => `${d.year}`);
      values = data.map(d => d.count);
    }

    this.chartOptions = {
      title: {
        text: `Thống kê đăng ký (${this.periods.find(p => p.value === period)?.label})`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          fontSize: 12,
          fontFamily: 'Arial, sans-serif'
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 12,
          fontFamily: 'Arial, sans-serif'
        }
      },
      series: [
        {
          name: 'Số lượng',
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#007bff' // Màu xanh dương
          },
          label: {
            show: true,
            position: 'top',
            fontSize: 12,
            fontFamily: 'Arial, sans-serif'
          }
        }
      ]
    };
  }

  onPeriodChange() {
    this.loadStatistics(this.selectedPeriod);
  }
}
