import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule], // Import CommonModule cho *ngFor
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent  {
  images: string[] = [
    'assets/images/hinhanh2.jpg',
    'assets/images/course1.png',
    'assets/images/logo.png',
    'assets/images/hinhanh2.jpg',
    'assets/images/course1.png',
  ];

  courses = [
    {
      title: 'Khoá học 1',
      description: 'Mô tả ngắn về khóa học 1',
      image: 'assets/images/course1.png',
      rating: 4.5
    },
    {
      title: 'Khoá học 2',
      description: 'Mô tả ngắn về khóa học 2',
      image: 'assets/images/course1.png',
      rating: 4.8
    },
    {
      title: 'Khoá học 3',
      description: 'Mô tả ngắn về khóa học 3',
      image: 'assets/images/course1.png',
      rating: 4.9
    },
    {
      title: 'Khoá học 4',
      description: 'Mô tả ngắn về khóa học 4',
      image: 'assets/images/course1.png',
      rating: 4.7
    },
    {
      title: 'Khoá học 5',
      description: 'Mô tả ngắn về khóa học 1',
      image: 'assets/images/course1.png',
      rating: 4.5
    },
    {
      title: 'Khoá học 6',
      description: 'Mô tả ngắn về khóa học 2',
      image: 'assets/images/course1.png',
      rating: 4.8
    },
    {
      title: 'Khoá học 7',
      description: 'Mô tả ngắn về khóa học 3',
      image: 'assets/images/course1.png',
      rating: 4.9
    },
    {
      title: 'Khoá học 8',
      description: 'Mô tả ngắn về khóa học 4',
      image: 'assets/images/course1.png',
      rating: 4.7
    },
  ];
  reviews = [
    {
      content: 'Khóa học rất hữu ích, tôi đã học được nhiều kiến thức mới.',
      studentName: 'Nguyễn Văn A',
      logo: 'assets/images/logo1.png',
    },
    {
      content: 'Giảng viên nhiệt tình, dễ hiểu. Rất đáng tham gia.',
      studentName: 'Trần Thị B',
      logo: 'assets/images/logo2.png',
    },
    {
      content: 'Nội dung phong phú, thực hành nhiều. Tôi rất hài lòng.',
      studentName: 'Lê Minh C',
      logo: 'assets/images/logo3.png',
    },
    {
      content: 'Khóa học rất hữu ích, tôi đã học được nhiều kiến thức mới.',
      studentName: 'Nguyễn Văn A',
      logo: 'assets/images/logo1.png',
    },
    {
      content: 'Giảng viên nhiệt tình, dễ hiểu. Rất đáng tham gia.',
      studentName: 'Trần Thị B',
      logo: 'assets/images/logo2.png',
    },
  ];

  currentIndex = 0;
  itemsPerPage = 4; // Số lượng khoá học hiển thị mỗi lần
  next() {
    if (this.currentIndex + this.itemsPerPage < this.courses.length) {
      this.currentIndex += 1;
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
    }
  }

  currentPage = 1;

  get paginatedReviews() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.reviews.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage * this.itemsPerPage < this.reviews.length) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

}
