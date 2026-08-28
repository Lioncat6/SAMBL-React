import { AlbumObject, ExtendedAlbumObject, ExtendedTrackObject, FullProviderNamespace, PartialArtistObject, ProviderNamespace, TrackObject } from "../types/provider-types";
import { AggregatedAlbum, AggregatedData, AggregatedMedium, AggregatedTrack, AlbumStack, AlbumIssue, AlbumMatch, AlbumStatus, BasicTrack, TrackIssue, TrackStatus } from "../types/aggregated-types";
import text from "./text";
import parsers from "../lib/parsers/parsers";
import medium from "./medium";

export default function processData(sourceAlbums: AlbumObject[], providerAlbums: AlbumObject[] | undefined, targetAlbums: ExtendedAlbumObject[], provider: ProviderNamespace, currentArtist?: PartialArtistObject | null, quick = false, full = false, aggregateSourceTracks = false): AggregatedData {
	let albumData: AlbumStack[] = [];
	let sourceIdsArray: string[] = [];
	let green = 0;
	let red = 0;
	let orange = 0;
	let blue = 0;
	let total = 0;

	const parser = parsers.getParser(provider);

	// Map of Streaming service URLs to MB Albums
	let targetIdAlbumMap: Map<string, ExtendedAlbumObject[]> = new Map();

	targetAlbums.forEach((mbAlbum) => {
		if (!mbAlbum?.externalUrls) return;
		(mbAlbum.externalUrls || []).forEach((url) => {
			const id = parser.parseUrl(url)?.id;
			if (!id) return
			if (!targetIdAlbumMap.has(id)) targetIdAlbumMap.set(id, []);
			targetIdAlbumMap.get(id)?.push(mbAlbum);
		});
	});

	//Map of UPCs to MB Albums

	let targetUPCAlbumMap: Map<string, ExtendedAlbumObject[]> = new Map();

	targetAlbums.forEach((mbAlbum) => {
		const rawUPC = mbAlbum.upc;
		if (!rawUPC || text.removeLeadingZeros(rawUPC) == 0) return;
		const formattedUPC = text.removeLeadingZeros(rawUPC).toString();
		if (formattedUPC && formattedUPC != "") {
			if (!targetUPCAlbumMap.has(formattedUPC)) targetUPCAlbumMap.set(formattedUPC, []);
			targetUPCAlbumMap.get(formattedUPC)?.push(mbAlbum);
		}
	})

	// Map of normalized release names
	let targetNameAlbumMap: Map<string, ExtendedAlbumObject[]> = new Map();

	targetAlbums.forEach((mbAlbum) => {
		if (!mbAlbum?.name) return;
		const normalizedTitle = text.normalizeText(mbAlbum.name || "");
		if (normalizedTitle) {
			if (!targetNameAlbumMap.has(normalizedTitle)) targetNameAlbumMap.set(normalizedTitle, []);
			targetNameAlbumMap.get(normalizedTitle)?.push(mbAlbum);
		}
	});

	sourceAlbums.forEach((album) => {
		let albumStatus: AlbumStatus = "red" as AlbumStatus;
		let albumMBUrl = "";

		//Provider data
		let provider = album.provider;
		let providerId = album.id;
		let providerAlbumName = album.name;
		let providerUrl = album.url;
		let providerAlbumImage = album.imageUrl || "";
		let providerAlbumImageSmall = album.imageUrlSmall || providerAlbumImage;
		let providerAlbumArtists = album.albumArtists;
		let providerArtistNames = album.artistNames;
		let providerReleaseDate = album.releaseDate;
		let providerTrackCount = album.trackCount;
		let providerMediumCount = album.mediums.length;
		let providerAlbumType = album.albumType;
		let providerBarcode = album.upc || null;
		let providerMediums = album.mediums || [];
		let providerTracks = album.mediums.flatMap(medium => medium.tracks) || [];
		let providerGenres = album.genres;
		let providerCopyrights = album.copyrights;
		let providerLabels = album.labels;

		let targetTrackCount: number | null = 0;
		let targetMediumCount: number | null = 0;
		let mbReleaseDate: string | null = "";
		let mbid = "";
		let finalHasCoverArt = false;
		let albumIssues: AlbumIssue[] = [];
		let finalTracks: ExtendedTrackObject[] = [];
		let finalAlbum: ExtendedAlbumObject | null = null as ExtendedAlbumObject | null; //Typescript, why must you be like this
		let mbBarcode: string | null = "";

		function tryMap(map: Map<String, ExtendedAlbumObject[]>, input: string, status: AlbumStatus) {
			if (input && map.has(input)) {
				const matches = map.get(input) || [];
				for (const targetAlbum of matches) {
					if (!targetAlbum?.name) continue;
					const localTargetTrackCount = targetAlbum.trackCount;
					const localTargetMediumCount = targetAlbum.mediums.length;
					const localTargetReleaseDate = targetAlbum.releaseDate;
					const targetReleaseUPC = targetAlbum.upc;
					const hasCoverArt = targetAlbum.hasImage;
					let targetMediums = targetAlbum.mediums;;
					let targetTracks = targetAlbum.mediums.flatMap(medium => medium.tracks);

					albumStatus = status;
					mbid = targetAlbum.id;
					albumMBUrl = `https://musicbrainz.org/release/${mbid}`;
					targetTrackCount = localTargetTrackCount;
					targetMediumCount = localTargetMediumCount;
					mbReleaseDate = localTargetReleaseDate;
					finalHasCoverArt = hasCoverArt;
					finalTracks = targetTracks;
					finalAlbum = targetAlbum;
					mbBarcode = targetReleaseUPC;
					// prefer the first exact URL match
					if (targetAlbum.trackCount == providerTrackCount && (providerBarcode ? (targetReleaseUPC == providerBarcode) : true)) {
						break; //Break if match is good enough, keep looping if not
					}
				}
			}
		}

		// Try URL map
		const sourceUrl = providerUrl.url?.trim();
		tryMap(targetIdAlbumMap, parser.parseUrl(sourceUrl)?.id || providerId, "green")

		// Try UPC map
		if (albumStatus == "red" && providerBarcode) {
			const formattedUPC = text.removeLeadingZeros(providerBarcode).toString()
			if (formattedUPC != "") {
				tryMap(targetUPCAlbumMap, formattedUPC, "blue")
			}
		}

		// Try name map
		if (albumStatus == "red") {
			const normalized = text.normalizeText(providerAlbumName || "");
			tryMap(targetNameAlbumMap, normalized, "orange")
		}

		// TODO: Figure out a way to do this client side
		// const allProviders = providers.getAllProviders(["config"]);
		// const alwaysBarcodeProviders: ProviderNamespace[] = allProviders.filter((provider) => provider.config.capabilities.upcs?.availability == "always").map((provider) => provider.namespace)
		// const alwaysISRCProviders: ProviderNamespace[] = allProviders.filter((provider) => provider.config.capabilities.isrcs?.availability == "always").map((provider) => provider.namespace)

		const alwaysBarcodeProviders: ProviderNamespace[] = ["spotify", "deezer", "tidal", "applemusic"]
		const alwaysISRCProviders: ProviderNamespace[] = ["spotify", "deezer", "tidal", "applemusic"]

		let mbTrackNames: string[] = [];
		let mbTrackISRCs: BasicTrack[] = [];
		let mbAlignedISRCs: (string[] | null)[] = [];
		let mbISRCs: string[] = [];
		let tracksWithoutISRCs: string[] = [];
		for (let track in finalTracks) {
			if (!finalTracks[track]) continue;
			let titleString = finalTracks[track].name;
			let ISRCs = finalTracks[track].isrcs;
			mbAlignedISRCs.push(ISRCs || null)
			if (ISRCs.length < 1) {
				tracksWithoutISRCs.push(track);
			} else {
				mbISRCs.push(...ISRCs);
			}
			mbTrackNames.push(titleString);
			mbTrackISRCs.push({ name: titleString, isrcs: ISRCs });
		}
		let providerHasISRCs = false;
		let hasMatchingISRCs = true;
		let albumTrackISRCs: (string | null)[] = []
		for (let track in providerTracks) {
			const currentTrack = providerTracks[track];
			if (!currentTrack.trackNumber) currentTrack.trackNumber = Number(track) + 1
			if (currentTrack.isrcs) {
				if (currentTrack.isrcs[0] != null && currentTrack.isrcs[0] != undefined) {
					providerHasISRCs = true;
				}
				albumTrackISRCs.push(currentTrack.isrcs[0] || null);
				if (providerHasISRCs && !mbAlignedISRCs[track]?.includes(currentTrack.isrcs[0])) {
					hasMatchingISRCs = false;
				}
			} else {
				albumTrackISRCs.push(null)
			}
		}

		let aggregateTracks = true;

		if (albumStatus != "red") {
			if ((!mbBarcode || mbBarcode == null) && (providerBarcode || alwaysBarcodeProviders.includes(provider))) {
				albumIssues.push("noUPC");
			} else if (providerBarcode && providerBarcode.replace(/^0+/, '') != mbBarcode?.replace(/^0+/, '')) {
				albumIssues.push("UPCDiff")
			}
			if (tracksWithoutISRCs.length > 0 && (providerHasISRCs || alwaysISRCProviders.includes(provider))) {
				albumIssues.push("missingISRCs");
			} else if (!hasMatchingISRCs && aggregateTracks) {
				albumIssues.push("ISRCDiff")
			}
			if (targetTrackCount && (targetTrackCount != providerTrackCount) && providerTrackCount != null) {
				aggregateTracks = false;
				albumIssues.push("trackDiff");
			}
			if (mbReleaseDate == "" || mbReleaseDate == undefined || !mbReleaseDate) {
				albumIssues.push("noDate");
			} else if (mbReleaseDate != providerReleaseDate) {
				albumIssues.push("dateDiff");
			}
			if (!finalHasCoverArt && !quick) {
				albumIssues.push("noCover");
			}
		}

		if (!finalTracks || !providerTracks || finalTracks.length == 0 || providerTracks.length == 0 || finalTracks.length != providerTracks.length || !finalTracks[0] || !providerTracks[0] || providerTracks.some((track) => !track.url)) {
			aggregateTracks = false;
		}
		//Track Aggregation3
		let aggregatedMediums: AggregatedMedium[] = [];
		if (aggregateTracks) {
			for (const medium of providerMediums) {
				let aggregatedTracks: AggregatedTrack[] = [];
				for (let i = 0; i < medium.tracks.length; i++) {
					let trackIssues: TrackIssue[] = [];
					let providerTrack = medium.tracks[i];
					let mbTrack = finalTracks[i] || null;
					let status: TrackStatus = "orange";
					// export type TrackIssue = 'noISRC' | 'ISRCDiff' | 'noUrl' | 'noDuration' | "artistDiff"
					const shouldHaveISRC = (providerTrack.isrcs && providerTrack.isrcs.length > 0);
					if (shouldHaveISRC) {
						if (!mbTrack.isrcs || mbTrack.isrcs.length < 1) {
							trackIssues.push("noISRC");
						} else if (mbTrack) {
							const mbISRCsForTrack = mbTrack.isrcs || [];
							if (!mbISRCsForTrack.includes(providerTrack.isrcs[0] || "")) {
								trackIssues.push("ISRCDiff");
							}
						}
					}

					if (providerTrack.isrcs.some(isrc => mbTrack.isrcs.includes(isrc))) {
						status = "blue";
					}

					if (mbTrack.externalUrls?.includes(providerTrack.url?.url || "")) {
						status = "green";
					}

					if (!mbTrack.duration || mbTrack.duration == 0) {
						trackIssues.push("noDuration");
					}
					// if artist diff
					let providerArtistNamesSet = new Set(providerTrack.artistNames.map(name => text.normalizeText(name)));
					let mbArtistNamesSet = new Set<string>();
					if (mbTrack && mbTrack.trackArtists) {
						mbTrack.trackArtists.forEach(artist => {
							mbArtistNamesSet.add(text.normalizeText(artist.name));
						});
					}
					let artistDiff = false;
					if (providerArtistNamesSet.size != mbArtistNamesSet.size) {
						artistDiff = true;
					} else {
						providerArtistNamesSet.forEach(name => {
							if (!mbArtistNamesSet.has(name)) {
								artistDiff = true;
							}
						});
					}
					if (artistDiff) {
						trackIssues.push("artistDiff");
					}

					aggregatedTracks.push({
						status: status,
						...providerTrack,
						mbid: mbTrack ? mbTrack.id : null,
						// sourceArtist: currentArtist || null,
						trackIssues: trackIssues,
						isrcs: providerTrack.isrcs.length > 0 ? providerTrack.isrcs : mbTrack.isrcs.length > 0 ? mbTrack.isrcs : [],
						trackNumber: providerTrack.trackNumber || mbTrack.trackNumber || Number(i) + 1
					});
				}
				aggregatedMediums.push({
					...medium,
					tracks: aggregatedTracks
				})
			}
		}

		if (!sourceIdsArray.find((a) => a === provider + providerId)) { //Deduplicate; Will eventually support multiple providers in once comparison, so we probably don't want to have collisions if two different streaming services use the same ID for some reason
			let albumMatches: AlbumMatch[] = []
			albumMatches.push({
				type: "source",
				album: album
			})
			if (finalAlbum) {
				albumMatches.push({
					type: "target",
					album: finalAlbum
				})
			}
			total++;
			if (albumStatus == "green") {
				green++;
			} else if (albumStatus == "orange") {
				orange++;
			} else if (albumStatus == "blue") {
				blue++;
			} else {
				red++;
			}
			sourceIdsArray.push(provider + providerId);
			albumData.push({
				albumIssues,
				status: albumStatus,
				aggregated: {
					provider: provider,
					id: providerId,
					name: providerAlbumName,
					url: providerUrl,
					imageUrl: providerAlbumImage,
					imageUrlSmall: providerAlbumImageSmall,
					albumArtists: providerAlbumArtists,
					artistNames: providerArtistNames,
					releaseDate: providerReleaseDate,
					trackCount: providerTrackCount,
					albumType: providerAlbumType,
					upc: providerBarcode,
					mediums: aggregatedMediums,
					mbid,
					sourceArtist: currentArtist || null,
					labels: providerLabels,
					copyrights: providerCopyrights,
					genres: providerGenres,
					type: "album"
				},
				albums: albumMatches
			});
		}
	});

	let statusText = `Albums on MusicBrainz: ${green}/${total} ~ ${orange} albums have matching names but no associated link`;
	return {
		albumData,
		statusText,
		green,
		orange,
		blue,
		red,
		total,
	};
}
