import { Injectable } from '@angular/core'
import { CustomersController, GetCustomersRequest, GetCustomersResponse, GetContactsRequest, GetContactsResponse } from '../../shared/controllers/CustomersController'
import { Customer } from './customer'
import { Contact } from './contact'
import { remult } from 'remult'

@Injectable({
  providedIn: 'root'
})
export class CustomersService {

  async getCustomers(request: GetCustomersRequest): Promise<GetCustomersResponse> {
    return await CustomersController.getCustomers(request)
  }

  getCustomersLive(request: GetCustomersRequest) {
    const where: any = request.filter ? { name: { $contains: request.filter } } : {}

    const queryOptions: any = { where }

    if (request.sortField) {
      queryOptions.orderBy = { [request.sortField]: request.sortDirection || 'asc' }
    }

    if (request.page && request.pageSize) {
      queryOptions.page = request.page
      queryOptions.limit = request.pageSize
    }

    return remult.repo(Customer).liveQuery(queryOptions)
  }

  async deleteCustomer(customerId: string): Promise<void> {
    return await CustomersController.deleteCustomer(customerId)
  }

  // Contact methods
  async getContacts(request: GetContactsRequest): Promise<GetContactsResponse> {
    return await CustomersController.getContacts(request)
  }

  async createContact(contactData: {
    customerId: string
    name: string
    mobile: string
    isDefault: boolean
  }): Promise<Contact> {
    return await CustomersController.createContact(contactData)
  }

  async updateContact(contactId: string, contactData: {
    name: string
    mobile: string
    isDefault: boolean
  }): Promise<Contact> {
    return await CustomersController.updateContact(contactId, contactData)
  }

  async deleteContact(contactId: string): Promise<void> {
    return await CustomersController.deleteContact(contactId)
  }

  async getDefaultContact(customerId: string): Promise<Contact | null> {
    return await CustomersController.getDefaultContact(customerId)
  }
}
