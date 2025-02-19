import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ExamStateService {
    private examExistsSubject = new BehaviorSubject<boolean>(false);
    examExists$ = this.examExistsSubject.asObservable();

    setExamExists(exists: boolean): void {
        this.examExistsSubject.next(exists);
    }
}
