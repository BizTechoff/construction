import { ValueListFieldType } from 'remult'

@ValueListFieldType({ caption: 'סוג הודעה' })
export class WhatsAppMessageType {
  static incoming = new WhatsAppMessageType('נכנסת')
  static outgoing = new WhatsAppMessageType('יוצאת')

  constructor(public caption = '') { }
  id = ''
}
