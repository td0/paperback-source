import {
  HomeSectionType,
  Request
} from 'paperback-extensions-common'

// Source Data
export const VERSION = '0.0.1'
export const METHOD = 'GET'
export const DESCRIPTION = 'td0\'s extension for paperback'
export const AUTHOR = 'td0'
export const HOMEPAGE = 'https://github.com/td0/'

// Manga Data
export const NAME = 'MangaSail'
export const BASE_DOMAIN = 'https://www.mangasail.co'
export const MANGA_DETAILS_PATH = `${BASE_DOMAIN}/content`
export const MANGA_DETAILS_FIELDS = [
  'field_image2',
  'field_status',
  'field_artist',
  'field_author',
  'body',
]
export const INTERCEPT_SEARCH_IMG = 'search_image_path'
export const HEADERS = { 'X-Authcache': '1' }
export const HEADER_REF_SEARCH_KEY = 'X-ref-search'
export const HEADER_REF_DETAILS_KEY = 'X-ref-details'
export const HOME_SECTIONS = [
  createHomeSection({
    id: 'featured',
    title: 'Featured',
    type: HomeSectionType.featured,
    view_more: false,
  }),
  createHomeSection({
    id: 'popular',
    title: 'Most Popular',
    view_more: false,
  }),
  createHomeSection({
    id: 'latest',
    title: 'Latest Update',
    type: HomeSectionType.doubleRow,
    view_more: false,
  }),
  createHomeSection({
    id: 'new_manga',
    title: 'New Manga',
    view_more: false,
  })
]
export const HOME_REQUESTS = [
  {
    request: createRequestObject({
      url: BASE_DOMAIN,
      method: METHOD,
      headers: {}
    }),
    sectionIds: ['featured','popular','new_manga']
  }, {
    request: createRequestObject({
      url: `${BASE_DOMAIN}/block_refresh/showmanga/lastest_list`,
      method: METHOD,
      headers: {
        'x-requested-with': 'XMLHttpRequest'
      }
    }),
    sectionIds: ['latest']
  }
]

// helper methods
export const mangaDetailFieldsMapper = (
  results: string[]
): Record<string, unknown> => {
  return results.reduce((
    result: Record<string, string>,
    field,
    idx
  ) => {
    let fieldKey
    switch(MANGA_DETAILS_FIELDS[idx]) {
      case 'field_image2':
        fieldKey = 'image'
        break
      case 'field_status':
        fieldKey = 'status'
        break
      case 'field_author':
        fieldKey = 'author'
        break
      case 'field_artist':
        fieldKey = 'artist'
        break
      case 'body':
        fieldKey = 'desc'
        break
      default:
        fieldKey = MANGA_DETAILS_FIELDS[idx] as string
    }
    return {
      ...result,
      [fieldKey]: field
    }
  }, {})
}