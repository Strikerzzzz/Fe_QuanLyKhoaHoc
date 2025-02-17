import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Client, StringResult, AvatarUploadResponse, AvatarUploadResponseResult } from '../shared/api-client';

@Injectable({
    providedIn: 'root'
})
export class AvatarUploadService {
    constructor(private client: Client) { }

    /**
     * Lấy Presigned URL để upload avatar cho khóa học.
     * @param courseId - ID của khóa học.
     * @param fileName - Tên file avatar.
     * @param contentType - MIME type của file.
     * @returns Observable<AvatarUploadResponse> chứa Presigned URL và objectKey.
     */
    public getPresignedUrl(courseId: number, fileName: string, contentType: string): Observable<AvatarUploadResponse> {
        if (courseId == null) {
            throw new Error("Parameter 'courseId' is required.");
        }
        if (!fileName) {
            throw new Error("Parameter 'fileName' is required.");
        }
        if (!contentType) {
            throw new Error("Parameter 'contentType' is required.");
        }

        return this.client.avatarPresignedUrl(courseId, fileName, contentType).pipe(
            map((result: AvatarUploadResponseResult) => {
                if (!result.succeeded && result.errors) {
                    throw new Error("API trả về lỗi: " + result.errors.join(", "));
                }
                if (!result.data) {
                    throw new Error("API không trả về dữ liệu hợp lệ.");
                }
                return AvatarUploadResponse.fromJS(result.data);
            })
        );
    }
}