import { Injectable, ErrorHandler, NgZone } from "@angular/core"
import { UIToolsService } from "./UIToolsService"

@Injectable()
export class ShowDialogOnErrorErrorHandler extends ErrorHandler {
  constructor(private ui: UIToolsService, private zone: NgZone) {
    super()
  }
  lastErrorString = ''
  lastErrorTime!: number
  isHandlingError = false
  override handleError(error: any) {
    super.handleError(error)

    // Prevent infinite loop
    if (this.isHandlingError) {
      console.error('Error while handling error:', error)
      return
    }

    if (
      this.lastErrorString == error.toString() &&
      new Date().valueOf() - this.lastErrorTime < 100
    )
      return

    this.lastErrorString = error.toString()
    this.lastErrorTime = new Date().valueOf()
    this.isHandlingError = true

    this.zone.run(async () => {
      try {
        await this.ui.error(error)
      } catch (err) {
        console.error('Failed to show error dialog:', err)
      } finally {
        this.isHandlingError = false
      }
    })
  }
}