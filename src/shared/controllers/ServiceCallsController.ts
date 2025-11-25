import { BackendMethod, Controller, ControllerBase, remult } from 'remult'
import { ServiceCall } from '../../app/service-calls/service-call'
import { ServiceCallStatus } from '../../app/service-calls/service-call.status'

export interface GetServiceCallsRequest {
  filter?: string
  customerId?: string
  status?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface GetServiceCallsResponse {
  serviceCalls: ServiceCall[]
  totalRecords: number
}

@Controller('serviceCalls')
export class ServiceCallsController extends ControllerBase {

  @BackendMethod({ allowed: true })
  static async getServiceCalls(request: GetServiceCallsRequest): Promise<GetServiceCallsResponse> {
    const {
      filter = '',
      customerId,
      status,
      sortField,
      sortDirection = 'asc',
      page = 1,
      pageSize = 30
    } = request

    const where: any = {}

    if (filter) {
      where.$or = [
        { site: { $contains: filter } },
        { address: { $contains: filter } },
        { contactName: { $contains: filter } }
      ]
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status
    }

    const queryOptions: any = {
      where,
      page,
      limit: pageSize,
    }

    if (sortField) {
      queryOptions.orderBy = { [sortField]: sortDirection }
    }

    const serviceCalls = await remult.repo(ServiceCall).find(queryOptions)
    const totalRecords = await remult.repo(ServiceCall).count(where)

    return {
      serviceCalls,
      totalRecords
    }
  }

  @BackendMethod({ allowed: true })
  static async deleteServiceCall(serviceCallId: string): Promise<void> {
    await remult.repo(ServiceCall).delete(serviceCallId)
  }

  @BackendMethod({ allowed: true })
  static async createServiceCall(serviceCallData: {
    customerId: string
    address: string
    site: string
    description: string
    contactName: string
    contactMobile: string
    status?: ServiceCallStatus
  }): Promise<ServiceCall> {
    const serviceCall = remult.repo(ServiceCall).create()
    serviceCall.customerId = serviceCallData.customerId
    serviceCall.address = serviceCallData.address
    serviceCall.site = serviceCallData.site
    serviceCall.description = serviceCallData.description
    serviceCall.contactName = serviceCallData.contactName
    serviceCall.contactMobile = serviceCallData.contactMobile
    serviceCall.status = serviceCallData.status || ServiceCallStatus.open
    // callNumber will be set by DB auto-increment
    await serviceCall.save()
    return serviceCall
  }

  @BackendMethod({ allowed: true })
  static async updateServiceCall(
    serviceCallId: string,
    serviceCallData: {
      customerId: string
      address: string
      site: string
      description: string
      contactName: string
      contactMobile: string
      status: ServiceCallStatus
    }
  ): Promise<ServiceCall> {
    const serviceCall = await remult.repo(ServiceCall).findId(serviceCallId)
    if (!serviceCall) {
      throw new Error('קריאת שירות לא נמצאה')
    }
    serviceCall.customerId = serviceCallData.customerId
    serviceCall.address = serviceCallData.address
    serviceCall.site = serviceCallData.site
    serviceCall.description = serviceCallData.description
    serviceCall.contactName = serviceCallData.contactName
    serviceCall.contactMobile = serviceCallData.contactMobile
    serviceCall.status = serviceCallData.status
    await serviceCall.save()
    return serviceCall
  }

  @BackendMethod({ allowed: true })
  static async updateServiceCallStatus(
    serviceCallId: string,
    status: ServiceCallStatus
  ): Promise<ServiceCall> {
    const serviceCall = await remult.repo(ServiceCall).findId(serviceCallId)
    if (!serviceCall) {
      throw new Error('קריאת שירות לא נמצאה')
    }
    serviceCall.status = status
    await serviceCall.save()
    return serviceCall
  }
}
