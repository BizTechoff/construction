import { BackendMethod, Controller, ControllerBase, remult } from 'remult'
import { WhatsAppMessage } from '../../app/whatsapp/whatsapp-message'
import { WhatsAppMessageStatus } from '../../app/whatsapp/whatsapp-message.status'
import { WhatsAppMessageType } from '../../app/whatsapp/whatsapp-message.type'
import { WhatsAppLog } from '../../app/whatsapp/whatsapp-log'
import { WhatsAppLogType } from '../../app/whatsapp/whatsapp-log.type'
import { ServiceCall } from '../../app/service-calls/service-call'
import { ServiceCallStatus } from '../../app/service-calls/service-call.status'
import { Customer } from '../../app/customers/customer'

export interface GetWhatsAppMessagesRequest {
  filter?: string
  status?: string
  messageType?: string
  page?: number
  pageSize?: number
}

export interface GetWhatsAppMessagesResponse {
  messages: WhatsAppMessage[]
  totalRecords: number
}

export interface GetWhatsAppLogsRequest {
  filter?: string
  logType?: string
  page?: number
  pageSize?: number
}

export interface GetWhatsAppLogsResponse {
  logs: WhatsAppLog[]
  totalRecords: number
}

export interface DashboardStats {
  pendingMessages: number
  openServiceCalls: number
  todayMessages: number
  todayServiceCalls: number
}

@Controller('whatsapp')
export class WhatsAppController extends ControllerBase {

  @BackendMethod({ allowed: true })
  static async getMessages(request: GetWhatsAppMessagesRequest): Promise<GetWhatsAppMessagesResponse> {
    const {
      filter = '',
      status,
      messageType,
      page = 1,
      pageSize = 50
    } = request

    const where: any = {}

    if (filter) {
      where.$or = [
        { phone: { $contains: filter } },
        { customerName: { $contains: filter } },
        { messageText: { $contains: filter } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (messageType) {
      where.messageType = messageType
    }

    const messages = await remult.repo(WhatsAppMessage).find({
      where,
      page,
      limit: pageSize
    })

    const totalRecords = await remult.repo(WhatsAppMessage).count(where)

    return { messages, totalRecords }
  }

  @BackendMethod({ allowed: true })
  static async getLogs(request: GetWhatsAppLogsRequest): Promise<GetWhatsAppLogsResponse> {
    const {
      filter = '',
      logType,
      page = 1,
      pageSize = 100
    } = request

    const where: any = {}

    if (filter) {
      where.$or = [
        { phone: { $contains: filter } },
        { details: { $contains: filter } }
      ]
    }

    if (logType) {
      where.logType = logType
    }

    const logs = await remult.repo(WhatsAppLog).find({
      where,
      page,
      limit: pageSize
    })

    const totalRecords = await remult.repo(WhatsAppLog).count(where)

    return { logs, totalRecords }
  }

  @BackendMethod({ allowed: true })
  static async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pendingMessages = await remult.repo(WhatsAppMessage).count({
      status: WhatsAppMessageStatus.pending
    })

    const openServiceCalls = await remult.repo(ServiceCall).count({
      status: { $in: [ServiceCallStatus.open, ServiceCallStatus.in_progress] }
    })

    const todayMessages = await remult.repo(WhatsAppMessage).count({
      createDate: { $gte: today }
    })

    const todayServiceCalls = await remult.repo(ServiceCall).count({
      createDate: { $gte: today }
    })

    return {
      pendingMessages,
      openServiceCalls,
      todayMessages,
      todayServiceCalls
    }
  }

  @BackendMethod({ allowed: true })
  static async markMessageAsProcessed(messageId: string): Promise<WhatsAppMessage> {
    const message = await remult.repo(WhatsAppMessage).findId(messageId)
    if (!message) {
      throw new Error('הודעה לא נמצאה')
    }
    message.status = WhatsAppMessageStatus.processed
    await message.save()
    return message
  }

  // Bot integration methods - called by WhatsApp bot service
  @BackendMethod({ allowed: true })
  static async receiveMessage(data: {
    phone: string
    messageText: string
  }): Promise<{ message: WhatsAppMessage; customer: Customer | null }> {
    // Try to find customer by phone
    const customer = await remult.repo(Customer).findFirst({
      mobile: data.phone
    })

    // Create message record
    const message = remult.repo(WhatsAppMessage).create()
    message.phone = data.phone
    message.messageText = data.messageText
    message.messageType = WhatsAppMessageType.incoming
    message.status = WhatsAppMessageStatus.pending

    if (customer) {
      message.customerId = customer.id
      message.customerName = customer.name
    }

    await message.save()

    // Log the event
    await WhatsAppController.createLog({
      phone: data.phone,
      customerId: customer?.id || '',
      logType: WhatsAppLogType.message_received,
      details: `הודעה התקבלה: ${data.messageText.substring(0, 100)}`,
      relatedMessageId: message.id
    })

    if (customer) {
      await WhatsAppController.createLog({
        phone: data.phone,
        customerId: customer.id,
        logType: WhatsAppLogType.customer_identified,
        details: `לקוח זוהה: ${customer.name}`,
        relatedMessageId: message.id
      })
    } else {
      await WhatsAppController.createLog({
        phone: data.phone,
        customerId: '',
        logType: WhatsAppLogType.customer_not_found,
        details: `לקוח לא נמצא עבור מספר: ${data.phone}`,
        relatedMessageId: message.id
      })
    }

    return { message, customer: customer || null }
  }

  @BackendMethod({ allowed: true })
  static async createLog(data: {
    phone: string
    customerId: string
    logType: WhatsAppLogType
    details: string
    relatedMessageId?: string
    relatedServiceCallId?: string
  }): Promise<WhatsAppLog> {
    const log = remult.repo(WhatsAppLog).create()
    log.phone = data.phone
    log.customerId = data.customerId
    log.logType = data.logType
    log.details = data.details
    log.relatedMessageId = data.relatedMessageId || ''
    log.relatedServiceCallId = data.relatedServiceCallId || ''
    await log.save()
    return log
  }
}
