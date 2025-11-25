import {
  Entity,
  Fields,
  IdEntity,
  Validators
} from 'remult'
import { terms } from '../terms'
import { WhatsAppMessageType } from './whatsapp-message.type'
import { WhatsAppMessageStatus } from './whatsapp-message.status'

@Entity<WhatsAppMessage>('whatsappMessages', {
  allowApiCrud: true,
  defaultOrderBy: { createDate: 'desc' }
})
export class WhatsAppMessage extends IdEntity {

  @Fields.string({
    caption: terms.whatsappPhone
  })
  phone = ''

  @Fields.string({
    caption: terms.whatsappCustomerId
  })
  customerId = ''

  @Fields.string({
    caption: terms.whatsappCustomerName
  })
  customerName = ''

  @Fields.string({
    caption: terms.whatsappMessageText
  })
  messageText = ''

  @Fields.object<WhatsAppMessage, WhatsAppMessageType>({
    caption: terms.whatsappMessageType
  })
  messageType = WhatsAppMessageType.incoming

  @Fields.object<WhatsAppMessage, WhatsAppMessageStatus>({
    caption: terms.whatsappMessageStatus
  })
  status = WhatsAppMessageStatus.pending

  @Fields.string({
    caption: terms.whatsappRelatedServiceCallId
  })
  relatedServiceCallId = ''

  @Fields.date({
    allowApiUpdate: false,
    caption: terms.createDate
  })
  createDate = new Date()
}
