import { Component } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'

@Component({
  selector: 'app-yes-no-question',
  templateUrl: './yes-no-question.component.html',
  styleUrl: './yes-no-question.component.scss'
})
export class YesNoQuestionComponent {
  args: { message: string; isQuestion: boolean } = { message: '', isQuestion: false }
  okPressed = false

  constructor(private dialogRef: MatDialogRef<YesNoQuestionComponent>) {}

  onOk() {
    this.okPressed = true
    this.dialogRef.close()
  }

  onCancel() {
    this.okPressed = false
    this.dialogRef.close()
  }
}
