import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { Customer } from '../customer'
import { CustomersService } from '../customers.service'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'
import { DialogConfig } from '../../common/dialogConfig'

@DialogConfig({
  maxHeight: '85vh',
  maxWidth: '800px',
  panelClass: 'customer-selection-dialog'
})
@Component({
  selector: 'app-customer-selection',
  templateUrl: './customer-selection.component.html',
  styleUrl: './customer-selection.component.scss'
})
export class CustomerSelectionComponent implements OnInit {
  args = {
    selectedIds: [] as string[],
    multiSelect: false,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true
  }
  customers: Customer[] = []
  filteredCustomers: Customer[] = []
  selectedCustomers: Set<string> = new Set()
  searchText = ''
  terms = terms
  loading = false
  customerEntity = Customer

  constructor(
    private dialogRef: MatDialogRef<CustomerSelectionComponent>,
    private customersService: CustomersService,
    private ui: UIToolsService
  ) {}

  async ngOnInit() {
    if (!this.args) this.args = {
      selectedIds: [],
      multiSelect: false,
      allowAdd: true,
      allowEdit: true,
      allowDelete: true
    }

    this.selectedCustomers = new Set(this.args.selectedIds)
    await this.loadCustomers()
  }

  async loadCustomers() {
    this.loading = true
    try {
      const response = await this.customersService.getCustomers({
        filter: '',
        page: 1,
        pageSize: 1000
      })

      this.customers = response.customers.sort((a, b) => {
        const aSelected = this.selectedCustomers.has(a.id)
        const bSelected = this.selectedCustomers.has(b.id)

        if (aSelected && !bSelected) return -1
        if (!aSelected && bSelected) return 1

        return (a.name || '').localeCompare(b.name || '', 'he')
      })
      this.applyFilter()
    } finally {
      this.loading = false
    }
  }

  applyFilter() {
    if (!this.searchText.trim()) {
      this.filteredCustomers = this.customers
    } else {
      const search = this.searchText.toLowerCase()
      this.filteredCustomers = this.customers.filter(c =>
        c.name?.toLowerCase().includes(search) ||
        c.address?.toLowerCase().includes(search) ||
        c.mobile?.toLowerCase().includes(search)
      )
    }
  }

  onSearchChange() {
    this.applyFilter()
  }

  toggleSelection(customer: Customer) {
    if (this.args.multiSelect) {
      if (this.selectedCustomers.has(customer.id)) {
        this.selectedCustomers.delete(customer.id)
      } else {
        this.selectedCustomers.add(customer.id)
      }
    } else {
      this.selectedCustomers.clear()
      this.selectedCustomers.add(customer.id)
    }
  }

  isSelected(customer: Customer): boolean {
    return this.selectedCustomers.has(customer.id)
  }

  confirm() {
    const selected = this.customers.filter(c => this.selectedCustomers.has(c.id))

    if (this.args.multiSelect) {
      this.dialogRef.close(selected)
    } else {
      this.dialogRef.close(selected[0] || null)
    }
  }

  cancel() {
    this.dialogRef.close(null)
  }

  async addNew() {
    const changed = await this.ui.openCustomerDetails()
    if (changed) {
      await this.loadCustomers()
    }
  }

  async editCustomer(customer: Customer, event: Event) {
    event.stopPropagation()
    const changed = await this.ui.openCustomerDetails(customer.id)
    if (changed) {
      await this.loadCustomers()
    }
  }

  async deleteCustomer(customer: Customer, event: Event) {
    event.stopPropagation()
    const confirmed = await this.ui.yesNoQuestion(
      `${terms.areYouSureYouWouldLikeToDelete} ${customer.name}?`,
      true
    )
    if (confirmed) {
      await this.customersService.deleteCustomer(customer.id)
      this.selectedCustomers.delete(customer.id)
      await this.loadCustomers()
    }
  }
}
