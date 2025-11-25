import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { ServiceCall } from '../service-call'
import { ServiceCallStatus } from '../service-call.status'
import { ServiceCallsService } from '../service-calls.service'
import { UIToolsService } from '../../common/UIToolsService'
import { terms } from '../../terms'
import { DialogConfig } from '../../common/dialogConfig'

@DialogConfig({
  maxHeight: '85vh',
  maxWidth: '800px',
  panelClass: 'service-call-selection-dialog'
})
@Component({
  selector: 'app-service-call-selection',
  templateUrl: './service-call-selection.component.html',
  styleUrl: './service-call-selection.component.scss'
})
export class ServiceCallSelectionComponent implements OnInit {
  args = {
    selectedIds: [] as string[],
    multiSelect: false,
    customerId: '',
    allowAdd: true,
    allowEdit: true,
    allowDelete: true
  }
  serviceCalls: ServiceCall[] = []
  filteredServiceCalls: ServiceCall[] = []
  selectedServiceCalls: Set<string> = new Set()
  searchText = ''
  terms = terms
  loading = false

  ServiceCallStatus = ServiceCallStatus

  constructor(
    private dialogRef: MatDialogRef<ServiceCallSelectionComponent>,
    private serviceCallsService: ServiceCallsService,
    private ui: UIToolsService
  ) {}

  async ngOnInit() {
    if (!this.args) this.args = {
      selectedIds: [],
      multiSelect: false,
      customerId: '',
      allowAdd: true,
      allowEdit: true,
      allowDelete: true
    }

    this.selectedServiceCalls = new Set(this.args.selectedIds)
    await this.loadServiceCalls()
  }

  async loadServiceCalls() {
    this.loading = true
    try {
      const response = await this.serviceCallsService.getServiceCalls({
        filter: '',
        customerId: this.args.customerId || undefined,
        page: 1,
        pageSize: 1000
      })

      this.serviceCalls = response.serviceCalls.sort((a, b) => {
        const aSelected = this.selectedServiceCalls.has(a.id)
        const bSelected = this.selectedServiceCalls.has(b.id)

        if (aSelected && !bSelected) return -1
        if (!aSelected && bSelected) return 1

        return b.createDate.getTime() - a.createDate.getTime()
      })
      this.applyFilter()
    } finally {
      this.loading = false
    }
  }

  applyFilter() {
    if (!this.searchText.trim()) {
      this.filteredServiceCalls = this.serviceCalls
    } else {
      const search = this.searchText.toLowerCase()
      this.filteredServiceCalls = this.serviceCalls.filter(sc =>
        sc.site?.toLowerCase().includes(search) ||
        sc.address?.toLowerCase().includes(search) ||
        sc.contactName?.toLowerCase().includes(search) ||
        sc.callNumber.toString().includes(search)
      )
    }
  }

  onSearchChange() {
    this.applyFilter()
  }

  toggleSelection(serviceCall: ServiceCall) {
    if (this.args.multiSelect) {
      if (this.selectedServiceCalls.has(serviceCall.id)) {
        this.selectedServiceCalls.delete(serviceCall.id)
      } else {
        this.selectedServiceCalls.add(serviceCall.id)
      }
    } else {
      this.selectedServiceCalls.clear()
      this.selectedServiceCalls.add(serviceCall.id)
    }
  }

  isSelected(serviceCall: ServiceCall): boolean {
    return this.selectedServiceCalls.has(serviceCall.id)
  }

  confirm() {
    const selected = this.serviceCalls.filter(sc => this.selectedServiceCalls.has(sc.id))

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
    const changed = await this.ui.openServiceCallDetails('', this.args.customerId)
    if (changed) {
      await this.loadServiceCalls()
    }
  }

  async editServiceCall(serviceCall: ServiceCall, event: Event) {
    event.stopPropagation()
    const changed = await this.ui.openServiceCallDetails(serviceCall.id)
    if (changed) {
      await this.loadServiceCalls()
    }
  }

  async deleteServiceCall(serviceCall: ServiceCall, event: Event) {
    event.stopPropagation()
    const confirmed = await this.ui.yesNoQuestion(
      `${terms.areYouSureYouWouldLikeToDelete} קריאה #${serviceCall.callNumber}?`,
      true
    )
    if (confirmed) {
      await this.serviceCallsService.deleteServiceCall(serviceCall.id)
      this.selectedServiceCalls.delete(serviceCall.id)
      await this.loadServiceCalls()
    }
  }

  getStatusLabel(status: ServiceCallStatus): string {
    return status?.caption || ''
  }

  getStatusClass(status: ServiceCallStatus): string {
    return `status-${status?.id || 'open'}`
  }
}
