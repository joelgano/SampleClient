import { Injectable, ɵConsole } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { MatSnackBar, MatTableDataSource, Sort } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';

import { EventService } from '../shared/services/event.service';
import { HttpService } from '../shared/services/http.service';
import { PeriodService } from '../shared/services/period.service';
import { UserService } from '../shared/services/user.service';

import { Homework } from '../shared/model/homework.model';
import { HomeworkRequest } from '../shared/requests/homework-request.model';
import { HomeworkStatus } from '../shared/model/enums/homeworkStatus.model';
import { Lesson } from '../shared/model/lesson.model';
import { Period } from '../shared/model/period.model';

import { DateHelper } from '../shared/helpers/date.helper';
import { ObjectHelper } from '../shared/helpers/object.helper';
import { ArrayHelper } from '../shared/helpers/array.helper';
import { StudentHomeworkSelection } from '../shared/model/studentHomeworkSelection.model';
import { Student } from '../shared/model/student.model';
import { DateTimeService } from '../shared/services/dateTime.service';
import { LinkHomeworkResources } from '../shared/model/linkHomeworkResources.model';

@Injectable({
	providedIn: 'root',
})
export class HomeworkService {
	private url = 'homework/';
	public Loading = false;

	public addHomework = false;
	public cancel = false;
	public isAddHomework = false;
	public isSelectVisible = true;
	public isCalendarVisible = false;
	public newHomework = false;
	public setOnLessonDate = false;
	public showSelectAll = false;
	public save = false;

	public EditMode = false;
	public EditModeVisibility = 'hidden';

	public Homeworks: Array<Homework> = [];
	public Homework: Homework;

	public LinkHomeworkResources: Array<LinkHomeworkResources> = [];

	public PastHomeworks: Array<Homework> = [];
	public Period: Period;
	public SelectedLesson: Lesson;

	// public setLessonDate: Date;
	// public setLessonTimeHour: number;
	// public setLessonTimeMin: number;
	// public setDueDate: Date;
	// public setDueTimeHour: number;
	// public setDueTimeMin: number;
	// public selectedDueDate: string;

	public SelectedPastHomework?: Homework;
	public SortedData: Array<Homework>;
	public displayedColumns = ['lessonName', 'title', 'setDateTime', 'dueDateTime'];
	public dataSource: MatTableDataSource<Homework> | undefined = undefined;
	public selection = new SelectionModel<Homework>(true, []);

	public StudentHomeworkSelections: Array<StudentHomeworkSelection> = [];
	public StudentHomeworkSelectionSortedData: Array<StudentHomeworkSelection>;
	public StudentHomeworkSelectionDisplayedColumns = ['set', 'forename', 'surname', 'class'];
	public StudentHomeworkSelectionDataSource: MatTableDataSource<StudentHomeworkSelection> | undefined = undefined;
	public StudentHomeworkSelection = new SelectionModel<StudentHomeworkSelection>(true, []);
	public Students: Array<Student> = [];
	public SelectedHomeworkTabIndex = 0;
	public SelectedEvent?: Event;
	public Status: HomeworkStatus;
	public StatusText = 'Not Set';

	public UpcomingEventDates = [];
	private isSelectingPastHomework = false;

	constructor(
		private arrayHelper: ArrayHelper,
		private dateHelper: DateHelper,
		public dateTimeService: DateTimeService,
		private eventService: EventService,
		private httpService: HttpService,
		private userService: UserService,
		private objectHelper: ObjectHelper,
		private periodService: PeriodService,
		private snackBar: MatSnackBar
	) {}

	public async InitialisePeriod(): Promise<void> {
		this.Loading = true;
		await this.GetPeriods();
		await this.periodService.SetCurrentPeriods();
		if (this.periodService.CurrentPeriods.length !== 0) {
			this.periodService.SelectedPeriod = this.periodService.CurrentPeriods.find(p => {
				if (new Date(p.startDateTime) <= new Date() && new Date(p.endDateTime) >= new Date()) {
					return true;
				}
				return false;
			});

			this.periodService.SelectedPeriod = this.periodService.BlankPeriod;
		}
		if (this.periodService.SelectedPeriod === undefined) {
			this.periodService.SelectedPeriod = this.periodService.BlankPeriod;
		}
		this.Loading = false;
	}

	public CancelHomework() {
		const homeworkLastIndex = this.Homeworks.length - 1;
		if (homeworkLastIndex <= 0) {
			this.Homeworks.pop();
		} else {
			const homework = new Homework();
			homework.title = '';
			homework.students = [];
			this.Homeworks[homeworkLastIndex] = homework;
		}

		this.isAddHomework = false;
		this.addHomework = false;
		this.cancel = false;
		this.setOnLessonDate = false;
		this.isSelectVisible = false;
		this.EditMode = false;
		if (homeworkLastIndex === this.SelectedHomeworkTabIndex && this.SelectedHomeworkTabIndex > 0) {
			this.SelectedHomeworkTabIndex--;
		}
	}

	public async ChangePeriod(period: Period): Promise<void> {
		this.CancelHomework();
		this.Loading = true;
		this.newHomework = false;
		this.Period = period;

		if (period !== undefined) {
			if (this.objectHelper.IsEmpty(period)) {
				(period.startDateTime = new Date().toString()), (period.endDateTime = this.dateHelper.AddMinutesToDate(new Date(), 1).toString());
				this.dateTimeService.SelectedDate = new Date();
			}

			if (this.periodService.SelectedPeriod !== this.periodService.BlankPeriod) {
				await this.eventService.GetEventForUserAndDateTime(true, false, this.dateHelper.AddMinutesToDate(new Date(period.startDateTime), 1));
				if (this.eventService.CurrentEvent !== undefined) {
					this.Homeworks = new Array<Homework>();
					this.eventService.CurrentEvent.lessons
						.filter(l => l.homeworks && l.homeworks.length > 0)
						.filter(l => {
							this.Homeworks = l.homeworks;
							this.SelectedLesson = l;
						});

					if (this.Homeworks.length > 0) {
						const homework = new Homework();
						homework.title = '';
						homework.students = [];
						this.Homeworks.push(homework);
					}

					let classId: string;
					this.eventService.CurrentEvent.studentGroups.filter(sg => {
						classId = sg.id;
					});
					await this.eventService.GetUpcomingEventsForEmployeeAndClass(classId, new Date(period.startDateTime));

					if (this.Homeworks.length === 0) {
						const snackBarRef = this.snackBar.open('Lesson has no homework assigned.', 'Dismiss');
						snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
					} else {
						if (this.eventService.CurrentEvent.classId !== undefined) {
							await this.eventService.GetUpcomingEventsForEmployeeAndClass(this.eventService.CurrentEvent.classId, new Date(period.startDateTime));
						}
					}
				}
			}
		}

		if (this.Homeworks.length <= 2) {
			this.SelectedHomeworkTabIndex = 0;
		}

		this.GetPastHomeworks();
		this.getUpcomingEventDate();

		if (!this.isSelectingPastHomework) {
			this.SetHomework();
			this.GetHomeworkStatus();
		}

		this.Loading = false;
	}

	public async CreateHomeworkComponentControl(homework) {
		this.Homeworks.pop();
		this.Loading = true;

		if (this.SetLessonAndDueDateTime(homework)) {
			if (this.LinkHomeworkResources.length > 0) {
				homework.linkHomeworkResources = this.LinkHomeworkResources;
			}

			homework.status = this.Status;
			homework = await this.CreateHomework(homework);

			this.Loading = false;
			this.EditMode = false;
			this.cancel = false;
			this.addHomework = false;
			this.newHomework = false;
			this.setOnLessonDate = false;
			this.isSelectVisible = false;

			if (homework !== undefined) {
				await this.ChangePeriod(this.Period);
				this.SelectedHomeworkTabIndex = this.Homeworks.length > 0 ? this.Homeworks.length - 2 : 0;
			}
		}
	}

	public async CreateHomework(homework: Homework): Promise<Homework> {
		const fullUrl = this.url + 'CreateHomework';
		homework.schoolId = this.userService.ReturnUserSession().activeUserSchool.schoolId;

		let homeWork: Homework = null;
		const body = new HomeworkRequest(
			homework.homeworkId,
			homework.schoolId,
			homework.lessonId,
			homework.title,
			homework.description,
			homework.status,
			homework.dueDateTime,
			homework.setDateTime,
			homework.homeworkTemplateId,
			homework.linkHomeworkResources,
			homework.resources,
			homework.students
		);

		await this.httpService
			.Post<Homework>(fullUrl, body)
			.then(result => {
				homeWork = result;
				this.newHomework = false;

				if (homeWork !== undefined) {
					const snackBarRef = this.snackBar.open('Successfully added ' + homeWork.title + ' homework', 'Dismiss');
					snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
				}
			})
			.catch(error => {
				console.log('Error creating homework');
				const snackBarRef = this.snackBar.open('Error adding homework.', 'Dismiss');
				snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
			});

		return homeWork;
	}

	public async DateChanged(dateString: string): Promise<void> {
		this.Loading = true;
		this.newHomework = false;
		this.Homeworks = new Array<Homework>();
		this.PastHomeworks = [];
		this.dataSource = new MatTableDataSource<Homework>(this.PastHomeworks);

		if (!this.dateHelper.ValidateDate(dateString)) {
			return;
		}
		this.dateTimeService.SelectedDate = new Date(dateString);
		this.SelectedEvent = undefined;
		await this.GetPeriods();
		await this.periodService.SetCurrentPeriods();
		if (this.periodService.TeachingPeriods.length > 0) {
			this.periodService.SelectedPeriod = this.periodService.BlankPeriod;
		} else {
			this.periodService.SelectedPeriod = null;
		}

		this.Loading = false;
	}

	public async GetPeriods(): Promise<void> {
		if (!this.dateTimeService.SelectedDate) {
			return;
		}

		await this.periodService.GetTeachingPeriodsForDay(this.dateTimeService.SelectedDate).then(result => {
			if (!result) {
				this.SelectedEvent = undefined;
				const snackBarRef = this.snackBar.open('No periods found for the selected day', 'Dismiss');
				snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
				console.log('There are no periods today');
			}
		});
	}

	public GetHomeworkDescriptor(lesson: Lesson): string {
		if (!lesson.homeworks) {
			return '(no homework)';
		}
		if (lesson.homeworks.length === 1) {
			return `${lesson.homeworks.length} homework`;
		}
		if (lesson.homeworks.length > 0) {
			return `${lesson.homeworks.length} homeworks`;
		}
		return '(no homework)';
	}

	public GetHomeworkStatus() {
		if (this.Homework !== undefined) {
			const studentHomeworkSelectionCount = this.GetStudentHomeworkSelectionCount();
			const studentHomeworkSelectedCount = this.Homework.students.length;
			const plural = studentHomeworkSelectedCount > 1 ? 's' : '';
			if (studentHomeworkSelectionCount === studentHomeworkSelectedCount) {
				this.StatusText = 'Set for all Students';
			} else if (studentHomeworkSelectedCount === 0) {
				this.StatusText = 'Not Set';
			} else {
				this.StatusText = `Set for ${studentHomeworkSelectedCount} Student` + plural;
			}
		}
	}

	public GetStudentHomeworkSelectionCount(): number {
		let count = 0;
		if (this.eventService.CurrentEvent !== undefined) {
			this.eventService.CurrentEvent.studentGroups.map(function(studentGroup) {
				count += studentGroup.students.length;
			});
		}
		return count;
	}

	public GetStudentHomeworkSelection(homework) {
		this.Students = [];
		this.StudentHomeworkSelections = [];
		const studentHomeworkSelection = [];
		let studentData;

		this.eventService.CurrentEvent.studentGroups.forEach(studentGroup => {
			studentGroup.students.forEach(student => {
				this.Students.push(student);
				studentData = {
					studentId: student.id,
					forename: student.forename,
					surname: student.surname,
					class: studentGroup.groupName,
				};
				this.StudentHomeworkSelections.push(studentData);
				if (homework.students) {
					if (homework.students.filter(s => s.id === student.id).length > 0) {
						studentHomeworkSelection.push(studentData);
					}
				}
			});
		});

		this.StudentHomeworkSelectionDataSource = new MatTableDataSource<StudentHomeworkSelection>(this.StudentHomeworkSelections);
		this.StudentHomeworkSelection = new SelectionModel<StudentHomeworkSelection>(true, studentHomeworkSelection);
	}

	public async GetPastHomeworks(): Promise<Homework[]> {
		this.PastHomeworks = [];
		if (this.eventService.CurrentEvent !== undefined) {
			const fullUrl = this.url + 'GetPastHomework';

			const subjectId = this.eventService.CurrentEvent.subjectId;
			const studentGroupId = this.eventService.CurrentEvent.studentGroups[0].id;
			const httpParams = new HttpParams()
				.set('subjectId', subjectId)
				.set('studentGroupId', studentGroupId)
				.set('schoolId', this.userService.ReturnUserSession().activeUserSchool.schoolId)
				.set('employeeId', this.userService.ReturnUserSession().activeUserSchool.employeeId);

			return new Promise<Homework[]>((resolve, reject) => {
				this.httpService
					.GetWithParams<Homework[]>(fullUrl, httpParams)
					.then(result => {
						if (result != null) {
							this.PastHomeworks = result;
						} else {
							this.PastHomeworks = [];
						}
						this.dataSource = new MatTableDataSource<Homework>(this.PastHomeworks);
						resolve(result);
					})
					.catch(error => {
						this.PastHomeworks = [];
						console.log('There are no events for this user today');
					});
			});
		}
	}

	public IsHomeworkForLesson(lesson: Lesson): boolean {
		if (!lesson.homeworks) {
			return false;
		}
		if (lesson.homeworks.length > 0) {
			return true;
		}
		return false;
	}

	public HasHomeworks(): boolean {
		return this.Homeworks.length > 0;
	}

	public IsSelectedPastHomework(pastHomework): boolean {
		return this.SelectedPastHomework !== undefined ? this.SelectedPastHomework.homeworkId === pastHomework.homeworkId : false;
	}

	public async RemoveHomework(homeworkId: string) {
		const fullUrl = this.url + 'RemoveHomework';

		const httpParams = new HttpParams().set('HomeworkId', homeworkId);

		let homeWork: Homework = null;
		await this.httpService
			.Delete<Homework>(fullUrl, httpParams)
			.then(result => {
				homeWork = result;
			})
			.catch(error => {
				homeWork = null;
				console.log('Error removing homework');
				const snackBarRef = this.snackBar.open('Error deleting homework.', 'Dismiss');
				snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
			});

		return homeWork;
	}

	public SortData(sort: Sort) {
		const data = this.PastHomeworks.slice();
		if (!sort.active || sort.direction === '') {
			this.SortedData = data;
			return;
		}

		this.SortedData = data.sort((a, b) => {
			const isAsc = sort.direction === 'asc';
			switch (sort.active) {
				case 'title':
					return this.arrayHelper.Compare(a.title, b.title, isAsc);
				case 'lessonName':
					return this.arrayHelper.Compare(a.lessonName, b.lessonName, isAsc);
				case 'setDateTime':
					return this.arrayHelper.Compare(a.setDateTime, b.setDateTime, isAsc);
				case 'dueDateTime':
					return this.arrayHelper.Compare(a.dueDateTime, b.dueDateTime, isAsc);
				default:
					return 0;
			}
		});

		this.dataSource = new MatTableDataSource(this.SortedData);
	}

	public StudentHomeworkSelectionIsAllSelected() {
		const numSelected = this.StudentHomeworkSelection.selected.length;
		const numRows = this.StudentHomeworkSelectionDataSource.data.length;
		return numSelected === numRows;
	}

	public StudentHomeworkSelectionMasterToggle() {
		this.StudentHomeworkSelectionIsAllSelected() ? this.StudentHomeworkSelection.clear() : this.StudentHomeworkSelectionDataSource.data.forEach(row => this.StudentHomeworkSelection.select(row));
	}

	public StudentHomeworkSelectionSortData(sort: Sort) {
		const data = this.StudentHomeworkSelections.slice();
		if (!sort.active || sort.direction === '') {
			this.StudentHomeworkSelectionSortedData = data;
			return;
		}

		this.StudentHomeworkSelectionSortedData = data.sort((a, b) => {
			const isAsc = sort.direction === 'asc';
			switch (sort.active) {
				case 'forename':
					return this.arrayHelper.Compare(a.forename, b.forename, isAsc);
				case 'surname':
					return this.arrayHelper.Compare(a.surname, b.surname, isAsc);
				case 'class':
					return this.arrayHelper.Compare(a.class, b.class, isAsc);
				default:
					return 0;
			}
		});

		this.StudentHomeworkSelectionDataSource = new MatTableDataSource(this.StudentHomeworkSelectionSortedData);
	}

	public async SelectPastHomework(selectedPastHomework) {
		this.Loading = true;
		this.isSelectingPastHomework = true;
		this.SelectedPastHomework = selectedPastHomework;

		await this.DateChanged(this.SelectedPastHomework.eventStartDateTime);
		this.periodService.SelectedPeriod = this.periodService.TeachingPeriods.filter(period => period.periodId === this.SelectedPastHomework.periodId)[0];

		await this.ChangePeriod(this.periodService.SelectedPeriod);
		this.SelectedHomeworkTabIndex = this.Homeworks.findIndex(homework => homework.homeworkId === this.SelectedPastHomework.homeworkId);
		this.SetHomework();
		this.GetHomeworkStatus();
		this.Loading = false;
		this.isSelectingPastHomework = false;
	}

	public SetHomework() {
		this.Homework = this.Homeworks[this.SelectedHomeworkTabIndex];
	}

	public SetLessonAndDueDateTime(homework: Homework) {
		let isValid = true;
		let errorMessage = '';

		if (homework.setDateTime === null) {
			isValid = false;
			errorMessage = 'Invalid date format on Lesson Date.';
		} else if (homework.dueDateTime === null) {
			isValid = false;
			errorMessage = 'Invalid date format on Due Date.';
		}

		if (!this.dateHelper.ValidateDate(homework.setDateTime) && !this.dateHelper.ValidateDate(homework.dueDateTime)) {
			isValid = false;
		}

		if (isValid === false) {
			const snackBarRef = this.snackBar.open(errorMessage, 'Dismiss');
			snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
		}

		return isValid;
	}

	public async SaveHomework(homework) {
		if (this.validateHomework(homework)) {
			homework.lesson = this.SelectedLesson;
			homework.lessonId = this.SelectedLesson.lessonId;

			if (homework.homeworkId === null || homework.homeworkId === undefined) {
				await this.CreateHomeworkComponentControl(homework);
				this.EditMode = false;
				this.cancel = false;
				this.save = true;
				this.addHomework = false;
			} else {
				if (this.SetLessonAndDueDateTime(homework)) {
					if (this.Status !== undefined) {
						homework.status = this.Status;
					}

					const SelectedHomeworkTabIndexHolder = this.SelectedHomeworkTabIndex;
					await this.UpdateHomework(homework);
					this.SelectedHomeworkTabIndex = SelectedHomeworkTabIndexHolder;

					if (homework !== null) {
						const snackBarRef = this.snackBar.open('Successfully updated ' + homework.title + ' homework', 'Dismiss');
						snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
					}
				}
			}
		} else {
			this.EditMode = true;
		}
	}

	public async UpdateHomework(homework: Homework): Promise<Homework> {
		const fullUrl = this.url + 'UpdateHomework';
		homework.schoolId = this.userService.ReturnUserSession().activeUserSchool.schoolId;

		let homeWork: Homework = null;
		const body = new HomeworkRequest(
			homework.homeworkId,
			homework.schoolId,
			homework.lessonId,
			homework.title,
			homework.description,
			homework.status,
			homework.dueDateTime,
			homework.setDateTime,
			homework.homeworkTemplateId,
			homework.linkHomeworkResources,
			homework.resources,
			homework.students
		);

		await this.httpService
			.Post<Homework>(fullUrl, body)
			.then(result => {
				homeWork = result;
			})
			.catch(error => {
				console.log('Error updating homework');
				const snackBarRef = this.snackBar.open('Error updating homework.', 'Dismiss');
				snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
			});

		// await this.ChangePeriod(this.Period);
		return homeWork;
	}

	private getUpcomingEventDate() {
		for (const upcomingEvent of this.eventService.UpcomingEvents.slice(0, 10)) {
			if (this.UpcomingEventDates.indexOf(upcomingEvent.startDateTime) <= -1) {
				this.UpcomingEventDates.push(upcomingEvent.startDateTime);
			}
		}
	}

	private validateHomework(homework: Homework): boolean {
		let isValid = true;

		if (homework.title === '') {
			isValid = false;
			const snackBarRef = this.snackBar.open('Please fill in all required fields.', 'Dismiss');
			snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
		}

		if (!this.SelectedLesson) {
			isValid = false;
			const snackBarRef = this.snackBar.open('Please select a lesson', 'Dismiss');
			snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
		}

		return isValid;
	}
}
