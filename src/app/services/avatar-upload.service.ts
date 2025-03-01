import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Client, UploadResponse, UploadResponseResult } from '../shared/api-client';

@Injectable({
    providedIn: 'root'
})
export class UploadService {
    constructor(private client: Client) { }

    /**
     * Lấy Presigned URL để upload ảnh (avatar hoặc content).
     * @param courseId - ID của khóa học.
     * @param fileName - Tên file.
     * @param contentType - MIME type của file.
     * @param type - Loại ảnh: "avatar" hoặc "content".
     * @returns Observable<AvatarUploadResponse> chứa Presigned URL và objectKey.
     */
    public getPresignedUrl( fileName: string, contentType: string, type: 'avatar' | 'content'): Observable<UploadResponse> {
        if (!fileName) {
            throw new Error("Parameter 'fileName' is required.");
        }
        if (!contentType) {
            throw new Error("Parameter 'contentType' is required.");
        }

        return this.client.presignedUrl( fileName, contentType, type).pipe(
            map((result: UploadResponseResult) => {
                if (!result.succeeded && result.errors) {
                    throw new Error("API trả về lỗi: " + result.errors.join(", "));
                }
                if (!result.data) {
                    throw new Error("API không trả về dữ liệu hợp lệ.");
                }
                return UploadResponse.fromJS(result.data);
            })
        );
    }
}
