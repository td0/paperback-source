import {
  MangaTile,
  SearchRequest,
} from 'paperback-extensions-common'
import { TITLE_THUMBNAIL_PATH } from './MangaSailHelper'

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
      image: `https://${TITLE_THUMBNAIL_PATH}/${id}`
    })
  })
}

