import { useRouter } from "next/router";
import ItemList from "../../components/ItemList";
import Head from 'next/head';
import SearchBox from '../../components/SearchBox';
import { ArtistSearchData, SAMBLApiError } from "../../types/api-types";
import { SAMBLError } from "../../types/component-types";
import ErrorPage from "../../components/ErrorPage";
import SAMBLHead from "../../components/SAMBLHead";
import text from "../../utils/text";
import { ProviderNamespace } from "../../types/provider-types";
import { AggregatedAlbum } from "../../types/aggregated-types";
import { TrackMenu, TrackMenuInner } from "../../components/Popups/TrackMenu";
import styles from "../../styles/Seed.module.css";
import { ActionButton } from "../../components/buttons";


async function getAlbum(url?: string, provider?: ProviderNamespace, artistId?: string, albumId?: string): Promise<AggregatedAlbum | null> {
    // provider_id, provider, url, mbid, artist_id
    let apiUrl = `http://localhost:${process.env.PORT || 3000}/api/compareSingleAlbum?artist_id=${artistId}&provider_id=${albumId}&provider=${provider}`;
    if (url) {
        apiUrl = `http://localhost:${process.env.PORT || 3000}/api/compareSingleAlbum?url=${url}`;
    }
    const response = await fetch(apiUrl);
    if (response.ok) {
        const data = await response.json() as AggregatedAlbum;
        return data;
    } else {
        let errorMessage = "";
        try {
            const errorJson = await response.json() as SAMBLApiError;
            errorMessage = errorJson.details || errorJson.error;
        } catch {
            errorMessage = response.statusText;
        }
        throw new Error(`Failed to fetch album data: ${errorMessage}`);
    }
  
}

export async function getServerSideProps(context) {
    try {
        let { url, provider, artistId, albumId } = context.query;
        let fetchCall: Promise<AggregatedAlbum | null> | null = null;
        if (url) {
            fetchCall = getAlbum(url);
        } else if (artistId && albumId && provider) {
            fetchCall = getAlbum(undefined, provider, artistId, albumId);
        } else if (!url && !artistId && !albumId && !provider) {
            return { props: { data: null } }; // Blank page
        } else {
            // Has at least one parameter but not all required ones
            const samblError: SAMBLError = {
                type: "parameter",
                message: "Missing required parameters. Please provide either a URL or artistId, albumId, and provider."
            }
            return {
                props: { error: samblError }
            };
        }
        try {
            const albumData = await fetchCall;
            return {
                props: { data: albumData },
            };
        } catch (error) {
            const samblError: SAMBLError = {
                type: "fetch",
                message: String(error)
            }
            return {
                props: { error: samblError }
            };
        }
        return { data: null }  
    } catch (error) {
        const samblError: SAMBLError = {
            type: "general",
            message: String(error)
        }
        return {
            props: { error: samblError }
        };
    }
}

export default function Search({ data, error }: {data?: AggregatedAlbum | null, error?:SAMBLError}) {
    if (error || data == undefined && data !== null) {
        return (
            <ErrorPage error={error || null} />
        )
    }
    const router = useRouter();
    const { query } = router.query;
    if (data == null) {
        return (
            <>
            <SAMBLHead
                title = {`SAMBL • Release Seeder`}
                fullTitle={`SAMBL MusicBrainz Release Importer`}
            />
            <div className="titleContainer">
                <h1 id="searchFor">SAMBL Release Seeder</h1>
            </div>
            <SearchBox type="lookup" />
            </>
        )
    }
    return (
        <>
            <SAMBLHead
                title = {`SAMBL • Seed release`}
                fullTitle={`Seed Release "${data.name}"`}
                description={`${data.name} by ${data.artistNames.join(", ")} (${data.releaseDate}) • ${data.albumTracks.length} tracks`}
            />
            <div id="err" />
            <div className="titleContainer">
                <h1 id="searchFor">Seed Release</h1>
            </div>
            <SearchBox type="lookup" />
            <ActionButton type="seed" onClick={() => {}} data={data} />
            <br />
            <div id="contentContainer" >
                <div id="albumContainer" className={styles.albumContainer}>
                    <TrackMenuInner data={data} refresh={() => {}} />
                </div>
            </div>
        </>

    )
}