import { Component, OnInit } from '@angular/core';
import { HomeworkService } from '../homework.service';
import { DateHelper } from 'src/app/shared/helpers/date.helper';

@Component({
	selector: 'app-homework-list',
	templateUrl: './homework-list.component.html',
	styleUrls: ['./homework-list.component.scss'],
})
export class HomeworkListComponent implements OnInit {
	constructor(public homeworkService: HomeworkService, public dateHelper: DateHelper) {}

	ngOnInit() {}
}
