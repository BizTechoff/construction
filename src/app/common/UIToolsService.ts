import { Injectable, NgZone } from "@angular/core"
import { MatSnackBar } from "@angular/material/snack-bar"
import { UserDetailsModalComponent } from "../users/user-details-modal/user-details-modal.component"
import { ProjectDetailsComponent } from "../projects/project-details/project-details.component"
import { ProjectSelectionComponent } from "../projects/project-selection/project-selection.component"
import { YesNoQuestionComponent } from "./components/yes-no-question/yes-no-question.component"
import { openDialog } from "./openDialog"
import { terms } from "../terms"
import { BusyService } from "./components/wait/busyService"


export function extractError(err: any): string {
  if (typeof err === 'string') return err
  if (err.modelState) {
    if (err.message) return err.message
    for (const key in err.modelState) {
      if (err.modelState.hasOwnProperty(key)) {
        const element = err.modelState[key]
        return key + ': ' + element
      }
    }
  }
  if (err.rejection) return extractError(err.rejection) //for promise failed errors and http errors
  if (err.httpStatusCode == 403) return 'terms.unauthorizedOperation'
  if (err.message) {
    let r = err.message
    if (err.error && err.error.message) r = err.error.message
    return r
  }
  if (err.error) return extractError(err.error)

  return JSON.stringify(err)
}

@Injectable()
export class UIToolsService {

  constructor(
    zone: NgZone,
    private snackBar: MatSnackBar,
    public busy: BusyService
  ) {
    this.mediaMatcher.addListener((mql) =>
      zone.run(() => /*this.mediaMatcher = mql*/ ''.toString())
    )
  }

  info(info: string): any {
    this.snackBar.open(info, terms.close, { duration: 4000 })
  }

  async error(err: any, taskId?: string) {
    const message = extractError(err)
    if (message == 'Network Error') return
    return await openDialog(
      YesNoQuestionComponent,
      (d) =>
      (d.args = {
        message,
        isQuestion: false,
      })
    )
  }

  private mediaMatcher: MediaQueryList = matchMedia(`(max-width: 720px)`)

  isScreenSmall() {
    return this.mediaMatcher.matches
  }

  async yesNoQuestion(question: string, isQuestion = false) {
    return await openDialog(
      YesNoQuestionComponent,
      (d) => (d.args = { message: question, isQuestion: isQuestion }),
      (d) => d.okPressed
    )
  }

  async confirmDelete(of: string) {
    // return await this.yesNoQuestion(
    //   terms.areYouSureYouWouldLikeToDelete + ' ' + of + '?'
    // )
  }

  async openUserDetailsModal(userId = '') {
    return await openDialog(
      UserDetailsModalComponent,
      (d) => d.args = { userId: userId },
      (d) => d?.changed || false
    )
  }

  async openProjectDetails(projectId = '') {
    return await openDialog(
      ProjectDetailsComponent,
      (d) => d.args = { projectId: projectId },
      (d) => d?.changed || false
    )
  }

  async openProjectSelection(selectedIds: string[] = [], multiSelect: boolean = false) {
    return await openDialog(
      ProjectSelectionComponent,
      (d) => d.args = { selectedIds: selectedIds, multiSelect: multiSelect }
    )
  }

}
