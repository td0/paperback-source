import {
  Request,
  RequestInterceptor,
  RequestManager,
  Response,
} from 'paperback-extensions-common'
import {
  BASE_DOMAIN,
  METHOD,
  HEADERS,
  TITLE_THUMBNAIL_PATH,
} from '../MangaSailHelper'

export class SearchImgInterceptor implements RequestInterceptor {
  constructor(
    private cheerio: CheerioAPI, 
    private requestManager: () => RequestManager
  ){}

  async interceptRequest(request: Request): Promise<Request> {
    try {
      if (request.url.includes(TITLE_THUMBNAIL_PATH)) {
        const id = request.url.split(TITLE_THUMBNAIL_PATH).pop() ?? ''
        const nodeRes = await this.requestManager()
          .schedule(createRequestObject({
            url: `${BASE_DOMAIN}/content${id}`,
            method: METHOD,
            headers: {
              ...request.headers,
              ...HEADERS
            }
          }), 1)
        const $ = this.cheerio.load(nodeRes.data)
        const nodeId = $('[rel=shortlink]').attr('href')?.split('/').pop() ?? ''
        console.log(nodeId)
      }
    } catch (err: any) {
      console.warn(err)
    }
    return request
  }
  async interceptResponse(response: Response): Promise<Response> {
    return response
  }
}
