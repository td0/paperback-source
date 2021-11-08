import {
  Request,
  RequestInterceptor,
  Response,
} from 'paperback-extensions-common'

export class MangaSailInterceptor implements RequestInterceptor {
  interceptors: RequestInterceptor[]
  constructor(interceptors: RequestInterceptor[]) {
    this.interceptors = interceptors
  }

  async interceptRequest(request: Request): Promise<Request> {

    request.headers = {
      ...(request.headers ?? {}),
    }

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
