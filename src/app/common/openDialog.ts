import { MatDialog } from "@angular/material/dialog";

export const dialogConfigMember = Symbol('dialogConfigMember')
var _matDialog: MatDialog

export function setMatDialog(dialog: MatDialog) {
  _matDialog = dialog
}

export async function openDialog<T, C>(
  component: { new (...args: any[]): C },
  setParameters?: (it: C) => void,
  returnAValue?: (it: C) => T
): Promise<T> {
  let ref = _matDialog.open(component, (component as any)[dialogConfigMember])
  if (setParameters) setParameters(ref.componentInstance)
  ;(ref.componentInstance as WantsToCloseDialog).closeDialog = () => ref.close()
  var r
  if (ref.beforeClosed) r = await ref.beforeClosed().toPromise()
  //@ts-ignore
  else r = await ref.beforeClose().toPromise()
  if (returnAValue) return returnAValue(ref.componentInstance)
  return r
}

export interface WantsToCloseDialog {
  closeDialog: VoidFunction
}
