import { Component, Input, forwardRef } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

@Component({
  selector: 'app-base-input-field',
  templateUrl: './base-input-field.component.html',
  styleUrls: ['./base-input-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BaseInputFieldComponent),
      multi: true
    }
  ]
})
export class BaseInputFieldComponent implements ControlValueAccessor {
  @Input() label = ''
  @Input() type: 'text' | 'password' | 'email' | 'number' | 'tel' = 'text'
  @Input() required = false
  @Input() disabled = false
  @Input() placeholder = ''

  value = ''
  isFocused = false

  private onChange: (value: string) => void = () => {}
  private onTouched: () => void = () => {}

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== ''
  }

  get shouldFloatLabel(): boolean {
    return this.isFocused || this.hasValue
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement
    this.value = input.value
    this.onChange(this.value)
  }

  onFocus(): void {
    this.isFocused = true
  }

  onBlur(): void {
    this.isFocused = false
    this.onTouched()
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || ''
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled
  }
}
