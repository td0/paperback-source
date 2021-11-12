import {
  Request,
  RequestInterceptor,
  RequestManager,
  Response,
} from 'paperback-extensions-common'
import {
  HEADERS,
  INTERCEPT_SEARCH_IMG,
  MANGA_DETAILS_PATH,
  METADATA_FROM_SEARCH,
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
        const newReq = createRequestObject({
          url: `${MANGA_DETAILS_PATH}${id}`,
          method: METHOD,
          headers: HEADERS
        })
        newReq.metadata = METADATA_FROM_SEARCH
        const response = await this.requestManager().schedule(newReq, 1)
        const parsedData = parseResponseObject(response)
        const imgUrl = parsedData?.image as string ?? ''
        request.url = imgUrl
      }
    } catch (err: unknown) {
      console.log(err)
      throw new Error(err as string ?? 'search error')
    }
    return request
  }
  async interceptResponse(response: Response): Promise<Response> {
    if (response.status === 503) {
      throw new Error('CLOUDFLARE BYPASS ERROR:\nPlease go to Settings > Sources > <\\The name of this source\\> and press Cloudflare Bypass')
    }
    return response
  }
}
