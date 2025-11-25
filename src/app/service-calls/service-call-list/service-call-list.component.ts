import { Component, OnInit, NgZone } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { remult, Repository } from 'remult'
import { UIToolsService } from '../../common/UIToolsService'
import { LiveQueryListComponent } from '../../common/liveQueryListComponent'
import { terms } from '../../terms'
import { ServiceCall } from '../service-call'
import { ServiceCallStatus } from '../service-call.status'
import { ServiceCallsService } from '../service-calls.service'
import { getValueList } from 'remult'

@Component({
  selector: 'app-service-call-list',
  templateUrl: './service-call-list.component.html',
  styleUrl: './service-call-list.component.scss'
})
export class ServiceCallListComponent extends LiveQueryListComponent<ServiceCall> implements OnInit {
  serviceCalls: ServiceCall[] = []
  serviceCallEntity = ServiceCall

  statusFilter = ''

  // From query params
  customerId = ''
  customerName = ''

  statusOptions = [
    { value: '', label: 'הכל' },
    ...getValueList(ServiceCallStatus).map(s => ({ value: s.id, label: s.caption }))
  ]

  constructor(
    ngZone: NgZone,
    ui: UIToolsService,
    private serviceCallsService: ServiceCallsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super(ngZone, ui)
  }

  async ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.customerId = params['customerId'] || ''
      this.customerName = params['customerName'] || ''
    })
    await this.reload()
  }

  protected getRepository(): Repository<ServiceCall> {
    return remult.repo(ServiceCall)
  }

  protected override buildWhereClause(): any {
    const where: any = {}

    if (this.currentFilter) {
      where.$or = [
        { site: { $contains: this.currentFilter } },
        { address: { $contains: this.currentFilter } },
        { contactName: { $contains: this.currentFilter } }
      ]
    }

    if (this.customerId) {
      where.customerId = this.customerId
    }

    if (this.statusFilter) {
      where.status = this.statusFilter
    }

    return where
  }

  protected async loadData() {
    this.loading = true
    try {
      const response = await this.serviceCallsService.getServiceCalls({
        filter: this.currentFilter,
        customerId: this.customerId || undefined,
        status: this.statusFilter || undefined,
        sortField: this.currentSort?.field,
        sortDirection: this.currentSort?.direction,
        page: this.currentPage,
        pageSize: this.pageSize
      })

      this.serviceCalls = response.serviceCalls
      this.totalRecords = response.totalRecords
    } catch (error) {
      this.ui.error(error?.toString())
    } finally {
      this.loading = false
    }
  }

  protected loadDataLive() {
    this.loading = true
    this.liveQueryUnsubscribe?.()

    const liveQuery = this.serviceCallsService.getServiceCallsLive({
      filter: this.currentFilter,
      customerId: this.customerId || undefined,
      status: this.statusFilter || undefined,
      sortField: this.currentSort?.field,
      sortDirection: this.currentSort?.direction,
      page: this.currentPage,
      pageSize: this.pageSize
    })

    this.liveQueryUnsubscribe = liveQuery.subscribe((info) => {
      this.ngZone.run(() => {
        this.serviceCalls = info.items
        this.loading = false
        this.loadTotalCount()
      })
    })
  }

  async onStatusFilterChange() {
    this.currentPage = 1
    await this.reload()
  }

  async addServiceCall() {
    const changed = await this.ui.openServiceCallDetails('', this.customerId)
    if (changed) {
      this.ui.info('קריאת השירות נוספה בהצלחה')
      if (!this.useLiveQuery) {
        await this.loadData()
      }
    }
  }

  async editServiceCall(serviceCall: ServiceCall) {
    const changed = await this.ui.openServiceCallDetails(serviceCall.id)
    if (changed) {
      this.ui.info('קריאת השירות עודכנה בהצלחה')
      if (!this.useLiveQuery) {
        await this.loadData()
      }
    }
  }

  async deleteServiceCall(serviceCall: ServiceCall) {
    const confirmed = await this.ui.yesNoQuestion(
      `${terms.areYouSureYouWouldLikeToDelete} קריאה #${serviceCall.callNumber}?`,
      true
    )

    if (confirmed) {
      try {
        await this.serviceCallsService.deleteServiceCall(serviceCall.id)
        this.ui.info('קריאת השירות נמחקה בהצלחה')
        await this.loadData()
      } catch (error) {
        this.ui.error(error)
      }
    }
  }

  getStatusLabel(status: ServiceCallStatus): string {
    return status?.caption || ''
  }

  getStatusClass(status: ServiceCallStatus): string {
    return `status-${status?.id || 'open'}`
  }

  clearCustomerFilter() {
    this.customerId = ''
    this.customerName = ''
    this.router.navigate(['/service-calls'])
    this.reload()
  }
}
