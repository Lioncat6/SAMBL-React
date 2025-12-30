import spotify from "./providers/spotify";
import * as spotifyModule from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";
import musixmatch from "./providers/musixmatch";
import deezer from "./providers/deezer";
import tidal from "./providers/tidal";
import logger from "../../utils/logger";
import text from "../../utils/text";
import applemusic from "./providers/applemusic";

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

export default async function handler(req, res) {
	try {
		const { query, type } = req.query;
		if (!query) {
			return res.status(400).json({ error: "Parameter `query` is required" });
		}
		if (!type) {
			return res.status(400).json({ error: "Parameter `type` is required" });
		}
		let resultItems = [];
		let issues = [];

		const catchIssue = async (provider, fn, ...args) => {
			try {
				return await fn(...args);
			} catch (error) {
				issues.push({ provider, error: error.message || error.toString() });
				return null;
			}
		};

		if (type === "UPC") {
			const [spotifyData, mbData, deezerData, tidalData, applemusicData] = await Promise.all([
				catchIssue("spotify", spotify.getAlbumByUPC, query, { noCache: true }),
				catchIssue("musicbrainz", musicbrainz.getAlbumByUPC, query, { noCache: true }),
				catchIssue("deezer", deezer.getAlbumByUPC, query, { noCache: true }),
				catchIssue("tidal", tidal.getAlbumByUPC, query, { noCache: true }),
				catchIssue("applemusic", applemusic.getAlbumByUPC, query, { noCache: true }),
			]);

			if (spotifyData?.albums.items) {
				spotifyData.albums.items.forEach((album) => {
					resultItems.push(
						createDataObject(
							"spotify",
							spotifyModule.getFullAlbumImageUrl(album.images[0].url),
							album.name,
							album.artists.map((artist) => ({ name: artist.name, link: artist.external_urls.spotify })),
							[album.release_date, `${album.total_tracks} tracks`, text.capitalizeFirst(album.type)],
							album.external_urls.spotify
						)
					);
				});
			}
			if (mbData?.releases) {
				for (const album of mbData.releases) {
					let imageData = await musicbrainz.getCoverByMBID(album.id);
					resultItems.push(
						createDataObject(
							"musicbrainz",
							imageData.images?.[0]?.thumbnails?.large || "",
							album.title,
							album["artist-credit"].map((artist) => ({ name: artist.name, link: `https://musicbrainz.org/artist/${artist.artist.id}` })),
							[album.date, `${album["track-count"]} tracks`, text.capitalizeFirst(album["release-group"]["primary-type"])],
							`https://musicbrainz.org/release/${album.id}`
						)
					);
				}
			}
			if (deezerData?.title) {
				resultItems.push(
					createDataObject(
						"deezer",
						deezerData.cover_medium || "",
						deezerData.title,
						deezerData.contributors.map((contributor) => ({ name: contributor.name, link: contributor.link })),
						[deezerData.release_date, `${deezerData.nb_tracks} tracks`, text.capitalizeFirst(deezerData.type)],
						deezerData.link
					)
				);
			}
			if (tidalData?.data[0]?.attributes?.title) {
				const artists = tidalData.included.filter((obj) => obj.type === "artists");
				let artistMap = Object.fromEntries(artists.map((artist) => [artist.id, artist]));
				const artworks = tidalData.included.filter((obj) => obj.type === "artworks");
				let artworkMap = Object.fromEntries(artworks.map((artwork) => [artwork.id, artwork]));

				function getArtworkUrl(artworkId) {
					return artworkMap[artworkId]?.attributes?.files[0]?.href || "";
				}

				function getArtists(artistIds) {
					let artistDict = [];
					artistIds.forEach((id) => {
						const artist = artistMap[id];
						if (artist) {
							artistDict.push({ name: artist.attributes.name, link: `https://tidal.com/artist/${artist.id}` });
						}
					});
					return artistDict;
				}

				tidalData.data.forEach((album) => {
					resultItems.push(
						createDataObject(
							"tidal",
							getArtworkUrl(album.relationships?.coverArt?.data[0]?.id) || "",
							album.attributes?.title || "",
							getArtists(album.relationships?.artists?.data.map((artist) => artist.id)) || [],
							[album.attributes?.releaseDate, `${album.attributes?.numberOfItems} tracks`, text.capitalizeFirst(album.attributes?.type)],
							`https://tidal.com/album/${album.id}`
						)
					);
				});
			}
			if (applemusicData) {
				const album = applemusic.formatAlbumObject(applemusicData);

				resultItems.push(
					createDataObject(
						"applemusic",
						album.imageUrl, // TODO: There is no way to provide imageUrl and imageSmallUrl
						album.name,
						applemusicData.relationships.artists.data.map((artist) => ({ name: artist.attributes.name, link: applemusic.createUrl("artist", artist.id) })),
						[album.releaseDate, `${album.trackCount} tracks`, album.albumType],
						album.url
					)
				);
			}
		} else if (type === "ISRC") {
			const [spotifyData, mbData, mxmData, deezerData, tidalData, applemusicData] = await Promise.all([
				catchIssue("spotify", spotify.getTrackByISRC, query),
				catchIssue("musicbrainz", musicbrainz.getTrackByISRC, query),
				catchIssue("musixmatch", musixmatch.getTrackByISRC, query),
				catchIssue("deezer", deezer.getTrackByISRC, query),
				catchIssue("tidal", tidal.getTrackByISRC, query),
				catchIssue("applemusic", applemusic.getTrackByISRC, query),
			]);

			if (spotifyData?.tracks?.items) {
				spotifyData.tracks.items.forEach((track) => {
					resultItems.push(
						createDataObject(
							"spotify",
							spotifyModule.getFullAlbumImageUrl(track.album.images[0].url),
							track.name,
							track.artists.map((artist) => ({ name: artist.name, link: artist.external_urls.spotify })),
							[track.album.release_date, text.formatMS(track.duration_ms), `Track ${track.track_number}`, track.album.name],
							track.external_urls.spotify,
							[
								{
									track_id: track.id,
									album_id: track.album.id,
									album_url: track.album.external_urls.spotify,
									disc_number: track.disc_number,
									track_number: track.track_number,
									explicit: track.explicit,
									popularity: track.popularity,
									preview_url: track.preview_url,
									is_playable: track.is_playable,
									album_is_playable: track.album.is_playable,
									album_type: track.album.album_type
								}
							]
						)
					);
				});
			}
			if (mbData?.recordings) {
				mbData.recordings.forEach((track) => {
					let initialReleaseDate = null;
					track["releases"].forEach((release) => {
						if (release["date"] && (!initialReleaseDate || new Date(release["date"]) < new Date(initialReleaseDate))) {
							initialReleaseDate = release["date"];
						}
					});
					resultItems.push(
						createDataObject(
							"musicbrainz",
							"",
							track.title,
							track["artist-credit"].map((artist) => ({ name: artist.name, link: `https://musicbrainz.org/artist/${artist.artist.id}` })),
							[initialReleaseDate, text.formatMS(track.length), `${track["releases"].length} Releases`, track.video && "Video"],
							`https://musicbrainz.org/recording/${track.id}`
						)
					);
				});
			}
			if (mxmData?.track) {
				resultItems.push(
					createDataObject(
						"musixmatch",
						mxmData.track.album_coverart_500x500 || mxmData.track.album_coverart_100x100 || "",
						mxmData.track.track_name,
						[{ name: mxmData.track.artist_name, link: `https://www.musixmatch.com/artist/${mxmData.track.artist_id}` }],
						[
							mxmData.track.first_release_date?.replace("T00:00:00Z", ""),
							text.formatMS(mxmData.track.track_length * 1000),
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
					)
				);
			}
			if (tidalData?.data[0]?.attributes?.title) {
				const artists = tidalData.included.filter((obj) => obj.type === "artists");
				let artistMap = Object.fromEntries(artists.map((artist) => [artist.id, artist]));
				const artworks = tidalData.included.filter((obj) => obj.type === "artworks");
				let artworkMap = Object.fromEntries(artworks.map((artwork) => [artwork.id, artwork]));
				const albums = tidalData.included.filter((obj) => obj.type === "albums");
				let albumMap = Object.fromEntries(albums.map((album) => [album.id, album]));

				function getArtworkUrl(artworkId) {
					return artworkMap[artworkId]?.attributes?.files[0]?.href || "";
				}

				function getArtists(artistIds) {
					let artistDict = [];
					artistIds.forEach((id) => {
						const artist = artistMap[id];
						if (artist) {
							artistDict.push({ name: artist.attributes.name, link: `https://tidal.com/artist/${artist.id}` });
						}
					});
					return artistDict;
				}

				function getMostRecentAlbum(albumIds) {
					let mostRecent = null;
					albumIds.forEach((id) => {
						const album = albumMap[id];
						if (album) {
							const releaseDate = new Date(album.attributes.releaseDate);
							if (!mostRecent || releaseDate.getTime() > new Date(mostRecent.attributes.releaseDate).getTime()) {
								mostRecent = album;
							}
						}
					});
					return mostRecent;
				}

				tidalData.data.forEach((track) => {
					let mostRecentAlbum = getMostRecentAlbum(track.relationships?.albums?.data.map((album) => album.id));
					resultItems.push(
						createDataObject(
							"tidal",
							getArtworkUrl(mostRecentAlbum?.relationships?.coverArt?.data[0]?.id) || "",
							track.attributes?.title || "",
							getArtists(track.relationships?.artists?.data.map((artist) => artist.id)) || [],
							[mostRecentAlbum?.attributes?.releaseDate, text.formatDuration(track?.attributes?.duration), `${track?.relationships?.albums?.data.length} Album${track?.relationships?.albums?.data.length !== 1 ? "s" : ""}`, ],
							`https://tidal.com/track/${track.id}`
						)
					);
				});
			}
			if (deezerData?.album) {
				resultItems.push(
					createDataObject(
						"deezer",
						deezerData.album.cover_medium || "",
						deezerData.title,
						deezerData.contributors.map((contributor) => ({ name: contributor.name, link: contributor.link })),
						[deezerData.release_date, text.formatMS(deezerData.duration * 1000), `Track ${deezerData.track_position}`],
						deezerData.link
					)
				);
			}
			if (applemusicData) {
				for (const track of applemusicData) {
					resultItems.push(
						createDataObject(
							"applemusic",
							track.imageUrlSmall,
							track.name,
							track.trackArtists.map((artist) => ({ name: artist.name, link: artist.url })),
							[track.releaseDate, text.formatMS(track.duration), `Track ${track.trackNumber}`, track.albumName ],
							track.url
						)
					);
				}
			}
		} else {
			return res.status(400).json({ error: "Invalid type parameter" });
		}
		res.status(200).json({ data: resultItems, issues: issues });
	} catch (error) {
		logger.error("Error in find API", error);
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}
