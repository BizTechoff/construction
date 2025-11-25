import { Component, OnInit, OnDestroy, NgZone } from '@angular/core'
import { Router } from '@angular/router'
import { remult } from 'remult'
import { SortEvent, PageEvent } from '../../common/components/base-table/table.interfaces'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'
import { Customer } from '../customer'
import { CustomersService } from '../customers.service'
import { BusyService } from '../../common/components/wait/busyService'

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit, OnDestroy {
  customers: Customer[] = []
  loading = false
  totalRecords = 0
  currentPage = 1
  pageSize = 30
  customerEntity = Customer

  currentFilter = ''
  currentSort: SortEvent | null = null

  useLiveQuery = false
  private liveQueryUnsubscribe?: VoidFunction

  constructor(
    private ui: UIToolsService,
    private busyService: BusyService,
    private customersService: CustomersService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadCustomers()
  }

  ngOnDestroy() {
    this.liveQueryUnsubscribe?.()
  }

  async loadCustomers() {
    this.loading = true
    try {
      const response = await this.customersService.getCustomers({
        filter: this.currentFilter,
        sortField: this.currentSort?.field,
        sortDirection: this.currentSort?.direction,
        page: this.currentPage,
        pageSize: this.pageSize
      })

      this.customers = response.customers
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
    await this.loadCustomers()
  }

  async onFilter(searchText: string) {
    this.currentFilter = searchText
    this.currentPage = 1
    await this.loadCustomers()
  }

  async onPageChange(event: PageEvent) {
    this.currentPage = event.page
    this.pageSize = event.pageSize
    await this.loadCustomers()
  }

  async onRefresh() {
    await this.loadCustomers()
  }

  async addCustomer() {
    const changed = await this.ui.openCustomerDetails()
    if (changed) {
      this.ui.info('הלקוח נוסף בהצלחה')
      await this.loadCustomers()
    }
  }

  async editCustomer(customer: Customer) {
    const changed = await this.ui.openCustomerDetails(customer.id)
    if (changed) {
      this.ui.info('הלקוח עודכן בהצלחה')
      await this.loadCustomers()
    }
  }

  async deleteCustomer(customer: Customer) {
    const confirmed = await this.ui.yesNoQuestion(
      `${terms.areYouSureYouWouldLikeToDelete} ${customer.name}?`,
      true
    )

    if (confirmed) {
      try {
        await this.customersService.deleteCustomer(customer.id)
        this.ui.info('הלקוח נמחק בהצלחה')
        await this.loadCustomers()
      } catch (error) {
        this.ui.error(error)
      }
    }
  }

  openServiceCalls(customer: Customer) {
    this.router.navigate(['/service-calls'], {
      queryParams: { customerId: customer.id, customerName: customer.name }
    })
  }
}
