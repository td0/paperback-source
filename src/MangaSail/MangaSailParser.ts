import {
  MangaTile,
  SearchRequest,
  MangaStatus,
  Response,
  Manga,
  Chapter,
  LanguageCode,
  ChapterDetails,
} from 'paperback-extensions-common'
import { INTERCEPT_SEARCH_IMG } from './MangaSailHelper'

export const parseResponseObject = (response: Response): Record<string, unknown> => {
  try {
    const parsed = typeof response.data === 'string'
      ? JSON.parse(response.data)
      : response.data
    return Object(parsed)
  } catch(err: unknown) {
    console.error(err)
    throw new Error('Error parsing object ' + err)
  } 
}

export const generateSearch = (query: SearchRequest): string => {
  const search: string = query.title ?? ''
  return encodeURI(search)
}

export const parseNodeId = ($: CheerioStatic): string => {
  return $('[rel=shortlink]').attr('href')?.split('/').pop() ?? ''
}

export const parseChapterNumber = (name: string): number => {
  const chapNum = name.match(/(\d+(\.\d+)?)(?!.*\d)/) || ['0']
  return parseFloat(chapNum[0] as string)
}

export const parseSearch = ($: CheerioStatic): MangaTile[] => {
  const mangaList = $('.search-results li h3.title>a').toArray()
  return mangaList.map((item: CheerioStatic) => {
    const id = $(item).attr('href')?.split('/').pop() ?? ''
    return createMangaTile( {
      id,
      title: createIconText({text: $(item).text()}),
      image: `https://${INTERCEPT_SEARCH_IMG}/${id}`
    })
  })
}

export const parseMangaData = (response: Response): Manga => {
  const res = parseResponseObject(response)
  return createManga({
    id: res?.id as string ?? '',
    titles: res?.titles as string[] ?? [''],
    image: res?.image as string ?? '',
    status: res?.status as MangaStatus ?? MangaStatus.UNKNOWN,
    artist: res?.artist as string ?? '',
    author: res?.author as string ?? '',
    desc: res?.desc as string ?? '',
    hentai: res?.hentai as boolean ?? false,
    lastUpdate: new Date(res?.lastUpdate as string ?? '')
  })
}

export const parseDetailField = ($: CheerioStatic, field: string): string => {
  let result
  switch(field){
    case 'field_image2':
      result = $('img.img-responsive').attr('src')
      break
    case 'field_status':
    case 'field_author':
    case 'field_artist':
      result = $('div.field-item.even').text()
      break
    case 'body':
      result = $('div.field-item.even p').text()?.split('summary:').pop() ?? ''
      result = result.trim()
      break
  }
  if (field === 'field_status') {
    if (result === 'Ongoing') result = MangaStatus.ONGOING
    else if (result === 'Complete') result = MangaStatus.COMPLETED
    else result = MangaStatus.UNKNOWN
  }
  return result ?? ''
}

export const parseChapterList = (
  $: CheerioStatic,
  mangaId: string,
): Chapter[] => {
  const chapterList = [] as Chapter[]
  const $list = $('tbody tr').toArray()
  $list.forEach(($chapter: CheerioStatic) => {
    const name = $('a', $chapter)?.text() ?? ''
    chapterList.push(
      createChapter({
        mangaId,
        name,
        id: $('a', $chapter)?.attr('href')?.split('/').pop() ?? '',
        chapNum: parseChapterNumber(name),
        langCode: LanguageCode.ENGLISH,
        time: new Date($('td + td', $chapter).text() ?? '' ),
      })
    )
  })
  return chapterList
}

export const parseChapterDetails = (
  $: CheerioStatic,
  mangaId: string,
  id: string,
): ChapterDetails => {
  const $script = $('script').toArray().filter(($s: CheerioStatic) => (
    $s.children[0]?.data
    && $s.children[0].data.includes('paths')
  ))[0]
  const strData = $script?.children?.[0].data
  const strPages = strData?.split('paths":')?.pop()?.split(',"count_p')?.shift()
  let pages = []
  try {
    pages = JSON.parse(strPages)
  } catch(err: unknown) {
    console.error(err)
    throw new Error('Error parsing pages ' + err)
  } 
  return createChapterDetails({
    mangaId,
    id,
    pages,
    longStrip: false
  })
}

export const parseHomeSectionItems = (
  $: CheerioStatic,
  id: string
): MangaTile[] => {
  const items: MangaTile[] = []
  let selector = ''
  switch(id) {
    case 'featured':
      selector = '#hottoday-list li'
      $(selector).toArray().forEach(($item: CheerioStatic) => {
        items.push(createMangaTile({
          id: $('a', $item).first().attr('href').split('content/').pop(),
          title: createIconText({text: $('a', $item).last().text()}),
          image: $('a>img', $item).attr('src').replace('minicover', 'cover')
        }))
      })
      break
    case 'popular':
      selector = '#block-showmanga-hot-manga ul#new-list>li'
      $(selector).toArray().forEach(($item: CheerioStatic) => {
        items.push(createMangaTile({
          id: $('a', $item).first().attr('href').split('content/').pop(),
          title: createIconText({text: $('.tl', $item).text()}),
          image: $('img', $item).attr('src').replace('minicover', 'cover')
        }))
      })
      break
    case 'latest':
      selector = 'ul#latest-list>li'
      $(selector).toArray().forEach(($item: CheerioStatic) => {
        items.push(createMangaTile({
          id: $('a', $item).first().attr('href').split('content/').pop(),
          title: createIconText({text: $('#c-list a', $item).text()}),
          image: $('img', $item).attr('src').replace('minicover', 'cover')
        }))
      })
      break
    case 'new_manga':
      selector = '#block-showmanga-new-manga ul#new-list>li'
      $(selector).toArray().forEach(($item: CheerioStatic) => {
        items.push(createMangaTile({
          id: $('a', $item).first().attr('href').split('content/').pop(),
          title: createIconText({text: $('.tl', $item).text()}),
          image: $('img', $item).attr('src').replace('minicover', 'cover')
        }))
      })
      break
  }
  return items
}
