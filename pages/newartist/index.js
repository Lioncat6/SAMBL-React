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

        const data = await fetchArtistData(spid);

        const artist = {
            name: data.name,
            imageUrl: data.images[0]?.url || "",
            genres: data.genres.join(", "),
            followers: data.followers.total,
            popularity: data.popularity,
            spotifyId: spid,
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

export default function NewArtist({ artist }) {
    return (
        <>
            <Head>
                <title>{`SAMBL • ${artist.name}`}</title>
                <meta name="description" content={`View Artist • ${artist.name}  • ${artist.followers} Followers`} />
                <meta property="og:image" content={artist.imageUrl} />
				<meta property="og:title" content={`SAMBL • ${artist.name}`} />
				<meta property="og:description" content={`View Artist • ${artist.name}  • ${artist.followers} Followers`} />
            </Head>
            <ArtistInfo artist={artist} />
            <div id="contentContainer">
                <AddButtons artist={artist} />
            </div>
        </>
    );
}