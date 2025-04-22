import { useEffect, useState } from "react";
import ArtistInfo from "../../components/ArtistInfo";
import Head from "next/head";
import ItemList from "../../components/ItemList";
import Notice from "../../components/notices";

async function fetchArtistData(spfId) {
	const response = await fetch(`http://localhost:3000/api/getArtistInfo?spotifyId=${spfId}`);
	if (response.ok) {
		return await response.json();
	} else {
		throw new Error("Spotify artist not found!");
	}
}



export async function getServerSideProps(context) {
	const { spid, artist_mbid } = context.query;
	if (!artist_mbid) {
		const response = await fetch(`http://localhost:3000/api/lookupArtist?spotifyId=${spid}`);
		if (response.ok) {
			const mbid = await response.json();
			if (mbid) {
				return {
					redirect: {
						destination: `/artist?spid=${spid}&artist_mbid=${mbid}`,
						permanent: false,
					},
				};
			}
		}
	}
	try {
		const data = await fetchArtistData(spid);
		const artist = {
			name: data.name,
			imageUrl: data.images[0]?.url || "",
			genres: data.genres.join(", "),
			followers: data.followers.total,
			popularity: data.popularity,
			spotifyId: spid,
			mbid: artist_mbid || null,
		};

		return {
			props: { artist },
		};
	} catch (error) {
		console.error("Error fetching artist data:", error);
		return {
			notFound: true,
		};
	}
}

async function fetchSourceAlbums(artistId, offset = 0) {
	return fetch(`/api/getArtistAlbums?spotifyId=${artistId}&offset=${offset}&limit=50`).then((response) => {
		if (!response.ok) {
			throw new Error("Failed to fetch albums");
		}
		return response.json();
	});
}

async function fetchMbArtistAlbums(mbid, offset = 0) {
	return fetch(`/api/getMusicBrainzAlbums?mbid=${mbid}&offset=${offset}&limit=100`).then((response) => {
		if (!response.ok) {
			throw new Error("Failed to fetch albums from MusicBrainz");
		}
		return response.json();
	});
}

async function fetchMbArtistFeaturedtAlbums(mbid, offset = 0) {
	return fetch(`/api/getMusicBrainzFeaturedAlbums?mbid=${mbid}&offset=${offset}&limit=100`).then((response) => {
		if (!response.ok) {
			throw new Error("Failed to fetch albums from MusicBrainz");
		}
		return response.json();
	});
}

function processData(sourceAlbums, mbAlbums) {
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
		let spotifyReleaseDate = album.release_date;
		let spotifyTrackCount = album.total_tracks;
		let spotifyAlbumType = album.album_type;

		let finalTrackCount = 0;
		let finalReleaseDate = "";
		let finalMBID = "";
		let finalHasCoverArt = false;
		let albumIssues = [];
		let finalTracks = [];
		let finalUPC = "";
		mbAlbums.forEach((mbAlbum) => {
			console.log(mbAlbum)
			let mbReleaseName = mbAlbum.title;
			let mbReleaseUrls = mbAlbum.relations || [];
			let MBTrackCount = mbAlbum.media?.reduce((count, media) => count + media["track-count"], 0);
			let MBReleaseDate = mbAlbum.date;
			let MBReleaseUPC = mbAlbum.barcode
			let hasCoverArt = mbAlbum["cover-art-archive"]?.front || false;
			var MBTracks = [];
			mbAlbum.media?.forEach((media) => {
				console.log(media)
				if (media.tracks) {
					MBTracks = [...MBTracks, ...media.tracks];
				}

			});
			mbReleaseUrls.forEach((relation) => {
				if (relation.url.resource == spotifyUrl) {
					albumStatus = "green";
					finalMBID = mbAlbum.id;
					albumMBUrl = `https://musicbrainz.org/release/${finalMBID}`;
					finalTrackCount = MBTrackCount;
					finalReleaseDate = MBReleaseDate;
					finalHasCoverArt = hasCoverArt;
					finalTracks = MBTracks;
					finalUPC = MBReleaseUPC;
				}
			});

			if (albumStatus === "red" && normalizeText(mbReleaseName) === normalizeText(spotifyName)) {
				albumStatus = "orange";
				finalMBID = mbAlbum.id;
				albumMBUrl = `https://musicbrainz.org/release/${finalMBID}`;
				finalTrackCount = MBTrackCount;
				finalReleaseDate = MBReleaseDate;
				finalHasCoverArt = hasCoverArt;
				finalTracks = MBTracks;
				finalUPC = MBReleaseUPC
			}
		});

		let mbTrackNames = [];
		let mbTrackISRCs = [];
		let tracksWithoutISRCs = [];
		for (let track in finalTracks) {
			let titleString = finalTracks[track].title;
			let ISRCs = finalTracks[track].recording.isrcs;
			if (ISRCs.length < 1) {
				tracksWithoutISRCs.push(track);
			} else {
				for (let isrc in ISRCs) {
					mbTrackISRCs.push(ISRCs[isrc]);
				}
			}
			mbTrackNames.push(titleString);
		}

		if (albumStatus != "red") {
			if (!finalUPC || finalUPC == null) {
				albumIssues.push("noUPC");
			}
			if (finalTrackCount != spotifyTrackCount) {
				albumIssues.push("trackDiff");
			}
			if (finalReleaseDate == "" || finalReleaseDate == undefined || !finalReleaseDate) {
				albumIssues.push("noDate");
			} else if (finalReleaseDate != spotifyReleaseDate) {
				albumIssues.push("dateDiff");
			}
			if (!finalHasCoverArt) {
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
			spotifyReleaseDate,
			spotifyTrackCount,
			spotifyAlbumType,
			albumStatus,
			albumMBUrl,
			finalTrackCount,
			finalReleaseDate,
			finalMBID,
			albumIssues,
			mbTrackNames,
			mbTrackISRCs,
			tracksWithoutISRCs,
		});
	});

	let statusText = `Albums on MusicBrainz: ${green}/${total} ~ ${orange} albums have matching names but no associated link`
	return {
		albumData,
		statusText,
		green,
		orange,
		red,
		total,
	}
}

function normalizeText(text) {
	return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function Artist({ artist }) {
	const [albums, setAlbums] = useState([]);
	const [loading, setLoading] = useState(true);
	const [statusText, setStatusText] = useState("Loading albums...");
	let sourceAlbumCount = 999;
	let mbAlbumCount = 999;
	let mbFeaturedAlbumCount = 999;
	let sourceAlbums = [];
	let mbAlbums = [];
	useEffect(() => {
		function updateLoadingText(musicBrainz) {
			if (musicBrainz) {
				setStatusText(`Loading albums from musicbrainz... ${parseInt(mbAlbums.length)}/${parseInt(mbAlbumCount) + parseInt(mbFeaturedAlbumCount)}`);
			} else {
				setStatusText(`Loading albums from spotify... ${sourceAlbums.length}/${sourceAlbumCount}`);
			}
		}

		async function fetchSpotifyAlbums() {
			let offset = 0;
			while (offset < sourceAlbumCount) {
				try {
					const data = await fetchSourceAlbums(artist.spotifyId, offset);
					sourceAlbums = [...sourceAlbums, ...data.items];
					sourceAlbumCount = data.total;
					offset = sourceAlbums.length;
					updateLoadingText();
				} catch (error) {
					console.error("Error fetching albums:", error);
				}
			}
		}

		async function fetchMusicbrainzArtistAlbums() {
			let offset = 0;
			while (offset < mbAlbumCount) {
				try {
					const data = await fetchMbArtistAlbums(artist.mbid, offset);
					mbAlbums = [...mbAlbums, ...data.releases];
					mbAlbumCount = data["release-count"];
					offset = mbAlbums.length;
					updateLoadingText(true);
				} catch (error) {
					console.error("Error fetching albums:", error);
				}
			}
		}

		async function fetchMusicBrainzFeaturedAlbums() {
			let offset = 0;
			while (offset < mbFeaturedAlbumCount) {
				try {
					const data = await fetchMbArtistFeaturedtAlbums(artist.mbid, offset);
					mbAlbums = [...mbAlbums, ...data.releases];
					mbFeaturedAlbumCount = data["release-count"];
					offset = mbAlbums.length;
					updateLoadingText(true);
				} catch (error) {
					console.error("Error fetching albums:", error);
				}
			}
		}

		async function loadAlbums() {
			if (!artist.mbid) {
				await fetchSpotifyAlbums();
			} else {
				await Promise.all([
					fetchSpotifyAlbums(),
					fetchMusicbrainzArtistAlbums(),
					fetchMusicBrainzFeaturedAlbums(),
				]);
			}

			let data = processData(sourceAlbums, mbAlbums)
			console.log(data)
			setStatusText(data.statusText);
			setAlbums(data.albumData);
			setLoading(false);
		}
		loadAlbums()

	}, [artist.spotifyId]);

	return (
		<>
			<Head>
				<title>{`SAMBL • ${artist.name}`}</title>
				<meta name="description" content={`SAMBL - View Artist • ${artist.name}`} />
			</Head>
			{!artist.mbid && <Notice type={"noMBID"} data={artist} />}
			<ArtistInfo artist={artist} />
			<div id="contentContainer">{loading ? <ItemList type={"loadingAlbum"} text={statusText} /> : <ItemList type={"album"} items={albums} text={statusText} />}</div>
		</>
	);
}
