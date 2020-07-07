import { Component, OnInit, Inject } from '@angular/core';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-homework-template-dialog',
  templateUrl: './homework-template-dialog.component.html',
  styleUrls: ['./homework-template-dialog.component.scss']
})
export class HomeworkTemplateDialogComponent implements OnInit {
  private value: string;

  constructor(
    public dialogRef: MatDialogRef<HomeworkTemplateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
  }

  OnConfirm() {
    this.dialogRef.close(this.value);
  }

  SelectChip(homeworkTemplateId: string) {
    this.value = homeworkTemplateId;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
