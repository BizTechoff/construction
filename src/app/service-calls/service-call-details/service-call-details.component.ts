import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { remult } from 'remult'
import { ServiceCallsController } from '../../../shared/controllers/ServiceCallsController'
import { CustomersController } from '../../../shared/controllers/CustomersController'
import { terms } from '../../terms'
import { ServiceCall } from '../service-call'
import { ServiceCallStatus } from '../service-call.status'
import { Customer } from '../../customers/customer'
import { Contact } from '../../customers/contact'
import { UIToolsService } from '../../common/UIToolsService'
import { getValueList } from 'remult'

@Component({
  selector: 'app-service-call-details',
  templateUrl: './service-call-details.component.html',
  styleUrl: './service-call-details.component.scss'
})
export class ServiceCallDetailsComponent implements OnInit {
  args = { serviceCallId: '', customerId: '' }
  serviceCall = remult.repo(ServiceCall).create()
  isNew = true
  terms = terms
  changed = false

  selectedCustomer: Customer | null = null
  selectedContact: Contact | null = null

  statusOptions = getValueList(ServiceCallStatus)

  constructor(
    private dialogRef: MatDialogRef<ServiceCallDetailsComponent>,
    private ui: UIToolsService
  ) { }

  async ngOnInit() {
    if (!this.args) {
      this.args = { serviceCallId: '', customerId: '' }
    }

    if (this.args.serviceCallId) {
      const sc = await remult.repo(ServiceCall).findId(this.args.serviceCallId, { useCache: false })
      if (!sc) {
        throw new Error(`serviceCallId '${this.args.serviceCallId}' NOT-FOUND`, { cause: 'NOT-FOUND' })
      }
      this.serviceCall = sc
      this.isNew = false

      // Load customer
      if (sc.customerId) {
        this.selectedCustomer = await remult.repo(Customer).findId(sc.customerId) || null
      }
    } else if (this.args.customerId) {
      // Pre-fill customer
      this.serviceCall.customerId = this.args.customerId
      this.selectedCustomer = await remult.repo(Customer).findId(this.args.customerId) || null

      // Try to get default contact
      const defaultContact = await CustomersController.getDefaultContact(this.args.customerId)
      if (defaultContact) {
        this.serviceCall.contactName = defaultContact.name
        this.serviceCall.contactMobile = defaultContact.mobile
        this.selectedContact = defaultContact
      }

      // Pre-fill address from customer
      if (this.selectedCustomer?.address) {
        this.serviceCall.address = this.selectedCustomer.address
      }
    }
  }

  async selectCustomer() {
    const customer = await this.ui.openCustomerSelection() as Customer | null
    if (customer) {
      this.selectedCustomer = customer
      this.serviceCall.customerId = customer.id

      // Pre-fill address
      if (customer.address) {
        this.serviceCall.address = customer.address
      }

      // Try to get default contact
      const defaultContact = await CustomersController.getDefaultContact(customer.id)
      if (defaultContact) {
        this.serviceCall.contactName = defaultContact.name
        this.serviceCall.contactMobile = defaultContact.mobile
        this.selectedContact = defaultContact
      } else {
        this.serviceCall.contactName = ''
        this.serviceCall.contactMobile = ''
        this.selectedContact = null
      }
    }
  }

  async selectContact() {
    if (!this.serviceCall.customerId) {
      this.ui.info('יש לבחור לקוח תחילה')
      return
    }

    const contact = await this.ui.openContactSelection(this.serviceCall.customerId) as Contact | null
    if (contact) {
      this.selectedContact = contact
      this.serviceCall.contactName = contact.name
      this.serviceCall.contactMobile = contact.mobile
    }
  }

  async save() {
    try {
      if (this.isNew) {
        await ServiceCallsController.createServiceCall({
          customerId: this.serviceCall.customerId,
          address: this.serviceCall.address,
          site: this.serviceCall.site,
          description: this.serviceCall.description,
          contactName: this.serviceCall.contactName,
          contactMobile: this.serviceCall.contactMobile,
          status: this.serviceCall.status
        })
      } else {
        await ServiceCallsController.updateServiceCall(this.serviceCall.id, {
          customerId: this.serviceCall.customerId,
          address: this.serviceCall.address,
          site: this.serviceCall.site,
          description: this.serviceCall.description,
          contactName: this.serviceCall.contactName,
          contactMobile: this.serviceCall.contactMobile,
          status: this.serviceCall.status
        })
      }

      this.changed = true
      this.close()
    } catch (error: any) {
      throw error
    }
  }

  close() {
    this.dialogRef.close(this.changed)
  }

  cancel() {
    this.dialogRef.close(false)
  }
}
