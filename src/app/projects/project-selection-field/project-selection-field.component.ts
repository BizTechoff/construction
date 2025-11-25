import { Component, Input, forwardRef } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Project } from '../project'
import { UIToolsService } from '../../common/UIToolsService'

@Component({
  selector: 'app-project-selection-field',
  templateUrl: './project-selection-field.component.html',
  styleUrls: ['./project-selection-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProjectSelectionFieldComponent),
      multi: true
    }
  ]
})
export class ProjectSelectionFieldComponent implements ControlValueAccessor {
  @Input() label = ''
  @Input() required = false
  @Input() disabled = false
  @Input() multiSelect = false

  value: Project | Project[] | null = null
  isFocused = false

  private onChange: (value: any) => void = () => {}
  private onTouched: () => void = () => {}

  constructor(private ui: UIToolsService) {}

  get displayValue(): string {
    if (!this.value) return ''

    if (Array.isArray(this.value)) {
      return this.value.map(p => p.name).join(', ')
    }

    return this.value.name || ''
  }

  get hasValue(): boolean {
    if (Array.isArray(this.value)) {
      return this.value.length > 0
    }
    return this.value !== null && this.value !== undefined
  }

  get shouldFloatLabel(): boolean {
    return this.isFocused || this.hasValue
  }

  async openSelection(): Promise<void> {
    if (this.disabled) return

    const selectedIds = this.multiSelect
      ? (Array.isArray(this.value) ? this.value.map(p => p.id) : [])
      : (this.value && !Array.isArray(this.value) ? [this.value.id] : [])

    const result: any = await this.ui.openProjectSelection(selectedIds, this.multiSelect)

    if (result) {
      this.value = result
      this.onChange(this.value)
      this.onTouched()
    }
  }

  onFocus(): void {
    this.isFocused = true
  }

  onBlur(): void {
    this.isFocused = false
    this.onTouched()
  }

  clear(event: Event): void {
    event.stopPropagation()
    this.value = this.multiSelect ? [] : null
    this.onChange(this.value)
    this.onTouched()
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value || (this.multiSelect ? [] : null)
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled
  }
}
