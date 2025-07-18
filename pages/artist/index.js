import { useEffect, useState } from "react";
import ArtistInfo from "../../components/ArtistInfo";
import Head from "next/head";
import ItemList from "../../components/ItemList";
import Notice from "../../components/notices";

import { toast, Flip } from "react-toastify";

import processData from "../../utils/processAlbumData";

async function fetchArtistData(spfId) {
	const response = await fetch(`http://localhost:3000/api/getArtistInfo?spotifyId=${spfId}`);
	if (response.ok) {
		return await response.json();
	} else {
		throw new Error("Spotify artist not found!");
	}
}

export async function getServerSideProps(context) {
	const { spid, spids, artist_mbid, mbid } = context.query;
	const splitSpids = spids?.split(",");
	if (!artist_mbid && !mbid) {
		const response = await fetch(`http://localhost:3000/api/lookupArtist?spotifyId=${spid || splitSpids[0]}`);
		if (response.ok) {
			const fetchedMBid = await response.json();
			if (fetchedMBid) {
				let destination = `/artist?spid=${spid || splitSpids[0]}&artist_mbid=${fetchedMBid}`
				if (!spid && splitSpids.length > 1) {
					destination = `/artist?spids=${spids}&artist_mbid=${fetchedMBid}`
				}
				return {
					redirect: {
						destination: destination,
						permanent: false,
					},
				};
			}
		}
	}
	if (!spid && splitSpids.length == 1) {
		let destination = `/artist?spid=${splitSpids[0]}${(mbid || artist_mbid) ? `&artist_mbid=${artist_mbid || mbid}` : ""}`
		return {
			redirect: {
				destination: destination,
				permanent: false,
			},
		};
	}
	try {
		let data;
		let artist;
		if (!spid && spids) {
			data = []
			let spidArray = splitSpids;
			for (let id of spidArray) {
				data.push(await fetchArtistData(id));
			}
			const uniqueNames = [...new Set(data.map(artist => artist.name))];
			const genres = [...new Set(data.flatMap(artist => artist.genres))].filter(genre => genre.trim() != "");
			let mostPopularIndex = 0
			let mostPopularity = 0
			for (let artist in data) {
				if (data[artist].popularity > mostPopularity) {
					mostPopularIndex = artist;
					mostPopularity = data[artist].popularity;
				}
			}
			const totalFollowers = data.reduce(function (total, artist) { return total + artist.followers.total }, 0)
			artist = {
				names: uniqueNames,
				name: uniqueNames.join(" / "),
				imageUrl: data[mostPopularIndex].images[0]?.url || "",
				genres: genres.join(", "),
				followers: totalFollowers,
				popularity: data[mostPopularIndex].popularity,
				spotifyIds: spidArray,
				mbid: artist_mbid || mbid || null,
			};
		} else {
			data = await fetchArtistData(spid);
			artist = {
				name: data.name,
				imageUrl: data.images[0]?.url || "",
				genres: data.genres.join(", "),
				followers: data.followers.total,
				popularity: data.popularity,
				spotifyId: spid,
				mbid: artist_mbid || mbid || null,
			};
		}
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
			return response.status;
		}
		return response.json();
	});
}

async function fetchMbArtistAlbums(mbid, offset = 0) {
	return fetch(`/api/getMusicBrainzAlbums?mbid=${mbid}&offset=${offset}&limit=100`).then((response) => {
		if (!response.ok) {
			return response.status;
		}
		return response.json();
	});
}

async function fetchMbArtistFeaturedtAlbums(mbid, offset = 0) {
	return fetch(`/api/getMusicBrainzFeaturedAlbums?mbid=${mbid}&offset=${offset}&limit=100`).then((response) => {
		if (!response.ok) {
			return response.status;
		}
		return response.json();
	});
}

function dispError(message) {
	let toastProperties = {
		position: "top-left",
		autoClose: 5000,
		hideProgressBar: false,
		closeOnClick: false,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,
		transition: Flip,
	};
	toast.error(message, toastProperties);
}

export default function Artist({ artist }) {
	const [albums, setAlbums] = useState([]);
	const [loading, setLoading] = useState(true);
	const [statusText, setStatusText] = useState("Loading albums...");
	// const { setExportData } = useExport(); // Access setExportData from context

	let sourceAlbumCount = -1;
	let mbAlbumCount = -1;
	let mbFeaturedAlbumCount = -1;
	let sourceAlbums = [];
	let mbAlbums = [];
	useEffect(() => {
		function updateLoadingText(musicBrainz) {
			if (musicBrainz) {
				if (mbAlbumCount > -1 && mbFeaturedAlbumCount > -1) {
					setStatusText(`Loading albums from musicbrainz... ${parseInt(mbAlbums.length)}/${Number(mbAlbumCount) + Number(mbFeaturedAlbumCount)}`);
				}
			} else {
				setStatusText(`Loading albums from spotify... ${sourceAlbums.length}/${sourceAlbumCount}`);
			}
		}

		async function fetchSpotifyAlbums(spids) {
			let attempts = 0;
			for (const spid of spids) {
				let offset = 0;
				let currentAlbumCount = 999
				let fetchedAlbums = 0;
				while (offset < currentAlbumCount) {
					try {
						const data = await fetchSourceAlbums(spid, offset);
						if (typeof data === "number") {
							if (data === 404) {
								dispError(`Spotify ID ${spid} not found!`);
								return;
							}
							throw new Error(`Error fetching Spotify albums: ${data}`);
						}
						sourceAlbums = [...sourceAlbums, ...data.items];
						fetchedAlbums += data.items.length;
						currentAlbumCount = data.total;
						if (sourceAlbumCount < 0) { sourceAlbumCount = currentAlbumCount }
						offset = fetchedAlbums;
						updateLoadingText();
					} catch (error) {
						attempts++;
						console.error("Error fetching albums:", error);
					}
					if (attempts > 3) {
						dispError("Failed to fetch Spotify albums");
						break;
					}
				}
				sourceAlbumCount += currentAlbumCount;
			}
		}

		async function fetchMusicbrainzArtistAlbums() {
			let offset = 0;
			let attempts = 0;
			while (offset < mbAlbumCount || mbAlbumCount == -1) {
				try {
					const data = await fetchMbArtistAlbums(artist.mbid, offset);
					if (typeof data == "number") {
						if (data == 404) {
							dispError("MBID not found!")
							return;
						}
						throw new Error(`Error fetching MusicBrainz albums: ${data}`);
					}
					mbAlbums = [...mbAlbums, ...data.releases];
					mbAlbumCount = data["release-count"];
					offset = mbAlbums.length;
					updateLoadingText(true);
				} catch (error) {
					attempts++;
					console.error("Error fetching albums:", error);
				}
				if (attempts > 3) {
					dispError("Failed to MusicBrainz albums");
					break;
				}
			}
		}

		async function fetchMusicBrainzFeaturedAlbums() {
			let offset = 0;
			let attempts = 0;
			while (offset < mbFeaturedAlbumCount || mbFeaturedAlbumCount == -1) {
				try {
					const data = await fetchMbArtistFeaturedtAlbums(artist.mbid, offset);
					if (typeof data == "number") {
						if (data == 404) {
							dispError("MBID not found!")
							return;
						}
						throw new Error(`Error fetching MusicBrainz Featured albums: ${data}`);
					}
					mbAlbums = [...mbAlbums, ...data.releases];
					mbFeaturedAlbumCount = data["release-count"];
					offset = mbAlbums.length;
					updateLoadingText(true);
				} catch (error) {
					attempts++;
					console.error("Error fetching albums:", error);
				}
				if (attempts > 3) {
					dispError("Failed to fetch MusicBrainz Featured albums");
					return;
				}
			}
		}

		async function loadAlbums() {
			const spids = artist.spotifyIds ? artist.spotifyIds : [artist.spotifyId];
			if (!artist.mbid) {
				await fetchSpotifyAlbums(spids);
			} else {
				await Promise.all([fetchSpotifyAlbums(spids), fetchMusicbrainzArtistAlbums(), fetchMusicBrainzFeaturedAlbums()]);
			}

			let data = processData(sourceAlbums, mbAlbums, artist.mbid);
			setStatusText(data.statusText);
			setAlbums(data.albumData);
			setLoading(false);
			// setExportData(data.albumData);
		}
		loadAlbums();
	}, [artist.spotifyId]);

	return (
		<>
			<Head>
				<title>{`SAMBL • ${artist.name}`}</title>
				<meta name="description" content={`View Artist • ${artist.name} • ${artist.followers} Followers`} />
				<meta property="og:image" content={artist.imageUrl} />
				<meta property="og:title" content={`SAMBL • ${artist.name}`} />
				<meta property="og:description" content={`View Artist • ${artist.name} • ${artist.followers} Followers`} />
			</Head>
			{!artist.mbid && <Notice type={"noMBID"} data={artist} />}
			<ArtistInfo artist={artist} />
			<div id="contentContainer">{loading ? <ItemList type={"loadingAlbum"} text={statusText} /> : <ItemList type={"album"} items={albums} text={statusText} />}</div>
		</>
	);
}
