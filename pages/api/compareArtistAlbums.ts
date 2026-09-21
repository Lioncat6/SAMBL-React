import musicbrainz from "../../lib/providers/musicbrainz";
import processData from "../../utils/processAlbumData";
import logger from "../../utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
import { AlbumData, AlbumObject, ArtistObject, ExtendedAlbumObject, ProviderWithCapabilities, RawAlbumData } from "../../types/provider-types";
import { IUrl } from "musicbrainz-api";
import normalizeVars from "../../utils/normalizeVars";
import { SAMBLAPIResponse } from "../../types/api-types";
import providers from "../../lib/providers/providers";
import { AggregatedData, RawAggregateData } from "../../types/aggregated-types";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";
import { SAMBLFetch } from "../../utils/clientAPIHandler";

// spotifyId - Spotify artist ID
// mbid - MusicBrainz artist ID. Only neccesary if you want to check if the associated albums are linked to that artist
// quick - Uses URL matching to check for spotify album links in MusicBrainz. This returns faster, but contains less information, removing the orange album status.
// full - adds inc parameters to the MusicBrainz query. (Does not affect quick mode)

async function fetchMbArtistAlbums(mbid, offset = 0, full = false) {
	return await musicbrainz.getMBArtistAlbums(mbid, offset, 100, full ? ["url-rels", "recordings", "isrcs", "recording-level-rels", "artist-credits", "label-rels", "artist-rels"] : ["url-rels"]);
}

async function fetchMbArtistFeaturedAlbums(mbid, offset = 0, full = false) {
	return await musicbrainz.getArtistFeaturedAlbums(mbid, offset, 100, full ? ["url-rels", "recordings", "isrcs", "recording-level-rels", "artist-credits", "label-rels", "artist-rels"] : ["url-rels"]);
}

async function getBySourceAlbumLink(links: string[]) {
	return await musicbrainz.getAlbumsBySourceUrls(links, ["release-rels"]);
}



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	let sourceAlbumCount = -1;
	let mbAlbumCount = -1;
	let mbFeaturedAlbumCount = -1;
	let mbUrlCount = -1;
	let sourceAlbums: AlbumObject[] = [];
	let mbAlbums: ExtendedAlbumObject[] = [];
	let mbFeaturedAlbums: ExtendedAlbumObject[] = [];

	function getSourceAlbumUrls() {
		return sourceAlbums.map((album) => {
			return album.url;
		});
	}

	async function fetchProviderAlbums(providerIds: string[], provider: ProviderWithCapabilities<["getArtistAlbums", "formatAlbumGetData", "formatAlbumObject"]>, bypassCache = false) {
		let attempts = 0;
		for (const pid of providerIds) {
			let offset: string | number | null = 0;
			let currentAlbumCount = 999;
			let fetchedAlbums = 0;
			while (offset != null) {
				try {
					// const data = await fetchSourceAlbums(pid, provider, offset, bypassCache);
					const rawData = await provider.getArtistAlbums(pid, offset, 100, { noCache: true })
					let data: RawAlbumData = provider.formatAlbumGetData(rawData);
					let formattedData: AlbumData = {
						...data,
						albums: data.albums.map(album => provider.formatAlbumObject(album))
					}
					sourceAlbums = [...sourceAlbums, ...formattedData.albums];
					fetchedAlbums += formattedData.albums.length;
					currentAlbumCount = formattedData.count || 0;
					if (sourceAlbumCount < 0) {
						sourceAlbumCount = currentAlbumCount;
					}
					offset = formattedData.next;
				} catch (error) {
					attempts++;
					console.error("Error fetching albums:", error);
				}
				if (attempts > 3) {
					logger.error("Failed to fetch Spotify albums");
					break;
				}
			}
			sourceAlbumCount += currentAlbumCount;
		}
	}

	async function fetchMusicbrainzArtistAlbums(mbid: string, full = false) {
		let offset = 0;
		let attempts = 0;
		while (offset < mbAlbumCount || mbAlbumCount == -1) {
			try {
				const data = await fetchMbArtistAlbums(mbid, offset, full);
				if (typeof data == "number") {
					if (data == 404) {
						throw new Error("404");
					}
					throw new Error(`Error fetching MusicBrainz albums: ${data}`);
				}
				const formattedData = musicbrainz.formatAlbumGetData(data);
				mbAlbums = [...mbAlbums, ...formattedData.albums];
				mbAlbumCount = formattedData.count || 0;
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

	async function fetchMusicBrainzFeaturedAlbums(mbid: string, full = false) {
		let offset = 0;
		let attempts = 0;
		while (offset < mbFeaturedAlbumCount || mbFeaturedAlbumCount == -1) {
			try {
				const data = await fetchMbArtistFeaturedAlbums(mbid, offset, full);
				if (typeof data == "number") {
					if (data == 404) {
						throw new Error("404");
					}
					throw new Error(`Error fetching MusicBrainz Featured albums: ${data}`);
				}
				const formattedData = musicbrainz.formatAlbumGetData(data);
				mbFeaturedAlbums = [...mbFeaturedAlbums, ...formattedData.albums];
				mbFeaturedAlbumCount = formattedData.count || 0;
				offset = mbFeaturedAlbums.length;
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

	function processUrlObject(url: IUrl): ExtendedAlbumObject[] {
		let releases: ExtendedAlbumObject[] = [];
		let urlId = url.id;
		let urlResource = url.resource;
		if (url.relations) {
			for (let relation of url.relations) {
				let release = relation.release;
				if (release) {
					release.relations = [
						{
							url: {
								resource: urlResource,
								id: urlId
							},
							direction: "forward",
							"target-type": "url",
							end: null,
							ended: false,
							"attributes": [],
							"target-credit": "",
							"type": "free streaming",
							"begin": null,
							"source-credit": "",
							"type-id": "08445ccf-7b99-4438-9f9a-fb9ac18099ee",
							"attribute-ids": {} as unknown[],
							"attribute-values": {} as unknown[],
						},
					];
					releases.push(musicbrainz.formatAlbumObject(release));
				}
			}
		}
		return releases;
	}

	async function fetchMusicBrainzAlbumsBySourceUrls(sourceAlbumUrls: string[]) {
		let offset = 0;
		let attempts = 0;
		while (offset < sourceAlbumUrls.length) {
			let currentUrls = sourceAlbumUrls.slice(offset, offset + 100);
			try {
				const data = await getBySourceAlbumLink(currentUrls);
				if (typeof data == "number") {
					if (data == 404) {
						throw new Error("404");
					}
					throw new Error(`Error fetching MusicBrainz albums by source URLs: ${data}`);
				}
				if (data) {
					let urls = data.urls;
					mbAlbums = [...mbAlbums, ...data.urls?.flatMap((url) => processUrlObject(url))];
				}
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

	const stages = new Stages()
	const api = new ServerAPIHandler('compareArtistAlbums', res, stages, ['provider_id', 'provider', 'mbid', 'quick', 'full', 'raw']);
	try {
		var { provider_id, provider, mbid } = normalizeVars(req.query);
		// Check for 'quick' or 'full' in the query string
		const quick = Object.prototype.hasOwnProperty.call(req.query, "quick");
		const full = Object.prototype.hasOwnProperty.call(req.query, "full");
		const raw = Object.prototype.hasOwnProperty.call(req.query, "raw");
		if (!provider_id || !provider) {
			return api.response(400, { error: { error: "Parameters `provider_id` and `provider` are required!", parameters: ['provider_id', 'provider'] } });
		}

		if ((mbid && !musicbrainz.validateMBID(mbid)) || (!quick && !mbid)) {
			return api.response(400, { error: { error: "Parameter `mbid` is missing or malformed!", parameters: ['mbid'] } });
		}

		const sourceProvider = providers.parseProvider(provider, ["getArtistAlbums", "formatAlbumGetData", "formatAlbumObject", "getArtistById", "formatArtistObject"])

		if (!sourceProvider) {
			return api.response(400, { error: { error: `Provider ${provider} doesn't support this operation!` } });
		}

		let sourceArtist: ArtistObject | null = null;

		stages.start("Get source artist by ID", sourceProvider.namespace);
		const rawArtist = await sourceProvider.getArtistById(provider_id);
		stages.end("Get source artist by ID");
		if (rawArtist) {
			sourceArtist = sourceProvider.formatArtistObject(rawArtist)
		} else {
			return api.response(404, {error: {error: "Artist not found", provider: sourceProvider.namespace}})
		}

		if (quick) {
			stages.start("Fetching source albums", sourceProvider.namespace)
			await fetchProviderAlbums([provider_id], sourceProvider);
			stages.end("Fetching source albums")
			stages.start("Fetching target albums", 'musicbrainz')
			await fetchMusicBrainzAlbumsBySourceUrls(getSourceAlbumUrls().map((url) => url.url));
			stages.end("Fetching target albums")
		} else {
			if (!mbid) {
				return api.response(400, { error: { error: "Parameter `mbid` is required when not using `quick`", parameters: ['mbid'] } })
			}
			await Promise.all([fetchProviderAlbums([provider_id], sourceProvider), fetchMusicbrainzArtistAlbums(mbid, full), fetchMusicBrainzFeaturedAlbums(mbid, full)]);
		}
		if (raw) {
			return api.response<RawAggregateData>(200, { data: { sourceAlbums: sourceAlbums, targetAlbums: mbAlbums, targetFeaturedAlbums: mbFeaturedAlbums } })
		}
		stages.start('Process album data')
		let data = processData(sourceAlbums, undefined, [...mbAlbums, ...mbFeaturedAlbums], sourceProvider.namespace, sourceArtist, quick, full);
		stages.end('Process album data')
		api.response<AggregatedData>(200, { data })
	} catch (error) {
		logger.error("Error in CompareArtistAlbums API", error);
		api.response(500, { error: { error: "Internal Server Error", details: error.message } });
	}
}
