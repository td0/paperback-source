import {
  RawData,
  Request,
  RequestInterceptor,
  RequestManager,
  Response,
} from 'paperback-extensions-common'
import { 
  parseDetailField,
  parseNodeId,
  parseResponseObject,
} from '../MangaSailParser'
import { 
  mangaDetailFieldsMapper
} from '../MangaSailHelper'
import {
  BASE_DOMAIN,
  HEADERS,
  HEADER_REF_SEARCH_KEY,
  HEADER_REF_DETAILS_KEY,
  MANGA_DETAILS_PATH,
  MANGA_DETAILS_FIELDS,
  METHOD,
} from '../MangaSailHelper'

export class MangaDetailsInterceptor implements RequestInterceptor {
  constructor(
    private cheerio: CheerioAPI, 
    private requestManager: () => RequestManager
  ){}

  async interceptRequest(request: Request): Promise<Request> {
    return request
  }

  async interceptResponse(response: Response): Promise<Response> {
    const { request } = response
    // if not manga detail path, return the original response
    if (!request.url.includes(MANGA_DETAILS_PATH)) return response
    
    // if the request has Manga Detail or Search Manga ref header
    if (
      request.headers?.[HEADER_REF_DETAILS_KEY]
      || request.headers?.[HEADER_REF_SEARCH_KEY]
    ) {
      const $ = this.cheerio.load(response.data)
      const isFromSearch = !!request.headers?.[HEADER_REF_SEARCH_KEY] 
      const fields = isFromSearch
        ? MANGA_DETAILS_FIELDS.slice(0,1)
        : MANGA_DETAILS_FIELDS
      const nodeId = parseNodeId($)
      const results = nodeId && await Promise.all(fields.map((field: string) => (
        this.getDetailField(nodeId, field)
      ))) || []
      response.rawData = this.generateRawMangaData(
        response,
        results,
        isFromSearch
      )
    }
    return response
  }

  /** 
   *  private helper methods
   **/ 
  private async getDetailField(nodeId: string, field: string): Promise<string> {
    try {
      const request = createRequestObject({
        url: `${BASE_DOMAIN}/sites/all/modules/authcache/modules/authcache_p13n/frontcontroller/authcache.php?a%5Bfield%5D%5B0%5D=${nodeId}%3Afull%3Aen&r=asm/field/node/${field}&o%5Bq%5D=node/${nodeId}&v=u91mcz`,
        method: METHOD,
        headers: {
          ...HEADERS,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-type': 'application/x-www-form-urlencoded',
        }
      })
      const response = await this.requestManager().schedule(request, 1)
      const data = Object(parseResponseObject(response))
      const $ = this.cheerio.load(data?.field[`${nodeId}:full:en`])
      return parseDetailField($, field)
    } catch(err: unknown) {
      console.error(err)
      throw new Error(err as string ?? 'getDetailField Error')
    }
  }

  private generateRawMangaData (
    response: Response,
    results: string[],
    isFromSearch: boolean
  ): RawData {
    const mangaData = mangaDetailFieldsMapper(results)
    if (!isFromSearch) {
      const $ = this.cheerio.load(response.data)
      mangaData['id'] = response.request.url.split('/')?.pop()
      mangaData['hentai'] = !!$('p.manga_warning').length
      mangaData['lastUpdate'] = $('tbody tr td + td').first().text()
      mangaData['titles'] = [$('h1.page-header').text()]
    }
    // return mangaData
    const mangaDataString = JSON.stringify(mangaData)
    const byteArray = Buffer.from(mangaDataString, 'utf8')
    return createRawData(byteArray)
  }
}
 