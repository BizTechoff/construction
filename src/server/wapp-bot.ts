import { remult } from 'remult'
import { Customer } from '../app/customers/customer'
import { ServiceCall } from '../app/service-calls/service-call'
import { ServiceCallStatus } from '../app/service-calls/service-call.status'
import { ServiceCallType } from '../app/service-calls/service-call.type'
import { WhatsAppLog } from '../app/whatsapp/whatsapp-log'
import { WhatsAppLogType } from '../app/whatsapp/whatsapp-log.type'
import { sendMessage } from './wapp'

// Configuration
const COMPANY_NAME = process.env['COMPANY_NAME'] || 'BizTechoff™'
const PRIVACY_URL = process.env['PRIVACY_URL'] || 'https://biztechoff.co.il/privacy.html'
const CUSTOMER_PORTAL_URL = process.env['CUSTOMER_PORTAL_URL'] || 'https://biztechoff.com/portal'

// Conversation state management (in-memory, consider Redis for production)
interface ConversationState {
  step: ConversationStep
  customerId?: string
  customerName?: string
  // For new service call flow
  serviceType?: ServiceCallType
  address?: string
  description?: string
  lastActivity: Date
}

enum ConversationStep {
  IDLE = 'idle',
  MAIN_MENU = 'main_menu',
  // New service call flow
  SELECT_SERVICE_TYPE = 'select_service_type',
  ENTER_ADDRESS = 'enter_address',
  ENTER_DESCRIPTION = 'enter_description',
  // Existing service flow
  VIEW_SERVICE_STATUS = 'view_service_status',
  UPDATE_EXISTING = 'update_existing'
}

// In-memory conversation states (phone -> state)
const conversations = new Map<string, ConversationState>()

// Clean up old conversations (older than 30 minutes)
function cleanupOldConversations() {
  const now = new Date()
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

  for (const [phone, state] of conversations.entries()) {
    if (state.lastActivity < thirtyMinutesAgo) {
      conversations.delete(phone)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldConversations, 5 * 60 * 1000)

/**
 * Create a new customer from WhatsApp contact
 */
async function createNewCustomer(phone: string, senderName: string = ''): Promise<Customer> {
  const customer = remult.repo(Customer).create()
  // Use sender name from WhatsApp if available, otherwise fallback to phone
  customer.name = senderName?.trim() || `לקוח חדש - ${phone}`
  customer.mobile = phone
  await customer.save()

  // Log customer creation
  await createLog(
    phone,
    customer.id,
    WhatsAppLogType.customer_identified,
    `לקוח חדש נוצר אוטומטית: ${customer.name}`
  )

  return customer
}

/**
 * Get or create conversation state
 */
function getConversation(phone: string): ConversationState {
  let state = conversations.get(phone)
  if (!state) {
    state = {
      step: ConversationStep.IDLE,
      lastActivity: new Date()
    }
    conversations.set(phone, state)
  }
  state.lastActivity = new Date()
  return state
}

/**
 * Main bot message handler
 */
export async function handleBotMessage(phone: string, messageText: string, senderName: string = ''): Promise<void> {
  const text = messageText.trim()

  // Find customer by phone, or create if not exists
  let customer = await remult.repo(Customer).findFirst({ mobile: phone })

  if (!customer) {
    // Auto-create new customer with name from WhatsApp
    customer = await createNewCustomer(phone, senderName)
    console.log(`[BOT] Created new customer for phone: ${phone}, name: ${senderName}`)
  }

  // Get conversation state
  const conversation = getConversation(phone)

  conversation.customerId = customer.id
  conversation.customerName = customer.name

  // Route based on conversation step
  switch (conversation.step) {
    case ConversationStep.IDLE:
      await handleNewConversation(phone, customer, conversation)
      break

    case ConversationStep.MAIN_MENU:
      await handleMainMenuChoice(phone, text, customer, conversation)
      break

    case ConversationStep.SELECT_SERVICE_TYPE:
      await handleServiceTypeChoice(phone, text, conversation)
      break

    case ConversationStep.ENTER_ADDRESS:
      await handleAddressInput(phone, text, conversation)
      break

    case ConversationStep.ENTER_DESCRIPTION:
      await handleDescriptionInput(phone, text, conversation)
      break

    default:
      // Unknown state, reset to main menu
      await handleNewConversation(phone, customer, conversation)
  }
}

/**
 * Handle new conversation / first message
 */
async function handleNewConversation(
  phone: string,
  customer: Customer,
  conversation: ConversationState
): Promise<void> {

  // Check for open service calls
  const openCalls = await remult.repo(ServiceCall).find({
    where: {
      customerId: customer.id,
      status: { $in: [ServiceCallStatus.open, ServiceCallStatus.in_progress] }
    },
    orderBy: { createDate: 'desc' },
    limit: 1
  })

  if (openCalls.length > 0) {
    // Has open service call - show status
    const call = openCalls[0]
    await sendMessage(phone, formatOpenCallMessage(customer.name, call))
    conversation.step = ConversationStep.MAIN_MENU
  } else {
    // No open calls - show main menu
    await sendMessage(phone, formatWelcomeMessage(customer.name))
    conversation.step = ConversationStep.MAIN_MENU
  }

  await createLog(phone, conversation.customerId, WhatsAppLogType.session_started, 'שיחה החלה')
}

/**
 * Handle main menu choice
 */
async function handleMainMenuChoice(
  phone: string,
  choice: string,
  customer: Customer,
  conversation: ConversationState
): Promise<void> {

  switch (choice) {
    case '1': // פתיחת קריאת שירות
      await sendMessage(phone, formatServiceTypeMenu())
      conversation.step = ConversationStep.SELECT_SERVICE_TYPE
      break

    case '2': // בירור שירות קיים
      const calls = await remult.repo(ServiceCall).find({
        where: {
          customerId: customer.id,
          status: { $in: [ServiceCallStatus.open, ServiceCallStatus.in_progress] }
        },
        orderBy: { createDate: 'desc' }
      })

      if (calls.length > 0) {
        await sendMessage(phone, formatServiceCallsList(calls))
      } else {
        await sendMessage(phone, `אין קריאות שירות פתוחות.\n\nלפתיחת קריאה חדשה הקלד *1*`)
      }
      conversation.step = ConversationStep.MAIN_MENU
      break

    case '3': // תקלה דחופה
      await sendMessage(phone, formatUrgentMessage())
      conversation.step = ConversationStep.MAIN_MENU
      break

    case '4': // הצעת מחיר
      await sendMessage(phone, `לקבלת הצעת מחיר, אנא צור קשר עם נציג:\n📞 *03-1234567*\n\nאו השאר פרטים ונחזור אליך.`)
      conversation.step = ConversationStep.MAIN_MENU
      break

    case '5': // שיחה עם נציג
      await sendMessage(phone, `נציג יצור איתך קשר בהקדם.\n📞 לשירות מיידי: *03-1234567*`)
      await createLog(phone, conversation.customerId, WhatsAppLogType.message_received, 'לקוח ביקש שיחה עם נציג')
      conversation.step = ConversationStep.IDLE
      break

    default:
      await sendMessage(phone, `לא הבנתי את בחירתך.\nאנא הקלד מספר בין 1-5.`)
  }
}

/**
 * Handle service type selection
 */
async function handleServiceTypeChoice(
  phone: string,
  choice: string,
  conversation: ConversationState
): Promise<void> {

  const serviceType = ServiceCallType.fromMenuKey(choice)

  if (!serviceType) {
    await sendMessage(phone, `לא הבנתי את בחירתך.\nאנא הקלד מספר בין 1-5.`)
    return
  }

  conversation.serviceType = serviceType
  await sendMessage(phone, `מהי כתובת האתר?`)
  conversation.step = ConversationStep.ENTER_ADDRESS
}

/**
 * Handle address input
 */
async function handleAddressInput(
  phone: string,
  address: string,
  conversation: ConversationState
): Promise<void> {

  if (address.length < 3) {
    await sendMessage(phone, `אנא הזן כתובת תקינה.`)
    return
  }

  conversation.address = address
  await sendMessage(phone, `תאר בקצרה את הבעיה/הבקשה:`)
  conversation.step = ConversationStep.ENTER_DESCRIPTION
}

/**
 * Handle description input and create service call
 */
async function handleDescriptionInput(
  phone: string,
  description: string,
  conversation: ConversationState
): Promise<void> {

  if (description.length < 3) {
    await sendMessage(phone, `אנא הזן תיאור מפורט יותר.`)
    return
  }

  conversation.description = description

  try {
    // Create the service call
    const serviceCall = remult.repo(ServiceCall).create()
    serviceCall.customerId = conversation.customerId || ''
    serviceCall.serviceType = conversation.serviceType || ServiceCallType.other
    serviceCall.address = conversation.address || ''
    serviceCall.description = description
    serviceCall.contactMobile = phone
    serviceCall.contactName = conversation.customerName || ''
    serviceCall.status = ServiceCallStatus.open

    await serviceCall.save()

    // Send confirmation
    await sendMessage(phone, formatServiceCallConfirmation(serviceCall))

    // Log
    await createLog(
      phone,
      conversation.customerId,
      WhatsAppLogType.service_call_created,
      `קריאת שירות #${serviceCall.callNumber} נוצרה`,
      serviceCall.id
    )

    // Reset conversation
    conversation.step = ConversationStep.IDLE
    conversation.serviceType = undefined
    conversation.address = undefined
    conversation.description = undefined

  } catch (error) {
    console.error('[BOT] Failed to create service call:', error)
    await sendMessage(phone, `אירעה שגיאה בפתיחת הקריאה.\nאנא נסה שוב או התקשר ל: *03-1234567*`)
    conversation.step = ConversationStep.MAIN_MENU
  }
}

// ==================== Message Templates ====================

function formatFirstTimeMessage(): string {
  return `ברוכים הבאים ל-WhatsApp של *${COMPANY_NAME}*.

לידיעתך, השימוש בשירות הינו בכפוף לתנאי השימוש ומדיניות הפרטיות:
${PRIVACY_URL}

כיצד נוכל לעזור?
*בכל שאלה עם אפשרויות בחירה - יש להשיב מספר בלבד.*

*1* - _פתיחת קריאת שירות_
*2* - _בירור בנוגע לשירות קיים_
*3* - _תקלה דחופה_
*4* - _הצעת מחיר_
*5* - _שיחה עם נציג_`
}

function formatWelcomeMessage(customerName: string): string {
  return `שלום *${customerName}*! 👋

כיצד נוכל לעזור?

*1* - _פתיחת קריאת שירות_
*2* - _בירור בנוגע לשירות קיים_
*3* - _תקלה דחופה_
*4* - _הצעת מחיר_
*5* - _שיחה עם נציג_`
}

function formatOpenCallMessage(customerName: string, call: ServiceCall): string {
  const updateDate = call.lastUpdateDate.toLocaleDateString('he-IL') + ' ' +
                     call.lastUpdateDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

  return `שלום *${customerName}*! 👋

יש לך קריאת שירות פתוחה:
📋 קריאה *#${call.callNumber}*
📍 סטטוס: *${call.status.caption}*
🔧 סוג: ${call.serviceType?.caption || 'כללי'}
🕐 עדכון אחרון: ${updateDate}

לפרטים נוספים: ${CUSTOMER_PORTAL_URL}

כיצד נוכל לעזור?
*1* - _פתיחת קריאת שירות נוספת_
*2* - _עדכון לקריאה קיימת_
*3* - _שיחה עם נציג_`
}

function formatServiceTypeMenu(): string {
  return `מה סוג השירות הנדרש?

*1* - _מצלמות לעגורנים_
*2* - _שרשראות הרמה_
*3* - _ציוד בטיחות_
*4* - _תחזוקה שוטפת_
*5* - _אחר_`
}

function formatServiceCallConfirmation(call: ServiceCall): string {
  return `✅ קריאת שירות *#${call.callNumber}* נפתחה בהצלחה!

📋 סוג: ${call.serviceType?.caption || 'כללי'}
📍 כתובת: ${call.address}
📝 תיאור: ${call.description}

נציג יצור איתך קשר בהקדם.
לפרטים נוספים: ${CUSTOMER_PORTAL_URL}`
}

function formatServiceCallsList(calls: ServiceCall[]): string {
  let message = `קריאות השירות שלך:\n\n`

  for (const call of calls) {
    const updateDate = call.lastUpdateDate.toLocaleDateString('he-IL')
    message += `📋 *#${call.callNumber}* - ${call.status.caption}\n`
    message += `   ${call.serviceType?.caption || 'כללי'} | ${updateDate}\n\n`
  }

  message += `לפרטים נוספים: ${CUSTOMER_PORTAL_URL}`
  return message
}

function formatUrgentMessage(): string {
  return `🚨 *תקלה דחופה*

לטיפול מיידי בתקלה דחופה:
📞 התקשר עכשיו: *03-1234567*

או הקלד *1* לפתיחת קריאת שירות דחופה.`
}

// ==================== Logging ====================

async function createLog(
  phone: string,
  customerId: string | undefined,
  logType: WhatsAppLogType,
  details: string,
  relatedServiceCallId?: string
): Promise<void> {
  try {
    const log = remult.repo(WhatsAppLog).create()
    log.phone = phone
    log.customerId = customerId || ''
    log.logType = logType
    log.details = details
    log.relatedServiceCallId = relatedServiceCallId || ''
    await log.save()
  } catch (error) {
    console.error('[BOT] Create log error:', error)
  }
}
