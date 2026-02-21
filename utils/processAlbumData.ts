import { AlbumObject, ExtendedAlbumObject, ExtendedTrackObject, FullProviderNamespace, ProviderNamespace, TrackObject } from "../types/provider-types";
import { AggregatedAlbum, AggregatedData, AggregatedTrack, AlbumIssue, AlbumStatus, BasicTrack, TrackIssue, TrackStatus } from "../types/aggregated-types";
import text from "./text";
import parsers from "../lib/parsers/parsers";

export default function processData(sourceAlbums: AlbumObject[], mbAlbums: ExtendedAlbumObject[], currentArtistMBID: string | null = null, currentArtistID: string | null = null, provider: ProviderNamespace, quick = false, full = false ): AggregatedData {
	let albumData: AggregatedAlbum[] = [];
	let green = 0;
	let red = 0;
	let orange = 0;
	let blue = 0;
	let total = 0;

	const parser = parsers.getParser(provider);

	// Map of Streaming service URLs to MB Albums
	let mbIdAlbumMap: Map<string, ExtendedAlbumObject[]> = new Map();

	mbAlbums.forEach((mbAlbum) => {
		if (!mbAlbum?.externalUrls) return;
		(mbAlbum.externalUrls || []).forEach((url) => {
			const id = parser.parseUrl(url)?.id;
			if (!id) return
			if (!mbIdAlbumMap.has(id)) mbIdAlbumMap.set(id, []);
			mbIdAlbumMap.get(id)?.push(mbAlbum);
		});
	});

	//Map of UPCs to MB Albums

	let mbUPCAlbumMap: Map<string, ExtendedAlbumObject[]> = new Map();

	mbAlbums.forEach((mbAlbum) => {
		const rawUPC = mbAlbum.upc;
		if (!rawUPC || text.removeLeadingZeros(rawUPC) == 0) return;
		const formattedUPC = text.removeLeadingZeros(rawUPC).toString();
		if (formattedUPC && formattedUPC != "") {
			if (!mbUPCAlbumMap.has(formattedUPC)) mbUPCAlbumMap.set(formattedUPC, []);
			mbUPCAlbumMap.get(formattedUPC)?.push(mbAlbum);
		}
	})

	// Map of normalized release names
	let mbNameAlbumMap: Map<string, ExtendedAlbumObject[]> = new Map();

	mbAlbums.forEach((mbAlbum) => {
		if (!mbAlbum?.name) return;
		const normalizedTitle = text.normalizeText(mbAlbum.name || "");
		if (normalizedTitle) {
			if (!mbNameAlbumMap.has(normalizedTitle)) mbNameAlbumMap.set(normalizedTitle, []);
			mbNameAlbumMap.get(normalizedTitle)?.push(mbAlbum);
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
		let providerAlbumType = album.albumType;
		let providerBarcode = album.upc || null;
		let providerTracks = album.albumTracks || [];

		let mbTrackCount: number | null = 0;
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
				for (const mbAlbum of matches) {
					if (!mbAlbum?.name) continue;
					const MBTrackCount = mbAlbum.trackCount;
					const MBReleaseDate = mbAlbum.releaseDate;
					const MBReleaseUPC = mbAlbum.upc;
					const hasCoverArt = mbAlbum.hasImage;
					let MBTracks = mbAlbum.albumTracks;

					albumStatus = status;
					mbid = mbAlbum.id;
					albumMBUrl = `https://musicbrainz.org/release/${mbid}`;
					mbTrackCount = MBTrackCount;
					mbReleaseDate = MBReleaseDate;
					finalHasCoverArt = hasCoverArt;
					finalTracks = MBTracks;
					finalAlbum = mbAlbum;
					mbBarcode = MBReleaseUPC;
					// prefer the first exact URL match
					break;
				}
			}
		}

		// Try URL map
		const sourceUrl = providerUrl?.trim();
		tryMap(mbIdAlbumMap, parser.parseUrl(sourceUrl)?.id || providerId, "green")

		// Try UPC map
		if (albumStatus == "red" && providerBarcode) {
			const formattedUPC = text.removeLeadingZeros(providerBarcode).toString()
			if (formattedUPC != ""){
				tryMap(mbUPCAlbumMap, formattedUPC, "blue")
			}
		}

		// Try name map
		if (albumStatus == "red") {
			const normalized = text.normalizeText(providerAlbumName || "");
			tryMap(mbNameAlbumMap, normalized, "orange")
		}

		const alwaysBarcodeProviders: ProviderNamespace[] = ["spotify", "deezer", "tidal", "applemusic"]
		const alwaysISRCProviders: ProviderNamespace[] = ["spotify", "deezer", "tidal", "applemusic"]

		let mbTrackNames: string[] = [];
		let mbTrackISRCs: BasicTrack[] = [];
		let mbAlignedISRCs: (string | null)[] = [];
		let mbISRCs: string[] = [];
		let tracksWithoutISRCs: string[] = [];
		for (let track in finalTracks) {
			if (!finalTracks[track]) continue;
			let titleString = finalTracks[track].name;
			let ISRCs = finalTracks[track].isrcs;
			mbAlignedISRCs.push(ISRCs[0] || null)
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
				if (providerHasISRCs && (currentTrack.isrcs[0] || null) != mbAlignedISRCs[track]) {
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
			} else if (!hasMatchingISRCs) {
				albumIssues.push("ISRCDiff")
			}
			if (mbTrackCount != providerTrackCount && !quick && full) {
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
		//Track Aggregation
		let aggregatedTracks: AggregatedTrack[] = [];
		if (aggregateTracks) {
			for (let i = 0; i < providerTracks.length; i++) {
				let trackIssues: TrackIssue[] = [];
				let providerTrack = providerTracks[i];
				let mbTrack = finalTracks[i] || null;
				let status : TrackStatus = "orange";
				


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

				if (mbTrack.externalUrls?.includes(providerTrack.url || "")) {
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
					artistMBID: currentArtistMBID,
					mbTrack: mbTrack,
					trackIssues: trackIssues,
					isrcs: providerTrack.isrcs.length > 0 ? providerTrack.isrcs : mbTrack.isrcs.length > 0 ? mbTrack.isrcs : [],
					trackNumber: providerTrack.trackNumber || mbTrack.trackNumber || Number(i)
				});
			}
		}

		if (!albumData.find((a) => a.id === providerId)) { //Deduplicate
			total++;
			if (albumStatus == "green") {
				green++;
			} else if (albumStatus == "orange") {
				orange++;
			} else if (albumStatus == "blue") {
				blue++;
			} else {
				red++;
			} hasMatchingISRCs
			albumData.push({
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
				status: albumStatus,
				mbAlbum: finalAlbum,
				upc: providerBarcode,
				albumTracks: providerTracks,
				mbid,
				artistMBID: currentArtistMBID,
				artistID: currentArtistID,
				albumIssues,
				aggregatedTracks: aggregatedTracks
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
