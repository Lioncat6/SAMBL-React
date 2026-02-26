import ArtistInfo from "../../components/ArtistInfo";
import AddButtons from "../../components/buttons";
import Head from "next/head";
import { ProviderNamespace } from "../../types/provider-types";
import { ArtistPageData, SAMBLError } from "../../types/component-types";
import ErrorPage from "../../components/ErrorPage";
import { SAMBLApiError, ArtistData } from "../../types/api-types";

async function fetchArtistData(id: string, provider: ProviderNamespace) {
    const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/getArtistInfo?provider_id=${id}&provider=${provider}&mbData`);
    if (response.ok) {
        return await response.json() as ArtistData;
    } else {
        let errorMessage = "";
        try {
            const errorJson = await response.json() as SAMBLApiError;
            errorMessage = errorJson.details || errorJson.error;
        } catch {
            errorMessage = response.statusText;
        }
        throw new Error(`Failed to fetch artist data: ${errorMessage}`);
    }
}

export async function getServerSideProps(context) {
    try {
        let { spid, provider, provider_id, pid } = context.query;
        if (spid) { 
            provider_id = spid;
            provider = "spotify";
        }
        if (pid) provider_id = pid;
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

        const artist: ArtistPageData = {
            ...data,
            mbid: null
        };

        return {
            props: { artist },
        };
    } catch (error) {
        console.error("Error fetching artist data:", error);
        const samblError: SAMBLError = {
            type: "general",
            message: String(error)
        }
        return {
            props: {
                error: samblError
            }
        }
    }
}

export default function NewArtist({ artist, error }: { artist?: ArtistPageData, error: SAMBLError }) {
    if (error || !artist) {
        return <ErrorPage error={error} />
    }
    return (
        <>
            <Head>
                <title>{`SAMBL • ${artist.name}`}</title>
                <meta name="description" content={`View Artist • ${artist.name}  • ${artist.relevance}`} />
                {artist.imageUrl && <meta property="og:image" content={artist.imageUrl} />}
				<meta property="og:title" content={`SAMBL • ${artist.name}`} />
				<meta property="og:description" content={`View Artist • ${artist.name}  • ${artist.relevance}`} />
            </Head>
            <ArtistInfo artist={artist} />
            <div id="contentContainer">
                <AddButtons artist={artist} />
            </div>
        </>
    );
}