import ArtistInfo from "../../components/ArtistInfo";
import AddButtons from "../../components/buttons";
import Head from "next/head";

async function fetchArtistData(id, provider) {
    const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/getArtistInfo?provider_id=${id}&provider=${provider}`);
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error("Spotify artist not found!");
    }
}

export async function getServerSideProps(context) {
    let { spid, provider, provider_id, pid } = context.query;
    if (spid) { 
        provider_id = spid;
        provider = "spotify";
    }
    if (pid) provider_id = pid;

    try {
        const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/lookupArtist?provider_id=${provider_id}&provider=${provider}`);
        if (response.ok) {
            const { mbid } = await response.json();
            if (mbid) {
                return {
                    redirect: {
                        destination: `/artist?provider_id=${provider_id}&provider=${provider}&artist_mbid=${mbid}`,
                        permanent: false,
                    },
                };
            }
        }

        const data = (await fetchArtistData(provider_id, provider)).providerData;

        const artist = data;
        data.provider_id = data.id;

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