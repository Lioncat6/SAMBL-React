import ArtistInfo from "../../components/ArtistInfo";
import AddButtons from "../../components/buttons";
import Head from "next/head";

async function fetchArtistData(spfId) {
    const response = await fetch(`http://localhost:3000/api/getArtistInfo?spotifyId=${spfId}`);
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error("Spotify artist not found!");
    }
}

export async function getServerSideProps(context) {
    const { spid } = context.query;

    try {
        const data = await fetchArtistData(spid);

        // Transform the data into the format expected by the component
        const artist = {
            name: data.name,
            imageUrl: data.images[0]?.url || "",
            genres: data.genres.join(", "), // Convert genres array to a string
            followers: data.followers.total,
            popularity: data.popularity,
            spotifyId: spid,
        };

        return {
            props: { artist }, // Pass the artist data as props to the page
        };
    } catch (error) {
        console.error("Error fetching artist data:", error);
        return {
            notFound: true, // Return a 404 page if the artist is not found
        };
    }
}

export default function NewArtist({ artist }) {
    return (
        <>
            <Head>
                <title>SAMBL • {artist.name}</title>
                <meta name="description" content={`SAMBL - Add Artist • ${artist.name}`} />
            </Head>
            <ArtistInfo artist={artist} />
            <div id="contentContainer">
                <AddButtons artist={artist} />
            </div>
        </>
    );
}