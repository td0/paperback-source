import {
  Manga,
  MangaTile,
  SearchRequest,
  MangaStatus,
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

export const parseMangaDetails  = ($: CheerioStatic, mangaId: string): Manga => {
  const title = $('h1.page-header').text()
  const image = $('.field-name-field-image2 img').attr('src')
  let status
  switch ($('.field-name-field-status div.field-item.even').text()) {
    case 'Ongoing':
      status = MangaStatus.ONGOING
      break
    case 'Complete':
      status = MangaStatus.COMPLETED
      break
    default:
      status = MangaStatus.UNKNOWN
  }
  const author = $('.field-name-field-author div.field-item.even').text()
  return createManga({
    id: mangaId,
    titles: [title],
    image,
    status,
    hentai: false,
    author: author,
    desc: description,
  })
}

