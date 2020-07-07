import { Component, OnInit, Inject } from '@angular/core';
import { EventService } from 'src/app/shared/services/event.service';
import { HomeworkService } from '../homework.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Student } from 'src/app/shared/model/student.model';
import { Homework } from 'src/app/shared/model/homework.model';

@Component({
	selector: 'app-homework-assign-dialog',
	templateUrl: './homework-assign-dialog.component.html',
	styleUrls: ['./homework-assign-dialog.component.scss'],
})
export class HomeworkAssignDialogComponent implements OnInit {
	public homework: Homework = new Homework();
	constructor(
		public eventService: EventService,
		public homeworkService: HomeworkService,
		public dialogRef: MatDialogRef<HomeworkAssignDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: Homework
	) {}

	ngOnInit() {
		if (this.data) {
			this.homework = this.data;
			this.homeworkService.GetStudentHomeworkSelection(this.homework);
		}
	}

	public async AssignHomework() {
		let studentData: Student;
		this.homework.students = [];
		for (const student of this.homeworkService.StudentHomeworkSelection.selected) {
			studentData = this.homeworkService.Students.find(s => s.id === student.studentId);
			this.homework.students.push(studentData);
		}
		this.homeworkService.SaveHomework(this.homework);
	}
}
