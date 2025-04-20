import { useEffect, useState } from "react";
import ArtistInfo from "../../components/ArtistInfo";
import AddButtons from "../../components/buttons";
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

export default function Artist({ artist }) {
	const [albums, setAlbums] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchAlbums() {
			try {
				const response = await fetch(`/api/getArtistAlbums?spotifyId=${artist.spotifyId}`);
				if (response.ok) {
					const data = await response.json();
					setAlbums(data.albums || []);
				} else {
					console.error("Failed to fetch albums");
				}
			} catch (error) {
				console.error("Error fetching albums:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchAlbums();
	}, [artist.spotifyId]);

	return (
		<>
			<Head>
				<title>{`SAMBL • ${artist.name}`}</title>
				<meta name="description" content={`SAMBL - Add Artist • ${artist.name}`} />
			</Head>
			<ArtistInfo artist={artist} />
			<div id="contentContainer">{loading ? <ItemList type={"loadingAlbum"} /> : <ItemList type={"album"} items={albums} />}</div>
		</>
	);
}
