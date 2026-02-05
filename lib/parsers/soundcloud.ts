import { UrlData, UrlType } from "../../types/provider-types";

function createUrl (type: UrlType, id:string):string|null {
  if (type == "artist"){
    return id;
  }
  //TODO: Improve soundcloud's ids
  return null
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