// Source Data
export const VERSION = '0.1.2'
export const METHOD = 'GET'
export const DESCRIPTION = 'td0\'s extension for paperback'
export const AUTHOR = 'td0'
export const HOMEPAGE = 'https://github.com/td0/'

// Manga Data
export const NAME = 'MangaSail'
export const BASE_DOMAIN = 'https://www.mangasail.co'
export const MANGA_DETAILS_PATH = `${BASE_DOMAIN}/content`
export const XML_HTTP_REQUEST_PATH = `${BASE_DOMAIN}/sites/all/modules/authcache/modules/authcache_p13n/frontcontroller/authcache.php`
export const MANGA_DETAILS_FIELDS = [
  'field_image2',
  'field_status',
  'field_artist',
  'field_author',
  'body',
]
export const INTERCEPT_SEARCH_IMG = 'search_image_path'
export const HEADERS = { 'X-Authcache': '1' }
export const METADATA_FROM_SEARCH = 'X-ref-search'
export const METADATA_FROM_DETAILS = 'X-ref-details'
export const METADATA_FROM_CHAPTERS = 'X-ref-chapters'
export const METADATA_FROM_PAGES = 'X-ref-pages'

export const HOME_SECTIONS =[{
  id: 'featured',
  title: 'Featured',
  view_more: false,
}, {
  id: 'popular',
  title: 'Most Popular',
  view_more: false,
}, {
  id: 'latest',
  title: 'Latest Update',
  view_more: false,
}, {
  id: 'new_manga',
  title: 'New Manga',
  view_more: false,
}]

export const HOME_REQUESTS = [{
  request: {
    url: `${XML_HTTP_REQUEST_PATH}?a=&r=frag/block/showmanga-hot_today&o%5Bq%5D=node`,
    method: METHOD,
    headers: {
      ...HEADERS,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-type': 'application/x-www-form-urlencoded',
    }
  },
  sectionId: 'featured'
}, {
  request: {
    url: `${XML_HTTP_REQUEST_PATH}?a=&r=frag/block/showmanga-hot_manga&o%5Bq%5D=node`,
    method: METHOD,
    headers: {
      ...HEADERS,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-type': 'application/x-www-form-urlencoded',
    }
  },
  sectionId: 'popular'
}, {
  request: {
    url: `${XML_HTTP_REQUEST_PATH}?a=&r=frag/block/showmanga-new_manga&o%5Bq%5D=node`,
    method: METHOD,
    headers: {
      ...HEADERS,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-type': 'application/x-www-form-urlencoded',
    }
  },
  sectionId: 'new_manga'
}, {
  request: {
    url: `${BASE_DOMAIN}/block_refresh/showmanga/lastest_list`,
    method: METHOD,
    headers: {
      ...HEADERS,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-type': 'application/x-www-form-urlencoded',
    }
  },
  sectionId: 'latest'
}]

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