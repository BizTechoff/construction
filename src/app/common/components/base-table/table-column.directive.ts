import { Directive, Input, TemplateRef } from '@angular/core'

@Directive({
  selector: '[appTableColumn]'
})
export class TableColumnDirective {
  @Input() appTableColumn!: string  // The field name
  @Input() header?: string

  get field(): string {
    return this.appTableColumn
  }

  constructor(public template: TemplateRef<any>) {}
}
