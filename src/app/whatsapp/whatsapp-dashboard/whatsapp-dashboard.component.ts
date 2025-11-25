import { Component, OnInit, OnDestroy } from '@angular/core'
import { WhatsAppService } from '../whatsapp.service'
import { WhatsAppMessage } from '../whatsapp-message'
import { WhatsAppLog } from '../whatsapp-log'
import { ServiceCall } from '../../service-calls/service-call'
import { DashboardStats } from '../../../shared/controllers/WhatsAppController'
import { terms } from '../../terms'
import { UIToolsService } from '../../common/UIToolsService'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-whatsapp-dashboard',
  templateUrl: './whatsapp-dashboard.component.html',
  styleUrl: './whatsapp-dashboard.component.scss'
})
export class WhatsAppDashboardComponent implements OnInit, OnDestroy {
  terms = terms

  messages: WhatsAppMessage[] = []
  logs: WhatsAppLog[] = []
  openServiceCalls: ServiceCall[] = []
  stats: DashboardStats = {
    pendingMessages: 0,
    openServiceCalls: 0,
    todayMessages: 0,
    todayServiceCalls: 0
  }

  private subscriptions: Subscription[] = []

  constructor(
    private whatsAppService: WhatsAppService,
    private ui: UIToolsService
  ) { }

  async ngOnInit() {
    await this.whatsAppService.startLiveQueries()

    this.subscriptions.push(
      this.whatsAppService.messages$.subscribe(messages => {
        this.messages = messages
      })
    )

    this.subscriptions.push(
      this.whatsAppService.logs$.subscribe(logs => {
        this.logs = logs
      })
    )

    this.subscriptions.push(
      this.whatsAppService.openServiceCalls$.subscribe(serviceCalls => {
        this.openServiceCalls = serviceCalls
      })
    )

    this.subscriptions.push(
      this.whatsAppService.stats$.subscribe(stats => {
        this.stats = stats
      })
    )
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
    this.whatsAppService.stopLiveQueries()
  }

  async openServiceCall(serviceCall: ServiceCall) {
    const result = await this.ui.openServiceCallDetails(serviceCall.id)
    if (result) {
      await this.whatsAppService.refreshStats()
    }
  }

  async markAsProcessed(message: WhatsAppMessage) {
    await this.whatsAppService.markMessageAsProcessed(message.id)
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('he-IL')
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  }
}
