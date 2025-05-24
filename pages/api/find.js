import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";
import musixmatch from "./providers/musixmatch";
import deezer from "./providers/deezer";
import logger from "../../utils/logger";
import { createServerSearchParamsForServerPage } from "next/dist/server/request/search-params";

function createDataObject(source, imageUrl, title, artists, info, link, extraInfo = null) {
	return {
		source: source,
		imageUrl: imageUrl,
		title: title,
		artists: artists,
		info: info.filter(element => element),
		link: link,
		extraInfo: extraInfo,
	};
}

function formatMS(ms) {
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default async function handler(req, res) {
	try {
		const { query, type } = req.query;
		if (!query) {
			return res.status(400).json({ error: "Parameter `query` is required" });
		}
		if (!type) {
			return res.status(400).json({ error: "Parameter `type` is required" });
		}
		let data = [];
		if (type === "UPC") {
			const [spotifyData, mbData, deezerData] = await Promise.all([spotify.getAlbumByUPC(query), musicbrainz.getAlbumByUPC(query), deezer.getAlbumByUPC(query)]);
			if (spotifyData.albums.items) {
				spotifyData.albums.items.forEach((album) => {
					data.push(
						createDataObject(
							"spotify",
							album.images[0].url || "",
							album.name,
							album.artists.map((artist) => ({ name: artist.name, link: artist.external_urls.spotify })),
							[album.release_date, `${album.total_tracks} tracks`, album.type],
							album.external_urls.spotify
						)
					);
				});
			}
			if (mbData.releases) {
				for (const album of mbData.releases) {
					let imageData = await musicbrainz.getCoverByMBID(album.id);
					data.push(
						createDataObject(
							"musicbrainz",
							imageData.images[0]?.thumbnails?.large || "",
							album.title,
							album["artist-credit"].map((artist) => ({ name: artist.name, link: `https://musicbrainz.org/artist/${artist.artist.id}` })),
							[album.date, `${album["track-count"]} tracks`, album["release-group"]["primary-type"]],
							`https://musicbrainz.org/release/${album.id}`
						)
					);
				}
			}
			if (deezerData) {
				data.push(
					createDataObject(
						"deezer",
						deezerData.cover_medium || "",
						deezerData.title,
						deezerData.contributors.map((contributor) => ({ name: contributor.name, link: contributor.link })),
						[deezerData.release_date, `${deezerData.nb_tracks} tracks`, deezerData.type],
						deezerData.link
					)
				);
			}
		} else if (type === "ISRC") {
			const [spotifyData, mbData, mxmData, deezerData] = await Promise.all([spotify.getTrackByISRC(query), musicbrainz.getTrackByISRC(query), musixmatch.getTrackByISRC(query), deezer.getTrackByISRC(query)]);
			if (spotifyData.tracks.items) {
				spotifyData.tracks.items.forEach((track) => {
					data.push(
						createDataObject(
							"spotify",
							track.album.images[0].url || "",
							track.name,
							track.artists.map((artist) => ({ name: artist.name, link: artist.external_urls.spotify })),
							[track.album.release_date, formatMS(track.duration_ms), `Track ${track.track_number}`],
							track.external_urls.spotify
						)
					);
				});
			}
			if (mbData.recordings) {
				mbData.recordings.forEach((track) => {
					let initialReleaseDate = null;
					track["releases"].forEach((release) => {
						if (release["date"] && (!initialReleaseDate || new Date(release["date"]) < new Date(initialReleaseDate))) {
							initialReleaseDate = release["date"];
						}
					});
					data.push(
						createDataObject(
							"musicbrainz",
							"",
							track.title,
							track["artist-credit"].map((artist) => ({ name: artist.name, link: `https://musicbrainz.org/artist/${artist.artist.id}` })),
							[initialReleaseDate, formatMS(track.length), `${track["releases"].length} releases`, track.video && "Video"],
							`https://musicbrainz.org/recording/${track.id}`
						)
					);
				});
			}
			if (mxmData) {
				data.push(
					createDataObject(
						"musixmatch",
						mxmData.track.album_coverart_500x500 || mxmData.track.album_coverart_100x100 || "",
						mxmData.track.track_name,
						[{ name: mxmData.track.artist_name, link: `https://www.musixmatch.com/artist/${mxmData.track.artist_id}` }],
						[
							mxmData.track.first_release_date?.replace("T00:00:00Z", ""),
							formatMS(mxmData.track.track_length * 1000),
							mxmData.lyrics?.restricted == 1 && "Restricted",
							mxmData.lyrics?.published_status.toString().includes("5") && "Not Verified",
							((mxmData.track.has_lyrics == 0 && mxmData.lyrics?.instrumental != 1) || !mxmData.lyrics)  && "Missing Lyrics",
							mxmData.lyrics?.instrumental == 1 && "Instrumental",
							(mxmData.track.commontrack_spotify_ids < 1) && "Missing Spotify ID",
							(mxmData.track.commontrack_itunes_ids < 1) && "Missing Itunes ID",
						],
						`https://www.musixmatch.com/lyrics/${mxmData.track.commontrack_vanity_id}`,
						[
							{
								track_id: mxmData.track.track_id,
								lyrics_id: mxmData.lyrics?.lyrics_id,
								album_id: mxmData.track.album_id,
								artist_id: mxmData.track.artist_id,
								artist_mbid: mxmData.track.artist_mbid,
								commontrack_id: mxmData.track.commontrack_id,
								track_mbid: mxmData.track.track_mbid,
								track_spotify_id: mxmData.track.track_spotify_id,
								commontrack_spotify_ids: mxmData.track.commontrack_spotify_ids,
								commontrack_itunes_ids: mxmData.track.commontrack_itunes_ids,
								explicit: mxmData.track.explicit,
							},
						]
					)
				);
			}
			if (deezerData) {
				data.push(
					createDataObject(
						"deezer",
						deezerData.album.cover_medium || "",
						deezerData.title,
						deezerData.contributors.map((contributor) => ({ name: contributor.name, link: contributor.link })),
						[deezerData.release_date, formatMS(deezerData.duration * 1000), `Track ${deezerData.track_position}`],
						deezerData.link
					)
				);
			}
		} else {
			return res.status(400).json({ error: "Invalid type parameter" });
		}
		res.status(200).json(data);
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}
