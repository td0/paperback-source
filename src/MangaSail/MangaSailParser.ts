import {
  MangaTile,
  SearchRequest,
  MangaStatus,
  Response,
} from 'paperback-extensions-common'
import { INTERCEPT_SEARCH_IMG } from './MangaSailHelper'

export const generateSearch = (query: SearchRequest): string => {
  const search: string = query.title ?? ''
  return encodeURI(search)
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
      result = $('div.field-item.even p').text()?.split('summary: ').pop() ?? ''
      break
    case 'field_genres':
      result = $('a').toArray().reduce((
        tags: string,
        $tag: CheerioStatic
      ) => {
        return tags + `,${$tag.text()}`
      }, '')
  }
  if (field === 'field_status') {
    if (result === 'Ongoing') result = MangaStatus.ONGOING
    else if (result === 'Complete') result = MangaStatus.COMPLETED
    else result = MangaStatus.UNKNOWN
  }
  return result ?? ''
}

export const parseResponseObject = (response: Response): Record<string, unknown> => {
  const parsed = typeof response.data === 'string'
    ? JSON.parse(response.data)
    : response.data
  return Object(parsed)
}

