import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { remult } from 'remult'
import { CustomersController } from '../../../shared/controllers/CustomersController'
import { terms } from '../../terms'
import { Customer } from '../customer'

@Component({
  selector: 'app-customer-details',
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.scss'
})
export class CustomerDetailsComponent implements OnInit {
  args = { customerId: '' }
  customer = remult.repo(Customer).create()
  isNew = true
  terms = terms
  changed = false

  constructor(private dialogRef: MatDialogRef<CustomerDetailsComponent>) { }

  async ngOnInit() {
    if (!this.args) {
      this.args = { customerId: '' }
    }
    if (this.args.customerId) {
      const c = await remult.repo(Customer).findId(this.args.customerId, { useCache: false })
      if (!c) {
        throw new Error(`customerId '${this.args.customerId}' NOT-FOUND`, { cause: 'NOT-FOUND' })
      }
      this.customer = c
      this.isNew = false
    }
  }

  async save() {
    try {
      if (this.isNew) {
        await CustomersController.createCustomer({
          name: this.customer.name,
          mobile: this.customer.mobile,
          email: this.customer.email,
          address: this.customer.address
        })
      } else {
        await CustomersController.updateCustomer(this.customer.id, {
          name: this.customer.name,
          mobile: this.customer.mobile,
          email: this.customer.email,
          address: this.customer.address
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
