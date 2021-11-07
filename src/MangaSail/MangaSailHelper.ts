import { 
  author,
  homepage,
  description,
  extSources
} from '../../package.json'

export const NAME = 'MangaSail'
export const BASE_DOMAIN = extSources[NAME].base_domain
export const VERSION = extSources[NAME].version
export const METHOD = 'GET'
export const DESCRIPTION = description
export const AUTHOR = author
export const HOMEPAGE = homepage
export const TITLE_THUMBNAIL_PATH = 'title_thumbnail_portrait_list'
export const HEADERS = {
  'X-Authcache': '1'
}