import text from "./text";

export default function processData(sourceAlbums, mbAlbums, currentArtistMBID = null, quick = false, full = false) {
	let albumData = [];
	let green = 0;
	let red = 0;
	let orange = 0;
	let total = 0;

	//     export type AlbumObject = {
	//     provider: string;
	//     id: string;
	//     name: string;
	//     url: string;
	//     imageUrl: string;
	//     imageUrlSmall: string;
	//     albumArtists: AlbumArtistObject[];
	//     artistNames: string[];
	//     releaseDate: string;
	//     trackCount: number;
	//     albumType: string;
	// };
	//
	sourceAlbums.forEach((album) => {
		let albumStatus = "red";
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

		let mbTrackCount = 0;
		let mbReleaseDate = "";
		let mbid = "";
		let finalHasCoverArt = false;
		let albumIssues = [];
		let finalTracks = [];
		let mbBarcode = "";
		mbAlbums.forEach((mbAlbum) => {
			if (mbAlbum?.title) {
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
					if (relation.url.resource == providerUrl) {
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

				if (albumStatus === "red" && text.normalizeText(mbReleaseName) === text.normalizeText(providerAlbumName)) {
					albumStatus = "orange";
					mbid = mbAlbum.id;
					albumMBUrl = `https://musicbrainz.org/release/${mbid}`;
					mbTrackCount = MBTrackCount;
					mbReleaseDate = MBReleaseDate;
					finalHasCoverArt = hasCoverArt;
					finalTracks = MBTracks;
					mbBarcode = MBReleaseUPC;
				}
			}
		});

		const alwaysBarcodeProviders = ["spotify", "deezer", "tidal", "itunes"]
		const alwaysISRCProviders = ["spotify", "deezer", "tidal", "itunes"]
		
		let mbTrackNames = [];
		let mbTrackISRCs = [];
		let mbAlignedISRCs = [];
		let mbISRCs = [];
		let tracksWithoutISRCs = [];
		for (let track in finalTracks) {
			let titleString = finalTracks[track].title;
			let ISRCs = finalTracks[track].recording.isrcs;
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
		let albumTrackISRCs = []
		for (let track in providerTracks) {
			if (track.isrcs){
				if (track.isrcs[0] != null && track.isrcs[0] != undefined) {
					providerHasISRCs = true;
				}
				albumTrackISRCs.push(track.isrcs[0] || null);
				if ((track.isrcs[0] || null) != mbAlignedISRCs) {
					hasMatchingISRCs = false;
				}
			} else {
				albumTrackISRCs.push(null)
			}
		}
		
		if (albumStatus != "red") {
			if ((!mbBarcode || mbBarcode == null) && (providerBarcode || alwaysBarcodeProviders.includes(provider))) {
				albumIssues.push("noUPC");
			} else if (providerBarcode && providerBarcode.replace(/^0+/, '') != mbBarcode.replace(/^0+/, '')) {
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
			}
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
				albumStatus,
				albumMBUrl,
				albumBarcode: providerBarcode,
				albumTracks: providerTracks,
				mbTrackCount,
				mbReleaseDate,
				mbid,
				currentArtistMBID,
				albumIssues,
				mbTrackNames,
				mbISRCs,
				mbTrackISRCs,
				tracksWithoutISRCs,
				mbBarcode,
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
