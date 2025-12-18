import { AlbumObject, ExtendedAlbumObject, TrackObject } from "../pages/api/providers/provider-types";
import { AggregatedAlbum, AlbumIssue, AlbumStatus, BasicTrack } from "./aggregated-types";
import text from "./text";

export default function processData(sourceAlbums: AlbumObject[], mbAlbums: ExtendedAlbumObject[], currentArtistMBID = null, quick = false, full = false) {
	let albumData: AggregatedAlbum[] = [];
	let green = 0;
	let red = 0;
	let orange = 0;
	let total = 0;


	// Map of Stremaing service URLs to MB Albums
	let mbUrlAlbumMap: Map<string, ExtendedAlbumObject[]> = new Map();

	mbAlbums.forEach((mbAlbum) => {
		if (!mbAlbum?.externalUrls) return;
		(mbAlbum.externalUrls || []).forEach((url) => {
			if (!mbUrlAlbumMap.has(url)) mbUrlAlbumMap.set(url, []);
			mbUrlAlbumMap.get(url)?.push(mbAlbum);
		});
	});

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
		let albumStatus: AlbumStatus = "red";
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
		let finalTracks: TrackObject[] = [];
		let finalAlbum: ExtendedAlbumObject | null = null;
		let mbBarcode: string | null = "";
		
		// Try URL map
		const sourceUrl = providerUrl?.trim();
		if (sourceUrl && mbUrlAlbumMap.has(sourceUrl)) {
			const matches = mbUrlAlbumMap.get(sourceUrl) || [];
			for (const mbAlbum of matches) {
				if (!mbAlbum?.name) continue;
				const MBTrackCount = mbAlbum.trackCount;
				const MBReleaseDate = mbAlbum.releaseDate;
				const MBReleaseUPC = mbAlbum.upc;
				const hasCoverArt = mbAlbum.hasImage;
				let MBTracks = mbAlbum.albumTracks;

				albumStatus = "green";
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

		// Try name map
		if (albumStatus === "red") {
			const normalized = text.normalizeText(providerAlbumName || "");
			if (normalized && mbNameAlbumMap.has(normalized)) {
				const matches = mbNameAlbumMap.get(normalized) || [];
				for (const mbAlbum of matches) {
					if (!mbAlbum?.name) continue;
					const MBTrackCount = mbAlbum.trackCount;
					const MBReleaseDate = mbAlbum.releaseDate;
					const MBReleaseUPC = mbAlbum.upc;
					const hasCoverArt = mbAlbum["cover-art-archive"]?.front || false;
					let MBTracks = mbAlbum.albumTracks;

					albumStatus = "orange";
					mbid = mbAlbum.id;
					albumMBUrl = `https://musicbrainz.org/release/${mbid}`;
					mbTrackCount = MBTrackCount;
					mbReleaseDate = MBReleaseDate;
					finalHasCoverArt = hasCoverArt;
					finalTracks = MBTracks;
					finalAlbum = mbAlbum;
					mbBarcode = MBReleaseUPC;
					break;
				}
			}
		}

		const alwaysBarcodeProviders = ["spotify", "deezer", "tidal", "itunes"]
		const alwaysISRCProviders = ["spotify", "deezer", "tidal", "itunes"]
		
		let mbTrackNames: string[] = [];
		let mbTrackISRCs: BasicTrack[] = [];
		let mbAlignedISRCs: (string | null)[] = [];
		let mbISRCs: string[] = [];
		let tracksWithoutISRCs: string[] = [];
		for (let track in finalTracks) {
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
			if (currentTrack.isrcs){
				if (currentTrack.isrcs[0] != null && currentTrack.isrcs[0] != undefined) {
					providerHasISRCs = true;
				}
				albumTrackISRCs.push(currentTrack.isrcs[0] || null);
				if ((currentTrack.isrcs[0] || null) != mbAlignedISRCs[track]) {
					hasMatchingISRCs = false;
				}
			} else {
				albumTrackISRCs.push(null)
			}
		}
		
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



		if (!albumData.find((a) => a.id === providerId)) { //Deduplicate
			total++;
			if (albumStatus === "green") {
				green++;
			} else if (albumStatus === "orange") {
				orange++;
			} else {
				red++;
			}hasMatchingISRCs
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
				comment: finalAlbum?.comment || null,
				albumTracks: providerTracks,
				mbid,
				artistMBID: currentArtistMBID,
				albumIssues,
				externalUrls: finalAlbum?.externalUrls || null,
				hasImage: finalAlbum?.hasImage || false
			});
		}
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
