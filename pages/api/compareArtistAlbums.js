import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";

import normalizeText from "../../utils/normalizeText";
import logger from "../../utils/logger";
// spotifyId - Spotify artist ID
// mbid - MusicBrainz artist ID. Only neccesary if you want to check if the associated albums are linked to that artist
// quick - Uses URL matching to check for spotify album links in MusicBrainz. This returns faster, but contains less information, removing the orange album status.
// full - adds inc parameters to the MusicBrainz query. (Does not affect quick mode)

async function fetchSourceAlbums(artistId, offset = 0) {
	return await spotify.getArtistAlbums(artistId, offset, 50);
}

async function fetchMbArtistAlbums(mbid, offset = 0, full = false) {
	return await musicbrainz.getArtistAlbums(mbid, offset, 100, full ? ["url-rels", "recordings", "isrcs"] : []);
}

async function fetchMbArtistFeaturedAlbums(mbid, offset = 0, full = false) {
	return await musicbrainz.getArtistFeaturedAlbums(mbid, offset, 100, full ? ["url-rels", "recordings", "isrcs"] : []);
}

async function getBySourceAlbumLink(links) {
	return await musicbrainz.getAlbumsBySourceUrls(links, ["release-rels"]);
}

function processData(sourceAlbums, mbAlbums, quick = false) {
	let albumData = [];
	let green = 0;
	let red = 0;
	let orange = 0;
	let total = 0;

	sourceAlbums.forEach((album) => {
		let albumStatus = "red";
		let albumMBUrl = "";
		let spotifyId = album.id;
		let spotifyName = album.name;
		let spotifyUrl = album.external_urls.spotify;
		let spotifyImageURL = album.images[0]?.url || "";
		let spotifyImageURL300px = album.images[1]?.url || spotifyImageURL;
		let spotifyAlbumArtists = album.artists;
		let spotifyArtistNames = album.artists.map((artist) => artist.name);
		let spotifyReleaseDate = album.release_date;
		let spotifyTrackCount = album.total_tracks;
		let spotifyAlbumType = album.album_type;

		let mbTrackCount = 0;
		let mbReleaseDate = "";
		let mbid = "";
		let finalHasCoverArt = false;
		let albumIssues = [];
		let finalTracks = [];
		let mbBarcode = "";
		mbAlbums.forEach((mbAlbum) => {
			let mbReleaseName = mbAlbum.title;
			let mbReleaseUrls = mbAlbum.relations || [];
			let MBTrackCount = mbAlbum.media?.reduce((count, media) => count + media["track-count"], 0);
			let MBReleaseDate = mbAlbum.date;
			let MBReleaseUPC = mbAlbum.barcode;
			let hasCoverArt = mbAlbum["cover-art-archive"]?.front || false;
			var MBTracks = [];
			mbAlbum.media?.forEach((media) => {
				if (media.tracks) {
					MBTracks = [...MBTracks, ...media.tracks];
				}
			});
			mbReleaseUrls.forEach((relation) => {
				if (relation.url.resource == spotifyUrl) {
					albumStatus = "green";
					mbid = mbAlbum.id;
					albumMBUrl = `https://musicbrainz.org/release/${mbid}`;
					mbTrackCount = MBTrackCount;
					mbReleaseDate = MBReleaseDate;
					finalHasCoverArt = hasCoverArt;
					finalTracks = MBTracks;
					mbBarcode = MBReleaseUPC;
				}
			});

			if (albumStatus === "red" && normalizeText(mbReleaseName) === normalizeText(spotifyName)) {
				albumStatus = "orange";
				mbid = mbAlbum.id;
				albumMBUrl = `https://musicbrainz.org/release/${mbid}`;
				mbTrackCount = MBTrackCount;
				mbReleaseDate = MBReleaseDate;
				finalHasCoverArt = hasCoverArt;
				finalTracks = MBTracks;
				mbBarcode = MBReleaseUPC;
			}
		});

		let mbTrackNames = [];
		let mbTrackISRCs = [];
		let mbISRCs = [];
		let tracksWithoutISRCs = [];
		for (let track in finalTracks) {
			let titleString = finalTracks[track].title;
			let ISRCs = finalTracks[track].recording.isrcs;
			if (ISRCs.length < 1) {
				tracksWithoutISRCs.push(track);
			} else {
				mbISRCs.push(...ISRCs);
			}
			mbTrackNames.push(titleString);
			mbTrackISRCs.push({ name: titleString, isrcs: ISRCs });
		}

		if (albumStatus != "red") {
			if (!mbBarcode || mbBarcode == null) {
				albumIssues.push("noUPC");
			}
			if ((mbTrackCount != spotifyTrackCount) && !quick) {
				albumIssues.push("trackDiff");
			}
			if (mbReleaseDate == "" || mbReleaseDate == undefined || !mbReleaseDate) {
				albumIssues.push("noDate");
			} else if (mbReleaseDate != spotifyReleaseDate) {
				albumIssues.push("dateDiff");
			}
			if (!finalHasCoverArt && !quick) {
				albumIssues.push("noCover");
			}
			if (tracksWithoutISRCs.length > 0) {
				albumIssues.push("missingISRCs");
			}
		}

		total++;
		if (albumStatus === "green") {
			green++;
		} else if (albumStatus === "orange") {
			orange++;
		} else {
			red++;
		}

		albumData.push({
			spotifyId,
			spotifyName,
			spotifyUrl,
			spotifyImageURL,
			spotifyImageURL300px,
			spotifyAlbumArtists,
			spotifyArtistNames,
			spotifyReleaseDate,
			spotifyTrackCount,
			spotifyAlbumType,
			albumStatus,
			albumMBUrl,
			mbTrackCount,
			mbReleaseDate,
			mbid,
			albumIssues,
			mbTrackNames,
			mbISRCs,
			mbTrackISRCs,
			tracksWithoutISRCs,
			mbBarcode,
		});
	});

	let statusText = `Albums on MusicBrainz: ${green}/${total} ~ ${orange} albums have matching names but no associated link`;
	return {
		albumData,
		statusText,
		green,
		orange,
		red,
		total,
	};
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
				mbAlbums = [...mbAlbums, ...data.urls.flatMap((url) => (processUrlObject(url)))];
				offset+=100;
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
		let data = await processData(sourceAlbums, mbAlbums, quick);
		res.status(200).json(data);
	} catch (error) {
		logger.error("Error in matchArtistAlbumLinks API", error);
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}
