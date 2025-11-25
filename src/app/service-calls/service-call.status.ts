import { ValueListFieldType } from 'remult'

@ValueListFieldType({ caption: 'סטטוס קריאה' })
export class ServiceCallStatus {
  static open = new ServiceCallStatus('פתוח')
  static in_progress = new ServiceCallStatus('בטיפול')
  static closed = new ServiceCallStatus('סגור')
  static cancelled = new ServiceCallStatus('בוטל')

  constructor(public caption = '') { }
  id = ''
}
