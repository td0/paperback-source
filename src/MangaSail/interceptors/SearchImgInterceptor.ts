import {
  Request,
  RequestInterceptor,
  RequestManager,
  Response,
} from 'paperback-extensions-common'
import {
  HEADERS,
  HEADER_REF_SEARCH_KEY,
  INTERCEPT_SEARCH_IMG,
  MANGA_DETAILS_PATH,
  METHOD,
} from '../MangaSailHelper'
import {
  parseResponseObject,
} from '../MangaSailParser'

export class SearchImgInterceptor implements RequestInterceptor {
  constructor(
    private requestManager: () => RequestManager
  ){}

  async interceptRequest(request: Request): Promise<Request> {
    try {
      if (request.url.includes(INTERCEPT_SEARCH_IMG)) {
        const id = request.url.split(INTERCEPT_SEARCH_IMG).pop() ?? ''
        const response = await this.requestManager()
          .schedule(createRequestObject({
            url: `${MANGA_DETAILS_PATH}${id}`,
            method: METHOD,
            headers: {
              ...HEADERS,
              [HEADER_REF_SEARCH_KEY]: id,
            }
          }), 1)
          
        const parsedData = parseResponseObject(response)
        const imgUrl = parsedData?.image as string ?? ''
        request.url = imgUrl
      }
    } catch (err: unknown) {
      console.error(err)
      throw new Error(err as string ?? 'search error')
    }
    return request
  }
  async interceptResponse(response: Response): Promise<Response> {
    return response
  }
}
