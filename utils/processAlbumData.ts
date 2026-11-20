import { AlbumObject, ExtendedAlbumObject, FullProviderNamespace, MediumObject, PartialArtistObject, ProviderNamespace, TrackObject } from "../types/provider-types";
import { AggregatedAlbum, AggregatedData, AggregatedMedium, AggregatedTrack, AlbumStack, AlbumIssue, AlbumMatch, AlbumStatus, BasicTrack, TrackIssue, TrackStatus } from "../types/aggregated-types";
import text from "./text";
import parsers from "../lib/parsers/parsers";
import medium from "./medium";
import { DisplayAlbum } from "../types/component-types";

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

	sourceAlbums.forEach((sourceAlbum) => {
		let albumStatus: AlbumStatus = "red" as AlbumStatus;

		//Provider data
		let provider = sourceAlbum.provider;
		let providerId = sourceAlbum.id;
		let providerAlbumName = sourceAlbum.name;
		let providerUrl = sourceAlbum.url;
		let providerAlbumImage = sourceAlbum.imageUrl || "";
		let providerAlbumImageSmall = sourceAlbum.imageUrlSmall || providerAlbumImage;
		let providerAlbumArtists = sourceAlbum.albumArtists;
		let providerArtistNames = sourceAlbum.artistNames;
		let providerReleaseDate = sourceAlbum.releaseDate;
		let providerTrackCount = sourceAlbum.trackCount;
		let providerMediumCount = sourceAlbum.mediums.length;
		let providerAlbumType = sourceAlbum.albumType;
		let providerBarcode = sourceAlbum.upc || null;
		let providerMediums = sourceAlbum.mediums;
		let providerGenres = sourceAlbum.genres;
		let providerCopyrights = sourceAlbum.copyrights;
		let providerLabels = sourceAlbum.labels;
		let albumIssues: AlbumIssue[] = [];
		let matchedTargetAlbum: ExtendedAlbumObject | null = null as ExtendedAlbumObject | null; //Typescript, why must you be like this

		function tryMap(map: Map<String, ExtendedAlbumObject[]>, input: string, status: AlbumStatus) {
			if (input && map.has(input)) {
				const matches = map.get(input) || [];
				for (const albumMatch of matches) {
					albumStatus = status;
					matchedTargetAlbum = albumMatch;
					// prefer the first exact URL match
					if (albumMatch.trackCount == providerTrackCount && (providerBarcode ? (albumMatch.upc == providerBarcode) : true)) {
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

		let aggregatedMediums: AggregatedMedium[] = [];

		if (albumStatus != "red" && matchedTargetAlbum) {

			let aggregateMediums = (matchedTargetAlbum.mediums.length == sourceAlbum.mediums.length);
			if (aggregateMediums) {
				for (const mediumIndex in matchedTargetAlbum.mediums) {
					if (matchedTargetAlbum.mediums[mediumIndex].tracks.length != sourceAlbum.mediums[mediumIndex].tracks.length) aggregateMediums = false;
				}
			}
			const flatTargetTracks = matchedTargetAlbum.mediums.flatMap(medium => medium.tracks);
			const flatSourceTracks = sourceAlbum.mediums.flatMap(medium => medium.tracks);
			

			// Only used if aggregateMediums is false;
			let aggregateTracks = (flatTargetTracks.length > 0 && flatSourceTracks.length > 0 && flatTargetTracks.length == flatSourceTracks.length)

			const alwaysBarcodeProviders: ProviderNamespace[] = ["spotify", "deezer", "tidal", "applemusic"]
			const alwaysISRCProviders: ProviderNamespace[] = ["spotify", "deezer", "tidal", "applemusic"]

			let alignedISRCs: (string[] | null)[][] = [];
			let tracksWithoutISRCs = 0;
			for (let mediumIndex in matchedTargetAlbum.mediums) {
				for (let trackIndex in matchedTargetAlbum.mediums[mediumIndex].tracks) {
					const track = matchedTargetAlbum.mediums[mediumIndex].tracks[trackIndex];
					alignedISRCs[mediumIndex][trackIndex] = track.isrcs.map(isrc => isrc.toUpperCase());
					if (track.isrcs.length == 0) tracksWithoutISRCs++;
				}
			}
			let flatAlignedISRCs = alignedISRCs.flatMap(mediumISRCs => mediumISRCs);
			let providerHasISRCs = false;
			let hasMatchingISRCs = true;
			if (!aggregateMediums) {
				for (let trackIndex in flatSourceTracks) {
					const currentTrack = flatSourceTracks[trackIndex];
					if (currentTrack.isrcs && currentTrack.isrcs.some((isrc) => flatAlignedISRCs[trackIndex]?.includes(isrc))) {
						
					}
				}
			}

			//Track Aggregation3

			if (aggregateTracks) {
				for (const medium of providerMediums) {
					let aggregatedTracks: AggregatedTrack[] = [];
					for (let i = 0; i < medium.tracks.length; i++) {
						let trackIssues: TrackIssue[] = [];
						let sourceTrack = medium.tracks[i];
						let targetTrack = targetTracks[i] || null;
						let status: TrackStatus = "orange";
						// export type TrackIssue = 'noISRC' | 'ISRCDiff' | 'noUrl' | 'noDuration' | "artistDiff"
						const shouldHaveISRC = (sourceTrack.isrcs && sourceTrack.isrcs.length > 0);
						if (shouldHaveISRC) {
							if (!targetTrack.isrcs || targetTrack.isrcs.length < 1) {
								trackIssues.push("noISRC");
							} else if (targetTrack) {
								const mbISRCsForTrack = targetTrack.isrcs || [];
								if (!mbISRCsForTrack.includes(sourceTrack.isrcs[0] || "")) {
									trackIssues.push("ISRCDiff");
								}
							}
						}

						// Force ISRCs lowercase to avoid shenanegains with data sources not normalizing this
						// Granted, this should be normalized in the provider code, but better safe than sorry
						if (sourceTrack.isrcs.some(isrc => targetTrack.isrcs.find(targetISRC => targetISRC.toUpperCase() == isrc.toUpperCase()))) {
							status = "blue";
						}

						if ((sourceTrack.url && targetTrack.externalUrls?.includes(sourceTrack.url?.url)) ||
							targetTrack.externalUrls?.find((url) => {
								const targetUrlID = parser.parseUrl(url)?.id;
								const sourceUrlID = sourceTrack.url ? parser.parseUrl(sourceTrack.url.url)?.id : null
								// Incase of weird shenanegains with mismatching URLs stored in musicbrainz, we parse the external URL and compare its ID too
								// In the case of certain providers having URLs with cosmetic IDs, we check with the parsed source URL ID too
								return (targetUrlID == sourceTrack.id || targetUrlID == sourceUrlID)
							})) {
							status = "green";
						}

						if (!targetTrack.duration || targetTrack.duration == 0) {
							trackIssues.push("noDuration");
						}
						// if artist diff
						let providerArtistNamesSet = new Set(sourceTrack.artistNames.map(name => text.normalizeText(name)));
						let mbArtistNamesSet = new Set<string>();
						if (targetTrack && targetTrack.trackArtists) {
							targetTrack.trackArtists.forEach(artist => {
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
							...sourceTrack,
							mbid: targetTrack ? targetTrack.id : null,
							// sourceArtist: currentArtist || null,
							trackIssues: trackIssues,
							isrcs: sourceTrack.isrcs.length > 0 ? sourceTrack.isrcs : targetTrack.isrcs.length > 0 ? targetTrack.isrcs : [],
							trackNumber: sourceTrack.trackNumber || targetTrack.trackNumber || Number(i) + 1
						});
					}
					aggregatedMediums.push({
						...medium,
						tracks: aggregatedTracks
					})
				}
			}

			if ((!mbBarcode || mbBarcode == null) && (providerBarcode || alwaysBarcodeProviders.includes(provider))) {
				albumIssues.push("noUPC");
			} else if (providerBarcode && providerBarcode.replace(/^0+/, '') != mbBarcode?.replace(/^0+/, '')) {
				albumIssues.push("UPCDiff")
			}
			if (tracksWithoutISRCs > 0 && (providerHasISRCs || alwaysISRCProviders.includes(provider))) {
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

		if (!sourceIdsArray.find((a) => a === provider + providerId)) { //Deduplicate; Will eventually support multiple providers in once comparison, so we probably don't want to have collisions if two different streaming services use the same ID for some reason
			let albumMatches: AlbumMatch[] = []
			albumMatches.push({
				type: "source",
				album: sourceAlbum
			})
			if (matchedTargetAlbum) {
				albumMatches.push({
					type: "target",
					album: matchedTargetAlbum
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
					mbid: matchedTargetAlbum?.mbid,
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
