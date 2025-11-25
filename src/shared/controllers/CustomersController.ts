import { BackendMethod, Controller, ControllerBase, remult } from 'remult'
import { Customer } from '../../app/customers/customer'
import { Contact } from '../../app/customers/contact'

export interface GetCustomersRequest {
  filter?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface GetCustomersResponse {
  customers: Customer[]
  totalRecords: number
}

export interface GetContactsRequest {
  customerId: string
  filter?: string
}

export interface GetContactsResponse {
  contacts: Contact[]
  totalRecords: number
}

@Controller('customers')
export class CustomersController extends ControllerBase {

  @BackendMethod({ allowed: true })
  static async getCustomers(request: GetCustomersRequest): Promise<GetCustomersResponse> {
    const {
      filter = '',
      sortField,
      sortDirection = 'asc',
      page = 1,
      pageSize = 30
    } = request

    const where = filter
      ? { name: { $contains: filter } }
      : {}

    const queryOptions: any = {
      where,
      page,
      limit: pageSize,
    }

    if (sortField) {
      queryOptions.orderBy = { [sortField]: sortDirection }
    }

    const customers = await remult.repo(Customer).find(queryOptions)
    const totalRecords = await remult.repo(Customer).count(where)

    return {
      customers,
      totalRecords
    }
  }

  @BackendMethod({ allowed: true })
  static async deleteCustomer(customerId: string): Promise<void> {
    // Delete all contacts for this customer first
    const contacts = await remult.repo(Contact).find({ where: { customerId } })
    for (const contact of contacts) {
      await remult.repo(Contact).delete(contact.id)
    }
    await remult.repo(Customer).delete(customerId)
  }

  @BackendMethod({ allowed: true })
  static async createCustomer(customerData: {
    name: string
    mobile: string
    email: string
    address: string
  }): Promise<Customer> {
    const customer = remult.repo(Customer).create()
    customer.name = customerData.name
    customer.mobile = customerData.mobile
    customer.email = customerData.email
    customer.address = customerData.address
    await customer.save()
    return customer
  }

  @BackendMethod({ allowed: true })
  static async updateCustomer(
    customerId: string,
    customerData: {
      name: string
      mobile: string
      email: string
      address: string
    }
  ): Promise<Customer> {
    const customer = await remult.repo(Customer).findId(customerId)
    if (!customer) {
      throw new Error('לקוח לא נמצא')
    }
    customer.name = customerData.name
    customer.mobile = customerData.mobile
    customer.email = customerData.email
    customer.address = customerData.address
    await customer.save()
    return customer
  }

  // Contact methods
  @BackendMethod({ allowed: true })
  static async getContacts(request: GetContactsRequest): Promise<GetContactsResponse> {
    const { customerId, filter = '' } = request

    const where: any = { customerId }
    if (filter) {
      where.name = { $contains: filter }
    }

    const contacts = await remult.repo(Contact).find({ where })
    const totalRecords = await remult.repo(Contact).count(where)

    return {
      contacts,
      totalRecords
    }
  }

  @BackendMethod({ allowed: true })
  static async createContact(contactData: {
    customerId: string
    name: string
    mobile: string
    isDefault: boolean
  }): Promise<Contact> {
    // If this is default, unset other defaults
    if (contactData.isDefault) {
      const existingDefaults = await remult.repo(Contact).find({
        where: { customerId: contactData.customerId, isDefault: true }
      })
      for (const c of existingDefaults) {
        c.isDefault = false
        await c.save()
      }
    }

    const contact = remult.repo(Contact).create()
    contact.customerId = contactData.customerId
    contact.name = contactData.name
    contact.mobile = contactData.mobile
    contact.isDefault = contactData.isDefault
    await contact.save()
    return contact
  }

  @BackendMethod({ allowed: true })
  static async updateContact(
    contactId: string,
    contactData: {
      name: string
      mobile: string
      isDefault: boolean
    }
  ): Promise<Contact> {
    const contact = await remult.repo(Contact).findId(contactId)
    if (!contact) {
      throw new Error('איש קשר לא נמצא')
    }

    // If setting as default, unset other defaults
    if (contactData.isDefault && !contact.isDefault) {
      const existingDefaults = await remult.repo(Contact).find({
        where: { customerId: contact.customerId, isDefault: true }
      })
      for (const c of existingDefaults) {
        c.isDefault = false
        await c.save()
      }
    }

    contact.name = contactData.name
    contact.mobile = contactData.mobile
    contact.isDefault = contactData.isDefault
    await contact.save()
    return contact
  }

  @BackendMethod({ allowed: true })
  static async deleteContact(contactId: string): Promise<void> {
    await remult.repo(Contact).delete(contactId)
  }

  @BackendMethod({ allowed: true })
  static async getDefaultContact(customerId: string): Promise<Contact | null> {
    const contact = await remult.repo(Contact).findFirst({
      customerId,
      isDefault: true
    })
    return contact || null
  }
}
