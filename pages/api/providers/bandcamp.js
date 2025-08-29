import logger from "../../../utils/logger";
import withCache from "../../../utils/cache";
import ErrorHandler from "../../../utils/errorHandler";
const bcApi = require('bandcamp-scraper')


const namespace = "bandcamp"

const err = new ErrorHandler(namespace);

function searchAsync(params) {
  return new Promise((resolve, reject) => {
    bcApi.search(params, (error, searchResults) => {
      if (error) reject(error);
      else resolve(searchResults);
    });
  });
}

function getArtistByIdAsync(id) {
    return new Promise((resolve, reject) => {
		bcApi.getArtist(`https://${id}.bandcamp.com`, (error, artistData) => {
			if (error) reject(error);
			else resolve(artistData);
		});
	});
}

async function searchByArtistName(artistName) {
	try {
		const data = await searchAsync({ query: artistName, page: 1 });
		if (data){
            return data;
        }
        return null;
	} catch (error) {
		err.handleError("Error searching for artist:", error);

	}
}

function formatArtistSearchData(rawData) {
	const data = rawData?.filter(a => a.type == "artist");
    return data;
}

async function getArtistById(artistId) {
	try {
        const data = await bandcamp.searchByArtistName(artistId);
        if (data) {
            return data.find(a => a.url == `https://${artistId}.bandcamp.com`) || null;
        }
        return null;
    } catch (error) {
        err.handleError("Error fetching artist by ID:", error);
    }
}

function formatArtistLookupData(rawData) {
	return rawData;
}

function formatArtistObject(rawData) {
    return {
        name: rawData.name,
        url: rawData.url,
        imageUrl: rawData.imageUrl,
        relevance: rawData.location,
        info: rawData.tags.join(", "),
        genres: rawData.tags,
        followers: null,
        popularity: null,
        id: getArtistId(rawData),
        provider: namespace
    }
}


function getArtistId(artist) {
    const idRegex = /^https?:\/\/([^.]+)\.bandcamp\.com/;
    const match = artist.url.match(idRegex);
    return match ? match[1] : null;
}

function getArtistUrl(artist) {
    return artist.url;
}

function createUrl(type, id) {
    const baseUrl = "bandcamp.com";
    switch (type) {
        case "artist":
            return `https://${id}.bandcamp.com`;
        default:
            return `${baseUrl}/${id}`;
    }
}

const bandcamp = {
    namespace,
    searchByArtistName,
    getArtistUrl,
    createUrl,
    formatArtistSearchData,
    formatArtistObject,
    getArtistById
}

export default bandcamp;