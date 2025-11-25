import { ValueListFieldType } from 'remult'

@ValueListFieldType({ caption: 'סוג שירות' })
export class ServiceCallType {
  static cameras = new ServiceCallType('מצלמות לעגורנים', '1')
  static chains = new ServiceCallType('שרשראות הרמה', '2')
  static safety = new ServiceCallType('ציוד בטיחות', '3')
  static maintenance = new ServiceCallType('תחזוקה שוטפת', '4')
  static other = new ServiceCallType('אחר', '5')

  constructor(public caption = '', public menuKey = '') { }
  id = ''

  static fromMenuKey(key: string): ServiceCallType | undefined {
    return [
      ServiceCallType.cameras,
      ServiceCallType.chains,
      ServiceCallType.safety,
      ServiceCallType.maintenance,
      ServiceCallType.other
    ].find(t => t.menuKey === key)
  }
}
