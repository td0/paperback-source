import {
  Request,
  RequestInterceptor,
  Response,
} from 'paperback-extensions-common'

export class MangaSailInterceptor implements RequestInterceptor {
  constructor(
    private interceptors: RequestInterceptor[]
  ){}

  async interceptRequest(request: Request): Promise<Request> {
    for (const interceptor of this.interceptors) {
      request = await interceptor.interceptRequest(request)
    }
    return request
  }
  async interceptResponse(response: Response): Promise<Response> {
    for (const interceptor of this.interceptors) {
      response = await interceptor.interceptResponse(response)
    }
    return response
  }
}
