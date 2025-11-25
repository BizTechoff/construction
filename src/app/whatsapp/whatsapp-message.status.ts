import { ValueListFieldType } from 'remult'

@ValueListFieldType({ caption: 'סטטוס הודעה' })
export class WhatsAppMessageStatus {
  static pending = new WhatsAppMessageStatus('ממתין')
  static processed = new WhatsAppMessageStatus('טופל')
  static failed = new WhatsAppMessageStatus('נכשל')

  constructor(public caption = '') { }
  id = ''
}
