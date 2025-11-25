import { Component, OnInit, OnDestroy, NgZone } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { remult } from 'remult'
import { SortEvent, PageEvent } from '../../common/components/base-table/table.interfaces'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'
import { ServiceCall } from '../service-call'
import { ServiceCallStatus } from '../service-call.status'
import { ServiceCallsService } from '../service-calls.service'
import { BusyService } from '../../common/components/wait/busyService'
import { getValueList } from 'remult'

@Component({
  selector: 'app-service-call-list',
  templateUrl: './service-call-list.component.html',
  styleUrl: './service-call-list.component.scss'
})
export class ServiceCallListComponent implements OnInit, OnDestroy {
  serviceCalls: ServiceCall[] = []
  loading = false
  totalRecords = 0
  currentPage = 1
  pageSize = 30
  serviceCallEntity = ServiceCall

  currentFilter = ''
  currentSort: SortEvent | null = null
  statusFilter = ''

  // From query params
  customerId = ''
  customerName = ''

  useLiveQuery = false
  private liveQueryUnsubscribe?: VoidFunction

  statusOptions = [
    { value: '', label: 'הכל' },
    ...getValueList(ServiceCallStatus).map(s => ({ value: s.id, label: s.caption }))
  ]

  constructor(
    private ui: UIToolsService,
    private busyService: BusyService,
    private serviceCallsService: ServiceCallsService,
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.customerId = params['customerId'] || ''
      this.customerName = params['customerName'] || ''
    })
    await this.loadServiceCalls()
  }

  ngOnDestroy() {
    this.liveQueryUnsubscribe?.()
  }

  async loadServiceCalls() {
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

  async onSort(event: SortEvent) {
    this.currentSort = event
    this.currentPage = 1
    await this.loadServiceCalls()
  }

  async onFilter(searchText: string) {
    this.currentFilter = searchText
    this.currentPage = 1
    await this.loadServiceCalls()
  }

  async onPageChange(event: PageEvent) {
    this.currentPage = event.page
    this.pageSize = event.pageSize
    await this.loadServiceCalls()
  }

  async onStatusFilterChange() {
    this.currentPage = 1
    await this.loadServiceCalls()
  }

  async onRefresh() {
    await this.loadServiceCalls()
  }

  async addServiceCall() {
    const changed = await this.ui.openServiceCallDetails('', this.customerId)
    if (changed) {
      this.ui.info('קריאת השירות נוספה בהצלחה')
      await this.loadServiceCalls()
    }
  }

  async editServiceCall(serviceCall: ServiceCall) {
    const changed = await this.ui.openServiceCallDetails(serviceCall.id)
    if (changed) {
      this.ui.info('קריאת השירות עודכנה בהצלחה')
      await this.loadServiceCalls()
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
        await this.loadServiceCalls()
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
    this.loadServiceCalls()
  }
}
