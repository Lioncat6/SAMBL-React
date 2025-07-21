import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

import processData from "../../utils/processAlbumData";

import logger from "../../utils/logger";
// spotifyId - Spotify artist ID
// mbid - MusicBrainz artist ID. Only neccesary if you want to check if the associated albums are linked to that artist
// quick - Uses URL matching to check for spotify album links in MusicBrainz. This returns faster, but contains less information, removing the orange album status.
// full - adds inc parameters to the MusicBrainz query. (Does not affect quick mode)

async function fetchSourceAlbums(artistId, offset = 0) {
	return await spotify.getArtistAlbums(artistId, offset, 50);
}

async function fetchMbArtistAlbums(mbid, offset = 0, full = false) {
	return await musicbrainz.getArtistAlbums(mbid, offset, 100, full ? ["url-rels", "recordings", "isrcs"] : ["url-rels"]);
}

async function fetchMbArtistFeaturedAlbums(mbid, offset = 0, full = false) {
	return await musicbrainz.getArtistFeaturedAlbums(mbid, offset, 100, full ? ["url-rels", "recordings", "isrcs"] : ["url-rels"]);
}

async function getBySourceAlbumLink(links) {
	return await musicbrainz.getAlbumsBySourceUrls(links, ["release-rels"]);
}



export default async function handler(req, res) {
	let sourceAlbumCount = -1;
	let mbAlbumCount = -1;
	let mbFeaturedAlbumCount = -1;
	let mbUrlCount = -1;
	let sourceAlbums = [];
	let mbAlbums = [];

	function getSourceAlbumUrls() {
		return sourceAlbums.map((album) => {
			return album.external_urls.spotify;
		});
	}

	async function fetchSpotifyAlbums(spids) {
		let attempts = 0;
		for (const spid of spids) {
			let offset = 0;
			let currentAlbumCount = 999;
			let fetchedAlbums = 0;
			while (offset < currentAlbumCount) {
				try {
					const data = await fetchSourceAlbums(spid, offset);
					if (typeof data === "number") {
						if (data === 404) {
							throw new Error(404);
						}
						throw new Error(`Error fetching Spotify albums: ${data}`);
					}
					sourceAlbums = [...sourceAlbums, ...data.items];
					fetchedAlbums += data.items.length;
					currentAlbumCount = data.total;
					if (sourceAlbumCount < 0) {
						sourceAlbumCount = currentAlbumCount;
					}
					offset = fetchedAlbums;
					// updateLoadingText();
				} catch (error) {
					attempts++;
					console.error("Error fetching albums:", error);
				}
				if (attempts > 3) {
					throw new Error("Failed to fetch Spotify albums");
					break;
				}
			}
			sourceAlbumCount += currentAlbumCount;
		}
	}

	async function fetchMusicbrainzArtistAlbums(mbid, full = false) {
		let offset = 0;
		let attempts = 0;
		while (offset < mbAlbumCount || mbAlbumCount == -1) {
			try {
				const data = await fetchMbArtistAlbums(mbid, offset, full);
				if (typeof data == "number") {
					if (data == 404) {
						throw new Error(404);
					}
					throw new Error(`Error fetching MusicBrainz albums: ${data}`);
				}
				mbAlbums = [...mbAlbums, ...data.releases];
				mbAlbumCount = data["release-count"];
				offset = mbAlbums.length;
				// updateLoadingText(true);
			} catch (error) {
				attempts++;
				console.error("Error fetching albums:", error);
			}
			if (attempts > 3) {
				throw new Error("Failed to MusicBrainz albums");
				break;
			}
		}
	}

	async function fetchMusicBrainzFeaturedAlbums(mbid, full = false) {
		let offset = 0;
		let attempts = 0;
		while (offset < mbFeaturedAlbumCount || mbFeaturedAlbumCount == -1) {
			try {
				const data = await fetchMbArtistFeaturedAlbums(mbid, offset, full);
				if (typeof data == "number") {
					if (data == 404) {
						throw new Error(404);
					}
					throw new Error(`Error fetching MusicBrainz Featured albums: ${data}`);
				}
				mbAlbums = [...mbAlbums, ...data.releases];
				mbFeaturedAlbumCount = data["release-count"];
				offset = mbAlbums.length;
				// updateLoadingText(true);
			} catch (error) {
				attempts++;
				console.error("Error fetching albums:", error);
			}
			if (attempts > 3) {
				throw new Error("Failed to fetch MusicBrainz Featured albums");
				return;
			}
		}
	}

	function processUrlObject(url) {
		let releases = [];
		let urlId = url.id;
		let urlResaource = url.resource;
		for (let relation of url.relations) {
			let release = relation.release;
			if (release) {
				release.relations = [
					{
						url: {
							resource: urlResaource,
							id: urlId,
						},
					},
				];
				releases.push(release);
			}
		}
		return releases;
	}

	async function fetchMusicBrainzAlbumsBySourceUrls(sourceAlbumUrls) {
		let offset = 0;
		let attempts = 0;
		while (offset < sourceAlbumUrls.length) {
			let currentUrls = sourceAlbumUrls.slice(offset, offset + 100);
			try {
				const data = await getBySourceAlbumLink(currentUrls);
				if (typeof data == "number") {
					if (data == 404) {
						throw new Error(404);
					}
					throw new Error(`Error fetching MusicBrainz albums by source URLs: ${data}`);
				}
				mbAlbums = [...mbAlbums, ...data.urls?.flatMap((url) => processUrlObject(url))];
				offset += 100;
			} catch (error) {
				attempts++;
				console.error("Error fetching albums:", error);
			}
			if (attempts > 3) {
				throw new Error("Failed to fetch MusicBrainz albums by URL");
				return;
			}
		}
	}

	try {
		var { spotifyId, mbid } = req.query;
		// Check for 'quick' or 'full' in the query string
		const quick = Object.prototype.hasOwnProperty.call(req.query, "quick");
		const full = Object.prototype.hasOwnProperty.call(req.query, "full");
		const raw = Object.prototype.hasOwnProperty.call(req.query, "raw");
		if (!spotifyId || !spotify.validateSpotifyId(spotifyId)) {
			return res.status(400).json({ error: "Parameter `spotifyId` is missing or malformed" });
		} else {
			spotifyId = spotify.extractSpotifyIdFromUrl(spotifyId);
		}

		if (mbid & !musicbrainz.validateMBID(mbid) || (!quick && !mbid)) {
			return res.status(400).json({ error: "Parameter `mbid` is missing or malformed" });
		}

		if (quick) {
			await fetchSpotifyAlbums([spotifyId]);
			await fetchMusicBrainzAlbumsBySourceUrls(getSourceAlbumUrls());
		} else {
			await Promise.all([fetchSpotifyAlbums([spotifyId]), fetchMusicbrainzArtistAlbums(mbid, full), fetchMusicBrainzFeaturedAlbums(mbid, full)]);
		}
		if (raw) {
			return res.status(200).json({ sourceAlbums: sourceAlbums, mbAlbums: mbAlbums });
		}
		logger.debug("Processing data");
		let data = await processData(sourceAlbums, mbAlbums, mbid, quick, full);
		res.status(200).json(data);
	} catch (error) {
		logger.error("Error in CompareArtistAlbums API", error);
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}
