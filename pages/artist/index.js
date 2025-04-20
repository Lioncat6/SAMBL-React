import { useEffect, useState } from "react";
import ArtistInfo from "../../components/ArtistInfo";
import Head from "next/head";
import ItemList from "../../components/ItemList";

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

async function fetchAlbums(artistId, offset = 0) {
	return fetch(`/api/getArtistAlbums?spotifyId=${artistId}&offset=${offset}&limit=50`).then((response) => {
		if (!response.ok) {
			throw new Error("Failed to fetch albums");
		}
		return response.json();
	});
}

export default function Artist({ artist }) {
	const [albums, setAlbums] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingtext, setLoadingText] = useState("Loading albums...");
	let albumCount = 99;

	useEffect(() => {
		function updateLoadingText() {
			if (albums.length >= albumCount) {
				setLoadingText("Loading albums from musicbrainz...");
			} else {
				setLoadingText(`Loading albums from spotify... ${albums.length}/${albumCount}`);
			}
		}

		async function fetchArtistAlbums() {
			let albumList = [];
			let offset = 0;
			while (offset < albumCount) {
				try {
					const data = await fetchAlbums(artist.spotifyId, offset);
					albumList = [...albumList, ...data.items];
					albumCount = data.total;
					offset += 50;
					setAlbums(albumList);
					updateLoadingText();
				} catch (error) {
					console.error("Error fetching albums:", error);
				}
			}

			setLoading(false);
		}
		fetchArtistAlbums();
	}, [artist.spotifyId]);

	return (
		<>
			<Head>
				<title>{`SAMBL • ${artist.name}`}</title>
				<meta name="description" content={`SAMBL - Add Artist • ${artist.name}`} />
			</Head>
			<ArtistInfo artist={artist} />
			<div id="contentContainer">{loading ? <ItemList type={"loadingAlbum"} text={loadingtext} /> : <ItemList type={"album"} items={albums} />}</div>
		</>
	);
}
