import {
  AUTHOR,
  BASE_DOMAIN,
  DESCRIPTION,
  HEADERS,
  HEADER_REF_DETAILS_KEY,
  HOME_REQUESTS,
  HOME_SECTIONS,
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
  HomeSection,
  Manga,
  PagedResults,
  Request,
  SearchRequest,
  Source,
  SourceInfo,
  TagType,
} from 'paperback-extensions-common'
import {
  generateSearch,
  parseChapterDetails,
  parseChapterList,
  parseHomeSectionItems,
  parseMangaData,
  parseSearch,
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

  override async getHomePageSections(
    sectionCallback: (section: HomeSection) => void
  ): Promise<void> {
    // early call sectionCallback to create empty sections page & return sections data 
    const sections = HOME_SECTIONS.reduce((acc, current: HomeSection) => {
      const homeSection = createHomeSection(current)
      sectionCallback(homeSection)
      return {
        ...acc,
        [current.id]: homeSection
      }
    }, {} as Record<string, HomeSection>)

    // fetch home section contents & assign it to sections
    const promises: Promise<void>[] = []
    HOME_REQUESTS.forEach(data => {
      const { request, sectionIds } = data
      promises.push(
        this.requestManager.schedule(request, 1).then(res => {
          const $ = this.cheerio.load(res.data)
          sectionIds.forEach(id => {
            (sections[id] as HomeSection).items = parseHomeSectionItems($, id)
          })
        })
      )
    })
    
    await Promise.all(promises)
  }
}
