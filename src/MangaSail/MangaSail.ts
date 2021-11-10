import {
  AUTHOR,
  BASE_DOMAIN,
  DESCRIPTION,
  HEADERS,
  HEADER_REF_DETAILS_KEY,
  HOMEPAGE,
  MANGA_DETAILS_PATH,
  METHOD,
  NAME,
  VERSION,
} from './MangaSailHelper'
import {
  Chapter,
  ChapterDetails,
  ContentRating,
  Manga,
  PagedResults,
  Request,
  SearchRequest,
  Source,
  SourceInfo,
  TagType,
} from 'paperback-extensions-common'
import {
  parseChapterDetails,
  parseChapterList,
  parseMangaData,
  parseSearch,
  generateSearch,
} from './MangaSailParser'
import { MangaSailInterceptor } from './MangaSailInterceptor'
import { 
  MangaDetailsInterceptor,
  SearchImgInterceptor,
} from './interceptors'

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
      type: TagType.RED
    }
  ]
}


export class MangaSail extends Source {
  stateManager = createSourceStateManager({})

  requestManager = createRequestManager({
    requestsPerSecond: 5,
    requestTimeout: 20000,
    interceptor: new MangaSailInterceptor([
      new SearchImgInterceptor(() => this.requestManager),
      new MangaDetailsInterceptor(this.cheerio, () => this.requestManager)
    ])
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

  CloudFlareError(status: unknown): void {
    if(status == 503) {
      throw new Error('CLOUDFLARE BYPASS ERROR:\nPlease go to Settings > Sources > <\\The name of this source\\> and press Cloudflare Bypass')
    }
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
      url: `${MANGA_DETAILS_PATH}/${mangaId}`,
      method: METHOD,
      headers: {
        ...HEADERS,
        [HEADER_REF_DETAILS_KEY]: mangaId
      }
    })
    const response = await this.requestManager.schedule(request, 1)
    return parseMangaData(response)
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const request = createRequestObject({
      url: `${MANGA_DETAILS_PATH}/${mangaId}`,
      method: METHOD,
      headers: HEADERS
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = this.cheerio.load(response.data)
    return parseChapterList($, mangaId)
  }

  async getChapterDetails(
    mangaId: string,
    chapterId: string
  ): Promise<ChapterDetails> {
    const request = createRequestObject({
      url: `${MANGA_DETAILS_PATH}/${chapterId}`,
      method: METHOD,
      headers: HEADERS
    })
    const response = await this.requestManager.schedule(request, 1)
    const $ = this.cheerio.load(response.data, { xmlMode: false })
    return parseChapterDetails($, mangaId, chapterId)
  }
}
