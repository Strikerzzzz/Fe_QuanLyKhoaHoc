import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client, CreateLessonRequest, UpdateLessonRequest } from '../../../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
@Component({
  selector: 'app-lesson-content',
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzPopconfirmModule,
    NzModalModule,
    NzFormModule,
    NzPaginationModule,
    NzInputModule,
    RouterModule,
    NzSelectModule,
    NzCheckboxModule
  ],
  templateUrl: './lesson-content.component.html',
  styleUrl: './lesson-content.component.scss'
})
export class LessonContentComponent  implements OnInit{
  lessonContents: any[] = [];
  displayedContents: any[] = [];
  lessonContentData: any = {};
  isVisible = false;
  isEditMode = false;
  currentPage = 1;
  pageSize = 5;
  selectedFormats: string[] = [];
  constructor(private message: NzMessageService) {}

  ngOnInit(): void {
   
  }

  showModal(isEdit: boolean, content?: any): void {
    this.isEditMode = isEdit;
    //this.lessonContentData = isEdit && content ? { ...content } : {};
    this.isVisible = true;
    if (isEdit && content) {
      this.lessonContentData = { ...content };
  
      // Nếu mediaType chứa "image" thì chọn checkbox Ảnh
      this.lessonContentData.isImage = content.mediaType.includes("image");
  
      // Nếu mediaType chứa "video" thì chọn checkbox Video
      this.lessonContentData.isVideo = content.mediaType.includes("video");
    } else {
      this.lessonContentData = { content: '', isImage: false, isVideo: false, mediaUrl: '' };
    }
  }

  handleOk(): void {
    this.isVisible = false;
    // Chuyển đổi checkbox thành chuỗi mediaType
  const selectedTypes = [];
  if (this.lessonContentData.isImage) selectedTypes.push("image");
  if (this.lessonContentData.isVideo) selectedTypes.push("video");

  this.lessonContentData.mediaType = selectedTypes.join(","); // Kết quả: "image,video"

  console.log("Dữ liệu lưu:", this.lessonContentData);
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  deleteContent(content: any): void {
    this.message.success('Xóa nội dung thành công!');
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.lessonContentData.mediaUrl = file.name;
    }
  }
  get paginatedContents() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.lessonContents.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }
}
