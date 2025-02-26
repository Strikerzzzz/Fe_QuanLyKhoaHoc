import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client, ContentDtoIEnumerableResult, CreateLessonContentRequest, FileParameter, UpdateLessonContentRequest } from '../../../../shared/api-client';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';

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
    NzRadioModule
  ],
  templateUrl: './lesson-content.component.html',
  styleUrl: './lesson-content.component.scss'
})
export class LessonContentComponent implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  lessonContents: any[] = [];
  lessonContentData: any = { content: '', mediaUrl: '' };
  mediaOption: 'text' | 'file' = 'text';
  isVisible = false;
  isEditMode = false;
  currentPage = 1;
  pageSize = 5;
  lessonId!: number;
  mediaPreviewUrl: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private message: NzMessageService,
    private route: ActivatedRoute,
    private client: Client
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.lessonId = Number(params.get('lessonId'));
      this.loadLessonContents();
    });
  }

  // Tải danh sách nội dung bài học qua API
  loadLessonContents(): void {
    this.client.lessonContentsGET(this.lessonId).subscribe(
      (res: ContentDtoIEnumerableResult) => {
        if (res.data) {
          this.lessonContents = res.data;
        } else {
          this.lessonContents = [];
        }
      },
      err => {
        this.message.error('Lỗi khi tải danh sách nội dung bài học!');
        console.error(err);
      }
    );
  }

  showModal(isEdit: boolean, content?: any): void {
    this.isEditMode = isEdit;
    this.isVisible = true;

    this.selectedFile = null;
    this.mediaPreviewUrl = null;

    if (isEdit && content) {
      this.lessonContentData = { ...content };

      if (this.lessonContentData.mediaType === 'text') {
        this.mediaOption = 'text';
      } else {
        this.mediaOption = 'file';
        this.mediaPreviewUrl = this.lessonContentData.mediaUrl || null;
      }
    } else {
      this.lessonContentData = { content: '', mediaType: 'text', mediaUrl: '' };
      this.mediaOption = 'text';
    }
  }

  handleOk(): void {
    if (this.mediaOption === 'file') {
      if (this.selectedFile) {
        // Xác định mediaType theo MIME type
        if (this.selectedFile.type.startsWith('image')) {
          this.lessonContentData.mediaType = 'image';
        } else if (this.selectedFile.type.startsWith('video')) {
          this.lessonContentData.mediaType = 'video';
        } else {
          this.lessonContentData.mediaType = 'text';
        }

        // Gọi hàm upload file trước khi lưu
        this.uploadFile();
      } else {
        this.message.warning('Vui lòng chọn file!');
        return;
      }
    } else {
      // Nếu chỉ nhập văn bản
      this.lessonContentData.mediaType = 'text';
      this.lessonContentData.mediaUrl = '';
      this.saveLessonContent();
    }
  }

  handleUploadSuccess(uploadedUrl: string): void {
    this.lessonContentData.mediaUrl = uploadedUrl;
    this.saveLessonContent();
  }

  saveLessonContent(): void {
    if (this.isEditMode) {
      const updateRequest = new UpdateLessonContentRequest();
      updateRequest.lessonContentId = this.lessonContentData.lessonContentId!;
      updateRequest.mediaType = this.lessonContentData.mediaType;
      updateRequest.mediaUrl = this.lessonContentData.mediaUrl;
      updateRequest.content = this.lessonContentData.content;

      this.client.lessonContentsPUT(updateRequest.lessonContentId!, updateRequest).subscribe(
        () => {
          this.message.success('Cập nhật nội dung thành công!');
          this.loadLessonContents();
        },
        err => {
          this.message.error('Lỗi khi cập nhật nội dung!');
        }
      );
    } else {
      const createRequest = new CreateLessonContentRequest();
      createRequest.lessonId = this.lessonId!;
      createRequest.mediaType = this.lessonContentData.mediaType;
      createRequest.mediaUrl = this.lessonContentData.mediaUrl;
      createRequest.content = this.lessonContentData.content;

      this.client.lessonContentsPOST(createRequest).subscribe(
        () => {
          this.message.success('Thêm nội dung thành công!');
          this.loadLessonContents();
        },
        err => {
          this.message.error('Lỗi khi thêm nội dung!');
        }
      );
    }

    this.isVisible = false;
  }


  handleCancel(): void {
    this.isVisible = false;
  }

  // Xóa nội dung bài học qua API
  deleteContent(content: any): void {
    this.client.lessonContentsDELETE(content.lessonContentId).subscribe(
      res => {
        this.message.success("Xóa nội dung thành công!");
        this.loadLessonContents();
      },
      err => {
        this.message.error("Lỗi khi xóa nội dung!");
      }
    );
  }

  // Phân trang: Lấy danh sách nội dung được phân trang
  get paginatedContents() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.lessonContents.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  getMediaTypeLabel(mediaType: string): string {
    switch (mediaType) {
      case 'image':
        return 'Ảnh';
      case 'video':
        return 'Video';
      case 'text':
        return 'Chỉ văn bản';
      default:
        return mediaType;
    }
  }
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Kiểm tra nếu file không phải ảnh hoặc video
      if (!file.type.startsWith('image') && !file.type.startsWith('video')) {
        this.message.error('Vui lòng chọn file ảnh hoặc video!');
        this.selectedFile = null;
        this.mediaPreviewUrl = null;
        return;
      }
      this.selectedFile = file;
      this.mediaPreviewUrl = URL.createObjectURL(file);
    }
  }

  // Xử lý kéo thả file
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      // Kiểm tra nếu file không phải ảnh hoặc video
      if (!file.type.startsWith('image') && !file.type.startsWith('video')) {
        this.message.error('Vui lòng chọn file ảnh hoặc video!');
        this.selectedFile = null;
        this.mediaPreviewUrl = null;
        return;
      }
      this.selectedFile = file;
      this.mediaPreviewUrl = URL.createObjectURL(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  // Kích hoạt input file khi click vào vùng tải file
  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }


  // Kiểm tra xem file đã chọn có phải là ảnh hay không
  isImage(): boolean {
    return this.selectedFile ? this.selectedFile.type.startsWith('image') : false;
  }
  selectMediaOption(option: 'text' | 'file'): void {
    this.mediaOption = option;
    // Nếu chọn text, reset file và preview
    if (option === 'text') {
      this.selectedFile = null;
      this.mediaPreviewUrl = null;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.message.error('Vui lòng chọn file trước khi tải lên!');
      return;
    }

    const fileParam = {
      data: this.selectedFile,
      fileName: this.selectedFile.name
    };

    this.client.upload(fileParam).subscribe(
      res => {
        if (res.succeeded && res.data?.url) {
          this.handleUploadSuccess(res.data.url);
        } else {
          this.message.error('Lỗi khi tải file lên!');
        }
      },
      err => {
        this.message.error('Lỗi khi tải file lên!');
        console.error(err);
      }
    );
  }

}
