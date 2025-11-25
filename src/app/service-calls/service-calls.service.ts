import { Injectable } from '@angular/core'
import { ServiceCallsController, GetServiceCallsRequest, GetServiceCallsResponse } from '../../shared/controllers/ServiceCallsController'
import { ServiceCall } from './service-call'
import { ServiceCallStatus } from './service-call.status'
import { remult } from 'remult'

@Injectable({
  providedIn: 'root'
})
export class ServiceCallsService {

  async getServiceCalls(request: GetServiceCallsRequest): Promise<GetServiceCallsResponse> {
    return await ServiceCallsController.getServiceCalls(request)
  }

  getServiceCallsLive(request: GetServiceCallsRequest) {
    const where: any = {}

    if (request.filter) {
      where.$or = [
        { site: { $contains: request.filter } },
        { address: { $contains: request.filter } },
        { contactName: { $contains: request.filter } }
      ]
    }

    if (request.customerId) {
      where.customerId = request.customerId
    }

    if (request.status) {
      where.status = request.status
    }

    const queryOptions: any = { where }

    if (request.sortField) {
      queryOptions.orderBy = { [request.sortField]: request.sortDirection || 'asc' }
    }

    if (request.page && request.pageSize) {
      queryOptions.page = request.page
      queryOptions.limit = request.pageSize
    }

    return remult.repo(ServiceCall).liveQuery(queryOptions)
  }

  async deleteServiceCall(serviceCallId: string): Promise<void> {
    return await ServiceCallsController.deleteServiceCall(serviceCallId)
  }

  async updateStatus(serviceCallId: string, status: ServiceCallStatus): Promise<ServiceCall> {
    return await ServiceCallsController.updateServiceCallStatus(serviceCallId, status)
  }
}
