
function createDataObject(source, imageUrl, title, artists, info, link, extraInfo = null) {
	return {
		source: source,
		imageUrl: imageUrl,
		title: title,
		artists: artists,
		info: info.filter((element) => element),
		link: link,
		extraInfo: extraInfo,
	};
}

function formatMS(ms) {
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function processData(data, provider) {
	let dataObject = null;
	if (provider == "musixmatch") {
        const mxmData = data;
        console.log(mxmData);
		dataObject = createDataObject(
			"musixmatch",
			mxmData.track.album_coverart_500x500 || mxmData.track.album_coverart_100x100 || "",
			mxmData.track.track_name,
			[{ name: mxmData.track.artist_name, link: `https://www.musixmatch.com/artist/${mxmData.track.artist_id}` }],
			[
				mxmData.track.first_release_date?.replace("T00:00:00Z", ""),
				formatMS(mxmData.track.track_length * 1000),
				mxmData.lyrics?.restricted == 1 && "Restricted",
				mxmData.lyrics?.published_status.toString().includes("5") && "Not Verified",
				((mxmData.track.has_lyrics == 0 && mxmData.lyrics?.instrumental != 1) || !mxmData.lyrics) && "Missing Lyrics",
				mxmData.lyrics?.instrumental == 1 && "Instrumental",
				mxmData.track.commontrack_spotify_ids < 1 && "Missing Spotify ID",
				mxmData.track.commontrack_itunes_ids < 1 && "Missing Itunes ID",
			],
			`https://www.musixmatch.com/lyrics/${mxmData.track.commontrack_vanity_id}`,
			[
				{
					track_id: mxmData.track.track_id,
					lyrics_id: mxmData.lyrics?.lyrics_id,
					album_id: mxmData.track.album_id,
					album_vanity_id: mxmData.track.album_vanity_id,
					artist_id: mxmData.track.artist_id,
					artist_mbid: mxmData.track.artist_mbid,
					commontrack_id: mxmData.track.commontrack_id,
					track_mbid: mxmData.track.track_mbid,
					track_spotify_id: mxmData.track.track_spotify_id,
					commontrack_spotify_ids: mxmData.track.commontrack_spotify_ids,
					commontrack_itunes_ids: mxmData.track.commontrack_itunes_ids,
					explicit: mxmData.track.explicit,
					updated_time: mxmData.track.updated_time,
				},
			]
		);
	}

	return dataObject;
}

export default async function clientFetch(urls) {
	let dataObjects = [];
	urls.forEach(async (url) => {
		if (url.provider === "musixmatch") {
			const trackData = await (await fetch(url.urls[0])).json();
            console.log(trackData)
			if (trackData.message?.body?.track) {
				const lyricsData = await (await fetch(url.urls[1])).json();
				if (lyricsData.message.body) {
					trackData.message.body.lyrics = lyricsData.message.body.lyrics;
				}
				dataObjects.push(
                    processData(trackData.message.body, "musixmatch")
                );
			} else {
				if (trackData.message?.header?.status_code === 401) {
					console.warn(`Recieved 401 from MusixMatch. Reason: ${trackData.message.header?.hint}`);
					throw new Error(`Recieved 401 from MusixMatch. Reason: ${trackData.message.header?.hint}`);
				}
				return null;
			}
		}
	});
    return {data: dataObjects, issues: []};
}
