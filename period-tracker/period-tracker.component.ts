import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TooltipPosition } from '@angular/material';
import { MatSnackBar } from '@angular/material';

import { DateTimeService } from '../shared/services/dateTime.service';
import { PeriodService } from '../shared/services/period.service';
import { ScreenService } from '../shared/services/screen.service';
import { UserService } from '../shared/services/user.service';

import { DateHelper } from '../shared/helpers/date.helper';
import { Period } from '../shared/model/period.model';

@Component({
	selector: 'app-period-tracker',
	templateUrl: './period-tracker.component.html',
	styleUrls: ['./period-tracker.component.scss'],
})
export class PeriodTrackerComponent implements OnInit {
	public MinWidthShowBreaks = 515;

	public presentPeriod = false;
	public activePeriod = false;
	public inactivePeriod = false;
	public breakPeriod = false;
	public selectedPeriod = false;
	public unselectedPeriod = false;
	public selectedActivePeriod = false;

	private positionOptions: TooltipPosition[] = ['below'];
	public position = new FormControl(this.positionOptions[0]);

	constructor(
		public dateHelper: DateHelper,
		public dateTimeService: DateTimeService,
		public periodService: PeriodService,
		public screenService: ScreenService,
		private userService: UserService,
		private snackBar: MatSnackBar
	) {}

	ngOnInit() {
		this.GetPeriods();
	}

	public async GetPeriods() {
		if (this.userService.HasActiveSchool()) {
			await this.periodService.GetPeriodsForToday();
		}
	}

	public GetPeriodColors(period: Period) {
		const today = new Date();
		this.presentPeriod = true;
		this.breakPeriod = false;
		this.unselectedPeriod = true;

		if (new Date(period.startDateTime) > today) {
			this.inactivePeriod = true;
		} else {
			this.inactivePeriod = false;
		}

		if (today >= new Date(period.startDateTime) && today <= new Date(period.endDateTime)) {
			this.activePeriod = true;
			if (period.periodName === 'Break') {
				this.breakPeriod = true;
			}
		} else {
			this.activePeriod = false;
		}

		this.GetSelectedPeriodColor(period);
	}

	public async OnClickPeriod(period: Period) {
		if (period.periodName === 'Break') {
			// tslint:disable-next-line:quotemark
			const snackBarRef = this.snackBar.open("You can't select break periods currently.", 'Dismiss');
			snackBarRef.onAction().subscribe(() => snackBarRef.dismiss());
		} else {
			if (!this.dateHelper.ValidateDate(period.startDateTime) || !this.dateHelper.ValidateDate(period.endDateTime)) {
				return;
			}

			this.dateTimeService.SelectedDate = this.dateHelper.GetDateTimeBetweenTwoDates(period.startDateTime, period.endDateTime);
			await this.periodService.SetTeachingPeriods();
			this.periodService.SelectedPeriod = this.periodService.TeachingPeriods.find(p => p.periodId === period.periodId);

			this.periodService.SelectedPeriodSubject.next(period);
		}
	}

	private GetSelectedPeriodColor(period: Period) {
		if (this.periodService.SelectedPeriod !== undefined) {
			if (period.startDateTime === this.periodService.SelectedPeriod.startDateTime) {
				if (this.activePeriod) {
					this.selectedActivePeriod = true;
				} else {
					this.selectedPeriod = true;
					this.selectedActivePeriod = false;
				}
				this.unselectedPeriod = false;
			} else {
				this.selectedPeriod = false;
				this.selectedActivePeriod = false;
				this.unselectedPeriod = true;
			}
		}
	}
}
