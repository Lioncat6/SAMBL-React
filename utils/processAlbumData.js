import normalizeText from "./normalizeText";

export default function processData(sourceAlbums, mbAlbums, currentArtistMBID = null, quick = false, full = false) {
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
            if (mbTrackCount != spotifyTrackCount && !quick && full) {
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
            currentArtistMBID,
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