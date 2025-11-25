import { Injectable, OnDestroy } from '@angular/core'
import { remult } from 'remult'
import { BehaviorSubject } from 'rxjs'
import { WhatsAppMessage } from './whatsapp-message'
import { WhatsAppMessageStatus } from './whatsapp-message.status'
import { WhatsAppLog } from './whatsapp-log'
import { ServiceCall } from '../service-calls/service-call'
import { ServiceCallStatus } from '../service-calls/service-call.status'
import { WhatsAppController, DashboardStats } from '../../shared/controllers/WhatsAppController'

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService implements OnDestroy {

  private messagesSubject = new BehaviorSubject<WhatsAppMessage[]>([])
  private logsSubject = new BehaviorSubject<WhatsAppLog[]>([])
  private openServiceCallsSubject = new BehaviorSubject<ServiceCall[]>([])
  private statsSubject = new BehaviorSubject<DashboardStats>({
    pendingMessages: 0,
    openServiceCalls: 0,
    todayMessages: 0,
    todayServiceCalls: 0
  })

  messages$ = this.messagesSubject.asObservable()
  logs$ = this.logsSubject.asObservable()
  openServiceCalls$ = this.openServiceCallsSubject.asObservable()
  stats$ = this.statsSubject.asObservable()

  private messagesUnsubscribe: (() => void) | null = null
  private logsUnsubscribe: (() => void) | null = null
  private serviceCallsUnsubscribe: (() => void) | null = null

  async startLiveQueries() {
    // LiveQuery for pending messages
    this.messagesUnsubscribe = remult.repo(WhatsAppMessage).liveQuery({
      where: { status: WhatsAppMessageStatus.pending },
      orderBy: { createDate: 'desc' },
      limit: 50
    }).subscribe(info => {
      this.messagesSubject.next(info.items)
      this.refreshStats()
    })

    // LiveQuery for recent logs
    this.logsUnsubscribe = remult.repo(WhatsAppLog).liveQuery({
      orderBy: { createDate: 'desc' },
      limit: 100
    }).subscribe(info => {
      this.logsSubject.next(info.items)
    })

    // LiveQuery for open service calls
    this.serviceCallsUnsubscribe = remult.repo(ServiceCall).liveQuery({
      where: { status: { $in: [ServiceCallStatus.open, ServiceCallStatus.in_progress] } },
      orderBy: { createDate: 'desc' },
      limit: 50
    }).subscribe(info => {
      this.openServiceCallsSubject.next(info.items)
      this.refreshStats()
    })

    // Initial stats load
    await this.refreshStats()
  }

  async refreshStats() {
    const stats = await WhatsAppController.getDashboardStats()
    this.statsSubject.next(stats)
  }

  stopLiveQueries() {
    if (this.messagesUnsubscribe) {
      this.messagesUnsubscribe()
      this.messagesUnsubscribe = null
    }
    if (this.logsUnsubscribe) {
      this.logsUnsubscribe()
      this.logsUnsubscribe = null
    }
    if (this.serviceCallsUnsubscribe) {
      this.serviceCallsUnsubscribe()
      this.serviceCallsUnsubscribe = null
    }
  }

  async markMessageAsProcessed(messageId: string) {
    await WhatsAppController.markMessageAsProcessed(messageId)
  }

  ngOnDestroy() {
    this.stopLiveQueries()
  }
}
