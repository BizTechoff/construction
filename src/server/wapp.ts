import { remult } from 'remult'
import { WhatsAppMessage } from '../app/whatsapp/whatsapp-message'
import { WhatsAppMessageType } from '../app/whatsapp/whatsapp-message.type'
import { WhatsAppMessageStatus } from '../app/whatsapp/whatsapp-message.status'
import { WhatsAppLog } from '../app/whatsapp/whatsapp-log'
import { WhatsAppLogType } from '../app/whatsapp/whatsapp-log.type'
import { Customer } from '../app/customers/customer'
import { handleBotMessage } from './wapp-bot'

// Green API Configuration
const GREEN_API_URL = process.env['BOT_GREEN_API_URL'] || 'https://api.green-api.com'
const GREEN_API_INSTANCE = process.env['BOT_INSTANCE_ID'] || ''
const GREEN_API_TOKEN = process.env['BOT_TOKEN'] || ''

export interface GreenApiSendResponse {
  idMessage: string
}

export interface GreenApiNotification {
  // Webhook data structure based on Green API format
  typeWebhook: string;
  instanceData: {
    idInstance: string;
    wid: string;
    typeInstance: string;
  };
  timestamp: number;
  idMessage: string;
  senderData: {
    chatId: string;
    chatName: string;
    sender: string;
    senderName: string;
    senderContactName: string;
  };
  messageData: {
    typeMessage: string;
    textMessageData?: {
      textMessage: string;
    };
    fileMessageData?: {
      downloadUrl: string;
      fileName: string;
      caption?: string;
    };
    locationMessageData?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    extendedTextMessageData?: {
      text: string;
      stanzaId: string;
      participant?: string;
    };
    quotedMessage: {
      stanzaId: string;
      participant: string;
      typeMessage: string;
      textMessage: string;
    }
  },
  stateInstance: string
}

/**
 * Format phone number to Green API chatId format
 * @param phone Phone number (e.g., "0501234567" or "+972501234567")
 * @returns Formatted chatId (e.g., "972501234567@c.us")
 */
export function formatPhoneToChat(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '')

  // Handle Israeli numbers
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1)
  } else if (cleaned.startsWith('972')) {
    // Already in international format
  } else if (cleaned.startsWith('+972')) {
    cleaned = cleaned.substring(1)
  }

  return `${cleaned}@c.us`
}

/**
 * Extract phone number from Green API chatId
 * @param chatId Green API chatId (e.g., "972501234567@c.us")
 * @returns Phone number (e.g., "0501234567")
 */
export function extractPhoneFromChat(chatId: string): string {
  const phone = chatId.replace('@c.us', '').replace('@g.us', '')

  // Convert to local Israeli format if applicable
  if (phone.startsWith('972')) {
    return '0' + phone.substring(3)
  }

  return phone
}

/**
 * Send a WhatsApp message via Green API
 */
export async function sendMessage(phone: string, message: string): Promise<GreenApiSendResponse | null> {
  if (!GREEN_API_INSTANCE || !GREEN_API_TOKEN) {
    console.error('[WAPP] Green API not configured')
    return null
  }

  const chatId = formatPhoneToChat(phone)
  const url = `${GREEN_API_URL}/waInstance${GREEN_API_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        message
      })
    })

    if (!response.ok) {
      console.error(`[WAPP] Send failed: ${response.status} ${response.statusText}`)
      return null
    }

    const result = await response.json() as GreenApiSendResponse
    console.log(`[WAPP] Message sent to ${phone}: ${result.idMessage}`)

    // Log outgoing message
    await createLog({
      phone,
      logType: WhatsAppLogType.message_sent,
      details: `הודעה נשלחה: ${message.substring(0, 100)}`
    })

    return result
  } catch (error) {
    console.error('[WAPP] Send error:', error)
    await createLog({
      phone,
      logType: WhatsAppLogType.bot_error,
      details: `שגיאה בשליחת הודעה: ${error}`
    })
    return null
  }
}

/**
 * Process incoming webhook from Green API
 */
export async function processIncomingWebhook(body: any): Promise<void> {
  try {
    const typeWebhook = body.typeWebhook

    // Only process incoming messages
    if (typeWebhook !== 'incomingMessageReceived') {
      console.log(`[WAPP] Ignoring webhook type: ${typeWebhook}`)
      return
    }

    const senderData = body.senderData
    const messageData = body.messageData

    if (!senderData || !messageData) {
      console.log('[WAPP] Missing senderData or messageData')
      return
    }

    const phone = extractPhoneFromChat(senderData.chatId || senderData.sender)
    const senderName = senderData.senderName || senderData.senderContactName || ''

    // Extract message text
    let messageText = ''
    if (messageData.typeMessage === 'textMessage' && messageData.textMessageData) {
      messageText = messageData.textMessageData.textMessage
    } else if (messageData.typeMessage === 'extendedTextMessage' && messageData.extendedTextMessageData) {
      messageText = messageData.extendedTextMessageData.text
    } else {
      console.log(`[WAPP] Unsupported message type: ${messageData.typeMessage}`)
      // Log but continue - might be image/audio/etc
      messageText = `[${messageData.typeMessage}]`
    }

    console.log(`[WAPP] Received from ${phone} (${senderName}): ${messageText}`)

    // Try to find customer by phone
    const customer = await remult.repo(Customer).findFirst({
      mobile: phone
    })

    // Create message record
    const message = remult.repo(WhatsAppMessage).create()
    message.phone = phone
    message.messageText = messageText
    message.messageType = WhatsAppMessageType.incoming
    message.status = WhatsAppMessageStatus.pending

    if (customer) {
      message.customerId = customer.id
      message.customerName = customer.name
    }

    await message.save()

    // Log incoming message
    await createLog({
      phone,
      customerId: customer?.id || '',
      logType: WhatsAppLogType.message_received,
      details: `הודעה התקבלה: ${messageText.substring(0, 100)}`,
      relatedMessageId: message.id
    })

    // Log customer identification
    if (customer) {
      await createLog({
        phone,
        customerId: customer.id,
        logType: WhatsAppLogType.customer_identified,
        details: `לקוח זוהה: ${customer.name}`,
        relatedMessageId: message.id
      })
    } else {
      await createLog({
        phone,
        logType: WhatsAppLogType.customer_not_found,
        details: `לקוח לא נמצא עבור מספר: ${phone}`,
        relatedMessageId: message.id
      })
    }

    // Handle bot conversation flow
    if (messageText && !messageText.startsWith('[')) {
      await handleBotMessage(phone, messageText, senderName)

      // Mark message as processed
      message.status = WhatsAppMessageStatus.processed
      await message.save()
    }

  } catch (error) {
    console.error('[WAPP] Process webhook error:', error)
    await createLog({
      phone: '',
      logType: WhatsAppLogType.bot_error,
      details: `שגיאה בעיבוד webhook: ${error}`
    })
  }
}

/**
 * Create a log entry
 */
async function createLog(data: {
  phone: string
  customerId?: string
  logType: WhatsAppLogType
  details: string
  relatedMessageId?: string
  relatedServiceCallId?: string
}): Promise<void> {
  try {
    const log = remult.repo(WhatsAppLog).create()
    log.phone = data.phone
    log.customerId = data.customerId || ''
    log.logType = data.logType
    log.details = data.details
    log.relatedMessageId = data.relatedMessageId || ''
    log.relatedServiceCallId = data.relatedServiceCallId || ''
    await log.save()
  } catch (error) {
    console.error('[WAPP] Create log error:', error)
  }
}

/**
 * Send a welcome/menu message to a customer
 */
export async function sendWelcomeMessage(phone: string, customerName?: string): Promise<void> {
  const greeting = customerName ? `שלום ${customerName}!` : 'שלום!'

  const menuMessage = `${greeting}

ברוכים הבאים לשירות הלקוחות שלנו.

נא לבחור אפשרות:
1️⃣ פתיחת קריאת שירות חדשה
2️⃣ בדיקת סטטוס קריאה קיימת
3️⃣ דיווח על תקלה דחופה
4️⃣ שיחה עם נציג

הקלד את מספר האפשרות הרצויה.`

  await sendMessage(phone, menuMessage)
}

/**
 * Poll for new notifications (alternative to webhook)
 * Use this if webhook URL is not configured
 */
export async function pollNotifications(): Promise<void> {
  if (!GREEN_API_INSTANCE || !GREEN_API_TOKEN) {
    console.error('[WAPP] Green API not configured')
    return
  }

  const url = `${GREEN_API_URL}/waInstance${GREEN_API_INSTANCE}/receiveNotification/${GREEN_API_TOKEN}?receiveTimeout=5`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`[WAPP] Poll failed: ${response.status}`)
      return
    }

    const notification = await response.json() as GreenApiNotification | null

    if (!notification) {
      // No pending notifications
      return
    }

    console.log(`[WAPP] Received notification: ${notification.idMessage}`)

    // Process the notification
    await processIncomingWebhook(notification)

    // Delete the notification to confirm processing
    await deleteNotification(0)

  } catch (error) {
    console.error('[WAPP] Poll error:', error)
  }
}

/**
 * Delete a processed notification
 */
async function deleteNotification(receiptId: number): Promise<void> {
  const url = `${GREEN_API_URL}/waInstance${GREEN_API_INSTANCE}/deleteNotification/${GREEN_API_TOKEN}/${receiptId}`

  try {
    const response = await fetch(url, { method: 'DELETE' })

    if (!response.ok) {
      console.error(`[WAPP] Delete notification failed: ${response.status}`)
    }
  } catch (error) {
    console.error('[WAPP] Delete notification error:', error)
  }
}
