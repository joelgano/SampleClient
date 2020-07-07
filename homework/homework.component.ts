import { Component, OnInit, AfterViewInit, ViewChild, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TooltipPosition, MatTabChangeEvent } from '@angular/material';
import { MatDialog, MatSnackBar } from '@angular/material';
import { MatRadioChange } from '@angular/material';
import { Router } from '@angular/router';

import { DateHelper } from '../shared/helpers/date.helper';

import { ContextMenuService } from '../shared/services/context-menu.service';
import { DateTimeService } from '../shared/services/dateTime.service';
import { EventService } from '../shared/services/event.service';
import { HomeworkService } from './homework.service';
import { LessonDeliveryService } from '../lesson-delivery/lesson-delivery.service';
import { PeriodService } from '../shared/services/period.service';
import { ScreenService } from '../shared/services/screen.service';
import { SettingService } from '../shared/services/setting.service';
import { ToolbarService } from '../toolbar/toolbar.service';

import { Homework } from '../shared/model/homework.model';
import { LinkHomeworkResources } from '../shared/model/linkHomeworkResources.model';
import { ResourceFileExtension } from '../shared/model/enums/resourceFileExtension.model';
import { Resource } from '../shared/model/resource.model';

import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ConfirmDialogData } from '../shared/model/confirmDialogData.model';
import { HomeworkTemplateDialogComponent } from '../homework/homework-template-dialog/homework-template-dialog.component';
import { HomeworkAssignDialogComponent } from './homework-assign-dialog/homework-assign-dialog.component';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-homework',
	templateUrl: './homework.component.html',
	styleUrls: ['./homework.component.scss'],
})
export class HomeworkComponent implements OnInit, AfterViewInit {
	public breakpoint: number;
	public hours = [];
	public minutes = [];
	public selectAll = false;
	public showResourceButton = false;

	public AllResources: Array<Resource> = [];
	public HomeworkTemplate: Array<Homework> = [];
	public ResourceForHomework: Array<Resource> = [];

	public DatePickerControl = new FormControl(new Date().toISOString(), this.dateHelper.DatePickerValidator);

	private resourceTypeIcon: string;
	private positionOptions: TooltipPosition[] = ['below'];
	public position = new FormControl(this.positionOptions[0]);

	public MinWidthShowTools = 1200;

	private subscriptions: Array<Subscription> = new Array<Subscription>();

	constructor(
		public contextMenuService: ContextMenuService,
		public dateHelper: DateHelper,
		public dateTimeService: DateTimeService,
		public eventService: EventService,
		public homeworkService: HomeworkService,
		public lessonDeliveryService: LessonDeliveryService,
		public screenService: ScreenService,
		public settingService: SettingService,
		private dialog: MatDialog,
		public periodService: PeriodService,
		private router: Router,
		private snackBar: MatSnackBar,
		private toolbarService: ToolbarService
	) {}

	ngOnInit() {
		this.toolbarService.SetTitle('Homework');
		this.OnScreenResize();

		if (this.periodService.SelectedPeriod === undefined) {
			this.homeworkService.InitialisePeriod();
		} else {
			this.periodService.SetCurrentPeriods();
			this.homeworkService.ChangePeriod(this.periodService.SelectedPeriod);
		}
		this.setTimeHour();
		this.setTimeMinute();

		this.subscriptions.push(this.periodService.SelectedPeriodSubject.subscribe(() => this.homeworkService.ChangePeriod(this.periodService.SelectedPeriod)));
	}

	ngAfterViewInit() {
		setTimeout(() => (this.homeworkService.Loading = false), 1500);
	}

	public async AddHomework() {
		this.eventService.CurrentEvent.lessons.filter(l => {
			this.HomeworkTemplate = l.homeworkTemplates;
		});
		this.homeworkService.Homework = new Homework();
		this.homeworkService.Homework.students = [];
		this.homeworkService.Homework.resources = [];

		if (this.HomeworkTemplate.length > 0) {
			const homeworkDialogRef = this.dialog.open(HomeworkTemplateDialogComponent, {
				width: '70vh',
				height: '45vh',
				data: { templateList: this.HomeworkTemplate, title: 'Homework Template', message: 'There is a Homework Template(s) available for this lesson. Do you want to create a homework from it?' },
			});

			homeworkDialogRef.afterClosed().subscribe(result => {
				if (result !== undefined && result !== '') {
					this.homeworkService.Homework = this.HomeworkTemplate.find(ht => ht.homeworkTemplateId === result);
				} else {
					this.homeworkService.Homework.title = '';
				}
				this.addNewHomework();
			});
		} else {
			this.homeworkService.Homework.title = '';
			this.addNewHomework();
		}
	}

	public AddResourceFiles(file: File) {}

	public AssignHomework(homework) {
		if (this.homeworkService.EditMode) {
			const snackBarRef = this.snackBar.open('You must save the Homework before it can be set', 'Dismiss');
			snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
			return;
		}
		// this.homeworkService.Homework = homework;
		this.OpenHomeworkAssignDialog(homework);
	}

	public CheckLessonDateTime(homework: Homework) {
		if (this.homeworkService.addHomework === false) {
			if (homework !== undefined) {
				if (homework.setDateTime === this.eventService.CurrentEvent.startDateTime) {
					this.homeworkService.setOnLessonDate = true;
				} else {
					this.homeworkService.setOnLessonDate = false;
				}
			}
		}
	}

	public GetResourceForHomework(homeworkId: string) {
		if (homeworkId !== undefined) {
			this.showResourceButton = false;

			this.homeworkService.Homeworks.filter(h => (this.AllResources = h.resources));

			if (this.AllResources !== undefined) {
				if (this.AllResources.length > 0) {
					this.ResourceForHomework = this.AllResources.filter(r => r.homeworkId === homeworkId);

					if (this.ResourceForHomework.length > 0) {
						this.showResourceButton = false;
						this.homeworkService.showSelectAll = false;
						return this.ResourceForHomework;
					} else {
						this.showResourceButton = true;
					}
				}
			}
		} else {
			if (this.AllResources !== undefined) {
				if (this.AllResources.length > 0) {
					this.showResourceButton = true;
					this.homeworkService.showSelectAll = true;
					return this.AllResources;
				} else {
					this.showResourceButton = true;
					this.homeworkService.showSelectAll = false;
				}
			}
		}
	}

	public GetResourceTypeIcon(url: string) {
		const fileExt = url.split('.').pop();

		ResourceFileExtension.image.split(',').forEach(i => {
			if (fileExt === i.split(' ').pop()) {
				this.resourceTypeIcon = 'photo';
			}
		});

		ResourceFileExtension.audio.split(',').forEach(a => {
			if (fileExt === a.split(' ').pop()) {
				this.resourceTypeIcon = 'library_music';
			}
		});

		ResourceFileExtension.video.split(',').forEach(v => {
			if (fileExt === v.split(' ').pop()) {
				this.resourceTypeIcon = 'video_library';
			}
		});

		if (fileExt === ResourceFileExtension.excel || fileExt === ResourceFileExtension.word || fileExt === ResourceFileExtension.powerPoint || fileExt === ResourceFileExtension.text) {
			this.resourceTypeIcon = 'description';
		}

		if (fileExt === ResourceFileExtension.pdf) {
			this.resourceTypeIcon = 'picture_as_pdf';
		}

		if (fileExt === ResourceFileExtension.link) {
			this.resourceTypeIcon = 'web';
		}

		return this.resourceTypeIcon;
	}

	public NavigateToSchedule(): void {
		this.router.navigate(['/scheduling'], { queryParams: {} });
	}

	public NavigateToTimetable(): void {
		this.router.navigate(['/timetable'], { queryParams: {} });
	}

	public OpenConfirmationDialog(homeworkId: string, title: string): void {
		if (homeworkId) {
			const homeworkDialogRef = this.dialog.open(ConfirmDialogComponent, {
				width: '50vh',
				height: '30vh',
				data: new ConfirmDialogData('Delete Homework', `Are you sure you want to remove ${title} homework?`),
			});

			homeworkDialogRef.afterClosed().subscribe(result => {
				if (result === 'Yes') {
					this.RemoveHomework(homeworkId);
				}
			});
		} else {
			this.homeworkService.CancelHomework();
		}
	}

	public OnScreenResize() {
		if (this.screenService.ScreenWidth > 1200) {
			this.breakpoint = this.screenService.ScreenWidth > 1100 ? 6 : 6;
		}

		if (this.screenService.ScreenWidth <= 1200) {
			this.breakpoint = this.screenService.ScreenWidth <= 1200 ? 4 : 6;
		}

		if (this.screenService.ScreenWidth <= 900) {
			this.breakpoint = this.screenService.ScreenWidth <= 900 ? 3 : 6;
		}

		if (this.screenService.ScreenWidth <= 700) {
			this.breakpoint = this.screenService.ScreenWidth <= 700 ? 2 : 6;
		}
	}

	public async RemoveHomework(homeworkId: string) {
		if (homeworkId !== undefined) {
			this.homeworkService.Homework = await this.homeworkService.RemoveHomework(homeworkId);

			if (this.homeworkService.Homework !== null) {
				const index = this.homeworkService.Homeworks.findIndex(h => h.homeworkId === homeworkId);
				if (index !== -1) {
					this.homeworkService.Homeworks.splice(index, 1);
					if (this.homeworkService.Homeworks.length - 1 >= index) {
						this.homeworkService.SelectedHomeworkTabIndex--;
					} else if (index < 0) {
						this.homeworkService.SelectedHomeworkTabIndex++;
					}
					if (this.homeworkService.Homeworks.length === 1) {
						this.homeworkService.CancelHomework();
						this.homeworkService.Homeworks = [];
						this.homeworkService.SelectedHomeworkTabIndex = 0;
					}
				}

				const snackBarRef = this.snackBar.open('Successfully deleted ' + this.homeworkService.Homework.title + ' homework', 'Dismiss');
				snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
			}
		} else {
			this.homeworkService.CancelHomework();
		}
	}

	public async SetForAll(homework: Homework) {
		homework.students = [];

		for (const studentGroup of this.eventService.CurrentEvent.studentGroups) {
			for (const student of studentGroup.students) {
				homework.students.push(student);
			}
		}
		this.homeworkService.Homework = homework;

		this.homeworkService.SaveHomework(homework);
	}

	public SaveAndExit() {
		const homework = this.homeworkService.Homeworks[this.homeworkService.SelectedHomeworkTabIndex];
		if (homework !== undefined) {
			const homeworkDialogRef = this.dialog.open(ConfirmDialogComponent, {
				width: '50vh',
				height: '30vh',
				data: new ConfirmDialogData('Set Students', `Set for all students?`),
			});

			homeworkDialogRef.afterClosed().subscribe(result => {
				if (result === 'Yes') {
					this.SetForAll(homework);
				} else {
					this.OpenHomeworkAssignDialog(homework);
				}
			});
		}

		this.homeworkService.EditMode = false;
	}

	public SwipeLeft() {
		if (this.homeworkService.Homeworks.length <= 0) {
			return;
		}
		if (this.homeworkService.SelectedHomeworkTabIndex < this.homeworkService.Homeworks.length - 2) {
			this.homeworkService.SelectedHomeworkTabIndex++;
		}
		this.homeworkService.SetHomework();
		this.homeworkService.GetHomeworkStatus();
	}

	public SwipeRight() {
		if (this.homeworkService.Homeworks.length <= 0) {
			return;
		}
		if (this.homeworkService.SelectedHomeworkTabIndex > 0) {
			this.homeworkService.SelectedHomeworkTabIndex--;
		}
		this.homeworkService.SetHomework();
		this.homeworkService.GetHomeworkStatus();
	}

	public SelectAllResources() {
		if (this.selectAll === true) {
			this.AllResources.map(r => {
				r.check = true;
			});
		} else {
			this.AllResources.map(r => {
				r.check = false;
			});
		}
	}

	public SelectDueDate(event: MatRadioChange) {
		if (event.value === 'lesson') {
			this.homeworkService.isSelectVisible = true;
			this.homeworkService.isCalendarVisible = false;
		} else {
			this.homeworkService.isCalendarVisible = true;
			this.homeworkService.isSelectVisible = false;
		}
	}

	public SelectResource(checked: boolean, resourceId: string, homeworkId: string) {
		if (checked === false) {
			this.selectAll = false;
		} else {
			if (this.AllResources.every(r => r.check === true)) {
				this.selectAll = true;
			}

			const linkHomeworkResource = new LinkHomeworkResources();
			linkHomeworkResource.homeworkId = homeworkId;
			linkHomeworkResource.resourceId = resourceId;
			this.homeworkService.LinkHomeworkResources.push(linkHomeworkResource);
		}
	}

	public TabSelectionChanged(event: MatTabChangeEvent) {
		this.homeworkService.SelectedHomeworkTabIndex = event.index;
		if (this.homeworkService.Homeworks.length - 1 <= event.index) {
			if (!this.homeworkService.isAddHomework) {
				this.AddHomework();
			}
		}
		this.homeworkService.SetHomework();
		this.homeworkService.GetHomeworkStatus();
		if (this.homeworkService.Homework.homeworkId !== undefined) {
			this.homeworkService.cancel = false;
			this.GetResourceForHomework(this.homeworkService.Homework.homeworkId);
		} else {
			this.homeworkService.cancel = true;
		}

		this.CheckLessonDateTime(this.homeworkService.Homework);
	}

	public ToggleEditMode() {
		this.homeworkService.EditMode = !this.homeworkService.EditMode;

		if (this.homeworkService.EditMode) {
			this.homeworkService.EditModeVisibility = 'visible';
			this.homeworkService.addHomework = true;
			this.homeworkService.isSelectVisible = true;
		} else {
			this.homeworkService.EditModeVisibility = 'hidden';
			this.homeworkService.addHomework = false;
			this.homeworkService.isSelectVisible = false;

			if (this.homeworkService.cancel === true) {
				this.homeworkService.Homeworks.pop();
			}
		}
	}

	public TogglePastHomework() {
		this.settingService.menuContextHomeworkShowPastHomework = !this.settingService.menuContextHomeworkShowPastHomework;
	}

	private addNewHomework() {
		this.homeworkService.Homeworks[this.homeworkService.SelectedHomeworkTabIndex] = this.homeworkService.Homework;
		this.homeworkService.Homework.setDateTime = this.settingService.GetDefaultSetTimeForHomework().toISOString();
		this.homeworkService.Homework.dueDateTime = this.settingService.GetDefaultDueTimeForHomework().toISOString();
		this.homeworkService.EditMode = true;
		this.showResourceButton = true;
		this.homeworkService.addHomework = true;
		this.homeworkService.showSelectAll = false;
		this.homeworkService.cancel = true;
		this.homeworkService.save = false;
		this.homeworkService.setOnLessonDate = true;
		this.homeworkService.isSelectVisible = true;
		this.homeworkService.isCalendarVisible = false;

		if (this.homeworkService.Homeworks !== undefined) {
			if (this.homeworkService.Homeworks.length > 1) {
				this.homeworkService.SelectedHomeworkTabIndex = this.homeworkService.Homeworks.length - 1;
			}
		}

		const eventDate = this.homeworkService.UpcomingEventDates.find(date => new Date(date).toISOString() === this.homeworkService.Homework.dueDateTime);
		if (eventDate) {
			this.homeworkService.Homework.dueDateTime = eventDate;
		} else {
			this.homeworkService.UpcomingEventDates.push(this.homeworkService.Homework.dueDateTime);
		}

		this.homeworkService.isAddHomework = true;
		this.homeworkService.newHomework = true;
		this.homeworkService.Status = 0;
	}

	public OpenHomeworkAssignDialog(homework) {
		const dialogWidth = '50vw';

		const homeworkAssignDialogRef = this.dialog.open(HomeworkAssignDialogComponent, {
			width: dialogWidth,
			data: homework,
		});

		homeworkAssignDialogRef.afterClosed().subscribe(result => {
			if (result !== undefined) {
				this.homeworkService.Homework = this.homeworkService.Homeworks[this.homeworkService.SelectedHomeworkTabIndex];
				this.homeworkService.GetHomeworkStatus();
			}
		});
	}

	public ChangeSetDate($event, homework: Homework) {
		let setDateTime: Date = new Date(homework.setDateTime);
		let eventDateTime: Date = new Date($event);
		setDateTime.setFullYear(eventDateTime.getFullYear());
		setDateTime.setMonth(eventDateTime.getMonth());
		setDateTime.setDate(eventDateTime.getDate());
		homework.setDateTime = setDateTime.toISOString();
	}

	public ChangeSetHour(eventValue, homework: Homework) {
		let hours: number = parseInt(eventValue);
		let setDateTime: Date = new Date(homework.setDateTime);
		setDateTime.setHours(hours);
		homework.setDateTime = setDateTime.toISOString();
	}

	public ChangeSetMin(eventValue, homework: Homework) {
		let minutes: number = parseInt(eventValue);
		let setDateTime: Date = new Date(homework.setDateTime);
		setDateTime.setMinutes(minutes);
		homework.setDateTime = setDateTime.toISOString();
	}

	public ChangeDueDate($event, homework: Homework) {
		let dueDateTime: Date = new Date(homework.dueDateTime);
		let eventDateTime: Date = new Date($event);
		dueDateTime.setFullYear(eventDateTime.getFullYear());
		dueDateTime.setMonth(eventDateTime.getMonth());
		dueDateTime.setDate(eventDateTime.getDate());
		homework.dueDateTime = dueDateTime.toISOString();
	}

	public ChangeDueHour(eventValue, homework: Homework) {
		let hours: number = parseInt(eventValue);
		let dueDateTime: Date = new Date(homework.dueDateTime);
		dueDateTime.setHours(hours);
		homework.dueDateTime = dueDateTime.toISOString();
	}

	public ChangeDueMin(eventValue, homework: Homework) {
		let minutes: number = parseInt(eventValue);
		let dueDateTime: Date = new Date(homework.dueDateTime);
		dueDateTime.setMinutes(minutes);
		homework.dueDateTime = dueDateTime.toISOString();
	}

	private setTimeHour() {
		for (let hour = 0; hour < 24; hour++) {
			this.hours.push(('0' + hour.toString()).slice(-2));
		}
	}

	private setTimeMinute() {
		for (let minute = 0; minute <= 59; minute++) {
			this.minutes.push(('0' + minute.toString()).slice(-2));
		}
	}
}
