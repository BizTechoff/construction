import { ValueListFieldType } from 'remult'

@ValueListFieldType({ caption: 'סוג אירוע' })
export class WhatsAppLogType {
  static message_received = new WhatsAppLogType('הודעה התקבלה')
  static message_sent = new WhatsAppLogType('הודעה נשלחה')
  static service_call_created = new WhatsAppLogType('קריאת שירות נוצרה')
  static customer_identified = new WhatsAppLogType('לקוח זוהה')
  static customer_not_found = new WhatsAppLogType('לקוח לא נמצא')
  static bot_error = new WhatsAppLogType('שגיאת בוט')
  static session_started = new WhatsAppLogType('שיחה החלה')
  static session_ended = new WhatsAppLogType('שיחה הסתיימה')

  constructor(public caption = '') { }
  public id = ''
}
