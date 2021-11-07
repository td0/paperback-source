import {
  AUTHOR,
  BASE_DOMAIN,
  DESCRIPTION,
  HEADERS,
  HOMEPAGE,
  METHOD,
  NAME,
  VERSION,
  TITLE_THUMBNAIL_PATH,
} from './MangaSailHelper'
import {
  Source,
  Manga,
  Chapter,
  ChapterDetails,
  ContentRating,
  SearchRequest,
  PagedResults,
  SourceInfo,
  Request,
  Response,
  TagType,
} from 'paperback-extensions-common'
import {
  generateSearch,
  parseSearch,
} from './MangaSailParser'

export const MangaSailInfo: SourceInfo = {
  version: VERSION,
  name: NAME,
  author: AUTHOR,
  description: DESCRIPTION,
  authorWebsite: HOMEPAGE,
  contentRating: ContentRating.ADULT,
  websiteBaseURL: BASE_DOMAIN,
  icon: 'icon.png',
  sourceTags: [
    {
      text: 'Cloudflare',
      type: TagType.YELLOW
    }
  ]
}


export class MangaSail extends Source {
  stateManager = createSourceStateManager({})

  requestManager = createRequestManager({
    requestsPerSecond: 5,
    requestTimeout: 20000,
    interceptor: {
      interceptRequest: async (request: Request) : Promise<Request> => {
        try {
          if (request.url.includes(TITLE_THUMBNAIL_PATH)) {
            const id = request.url.split(TITLE_THUMBNAIL_PATH).pop() ?? ''
            const nodeRes = await this.requestManager.schedule(createRequestObject({
              url: `${BASE_DOMAIN}/content${id}`,
              method: METHOD,
            }), 1)
            const $ = this.cheerio.load(nodeRes.data)
            const nodeId = $('[rel=shortlink]').attr('href')?.split('/').pop() ?? ''
            const imgUrl = await this.getDetailField(nodeId, 'field_image2')
            request.url = imgUrl ?? request.url
          }
        } catch (err: any) {
          console.warn(err)
        }
        return request
      },

      interceptResponse: async (response: Response) : Promise<Response> => {
        return Promise.resolve(response)
      },
    }
  })
  
  override getMangaShareUrl(mangaId: string): string { 
    return `${BASE_DOMAIN}/content/${mangaId}`
  }

  override getCloudflareBypassRequest(): Request {
    return createRequestObject({
      url: BASE_DOMAIN,
      method: METHOD,
      headers: HEADERS
    })
  }

  async getSearchResults(query: SearchRequest): Promise<PagedResults> {
    const search = generateSearch(query)
    const request = createRequestObject({
      url: `${BASE_DOMAIN}/search/node/${search}`,
      method: METHOD,
      headers: HEADERS
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = this.cheerio.load(response.data)

    const results = parseSearch($)
    return createPagedResults({
      results,
    })
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const request = createRequestObject({
      url: `${BASE_DOMAIN}/content/${mangaId}`,
      method: METHOD,
      headers: HEADERS
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = this.cheerio.load(response.data)
    console.log($)
    // return parseMangaDetails($, mangaId);
    return {titles: [''], image: '', rating: 0, status: 0}
  }

  async getDetailField(nodeId: string, field: string): Promise<string> {
    const request = createRequestObject({
      url: `${BASE_DOMAIN}/sites/all/modules/authcache/modules/authcache_p13n/frontcontroller/authcache.php?a%5Bfield%5D%5B0%5D=${nodeId}%3Afull%3Aen&r=asm/field/node/${field}&o%5Bq%5D=node/${nodeId}&v=u91mcz`,
      method: METHOD,
      headers: {
        ...HEADERS,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-type': 'application/x-www-form-urlencoded',
      }
    })
    let response = await this.requestManager.schedule(request, 1)
    response = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    const data = Object(response)
    const $ = this.cheerio.load(data.field[`${nodeId}:full:en`])
    const imgUrl = $('img.img-responsive').attr('src')
    return imgUrl ?? ''
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const request = createRequestObject({
      url: `${BASE_DOMAIN}/manga/${mangaId}`,
      method: METHOD,
      headers: HEADERS
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = this.cheerio.load(response.data)
    console.log($)
    // return parseChapters($, mangaId);
    return []
  }

  async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
    const request = createRequestObject({
      url: `${BASE_DOMAIN}/manga/${mangaId}/${chapterId}`,
      method: METHOD,
      headers: HEADERS
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = this.cheerio.load(response.data, { xmlMode: false })
    console.log($)
    // return parseChapterDetails($, mangaId, chapterId);
    return {id: '', mangaId: '', longStrip: false, pages: ['mock']}
  }
}
