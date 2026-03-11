import { ExternalUrlData, ProviderNamespace, UrlData, UrlType } from "../../types/provider-types";
const namespace: ProviderNamespace = "soundcloud"
function createUrl (type: UrlType, id:string, mbTypes): ExternalUrlData {
  const mbUrlTypes: Record<UrlType, number[]> = {
        "artist": [291],
        "album": [85],
        "track": [268]
    }
  return {
    url: id,
    urlInfo: {
      provider: namespace,
      id,
      type
    },
    mbTypes: mbTypes || mbUrlTypes[type]
  }
  //TODO: Improve soundcloud's ids
}

function parseUrl (url:string): UrlData | null {
  const setRegex = /soundcloud\.com\/[^\/]*\/sets\/([^\/]*)/
  const trackRegex = /soundcloud\.com\/[^\/]*\/([^\/]*)/
  const artistRegex = /soundcloud\.com\/([^\/]*)/
  if (url.match(setRegex)) {
    return {
      type: 'album',
      id: url
    }
  } else if (url.match(trackRegex)) {
    return {
      type: 'track',
      id: url
    }
  } else if (url.match(artistRegex)) {
    const artistMatch = url.match(artistRegex);
    if (!artistMatch) return null
    return {
      type: 'artist',
      id: url
    }
  }
  return null
}

const soundcloud = {
    parseUrl,
    createUrl
}

export default soundcloud;