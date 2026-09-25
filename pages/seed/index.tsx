import { useRouter } from "next/router";
import ItemList from "../../components/ItemList";
import Head from 'next/head';
import SearchBox from '../../components/SearchBox';
import { APITimingData, ArtistSearchData, SAMBLApiError, SAMBLAPIResponse } from "../../types/api-types";
import { SAMBLError } from "../../types/component-types";
import ErrorPage from "../../components/ErrorPage";
import SAMBLHead from "../../components/SAMBLHead";
import text from "../../utils/text";
import { ProviderNamespace } from "../../types/provider-types";
import { AggregatedAlbum, AlbumStack } from "../../types/aggregated-types";
import TrackMenuPopup, { TrackMenu, TrackMenuInner } from "../../components/Popups/TrackMenu";
import styles from "../../styles/Seed.module.css";
import { ActionButton } from "../../components/buttons";
import { ReleaseSeedButton } from "../../components/ReleaseSeed";
import albumStack from "../../utils/albumStack";
import { SAMBLFetch } from "../../utils/clientAPIHandler";
import ReleaseActionsPopup from "../../components/Popups/ReleaseActionsMenu";
import { GetServerSidePropsContext } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { hostname } from "node:os";
import harmony from "../../lib/seeders/harmony";
import Notice from "../../components/notices";


async function getAlbum(url?: string, provider?: string, artistId?: string, albumId?: string): Promise<AlbumStack | null> {
    // provider_id, provider, url, mbid, artist_id
    let apiUrl = `/api/compareSingleAlbum?artist_id=${artistId}&provider_id=${albumId}&provider=${provider}&fetchISRCs&resolveArtists&detectLanguage`;
    if (url) {
        apiUrl = `/api/compareSingleAlbum?url=${url}&fetchISRCs&resolveArtists&detectLanguage`;
    }
    try {
        const [data, timings] = await SAMBLFetch<AlbumStack>(apiUrl, true);
        return data;
    } catch (error) {
        throw new Error(`Failed to fetch album data: ${error}`);
    }
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    try {
        let { req } = context;
        let { url, provider, artistId, albumId } = normalizeVars(context.query);
        let fetchCall: Promise<AlbumStack | null> | null = null;
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
                props: { error: samblError, hostName: req.headers.host }
            };
        }
        try {
            const albumData = await fetchCall;
            return {
                props: { data: albumData, hostName: req.headers.host },
            };
        } catch (error) {
            const samblError: SAMBLError = {
                type: "fetch",
                message: String(error)
            }
            return {
                props: { error: samblError, hostName: req.headers.host }
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

export default function Seed({ data, error, hostName, timings }: { data?: AlbumStack | null, error?: SAMBLError, hostName?: string, timings?: APITimingData }) {
    if (error || data == undefined && data !== null) {
        return (
            <ErrorPage error={error || null} />
        )
    }
    const router = useRouter();
    const { query } = router.query;

    const showActions = Object.prototype.hasOwnProperty.call(router.query, "showActions");
    if (data == null) {
        return (
            <>
                <SAMBLHead
                    title={`SAMBL • Release Seeder`}
                    fullTitle={`SAMBL MusicBrainz Release Importer`}
                />
                <div className="titleContainer">
                    <h1 className={styles.seedTitle} id="searchFor">Seed Release</h1>
                </div>
                <SearchBox type="lookup" />
            </>
        )
    }
    const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(data)
    const harmonyProviders = harmony.providers;
    return (
        <>
            <div className={styles.seedPageContainer} style={{ "--background-image": `url('${aggregatedAlbum.imageUrl || ""}')` } as React.CSSProperties}>
                <SAMBLHead
                    title={`SAMBL • Seed release`}
                    fullTitle={`Seed Release "${aggregatedAlbum.name}"`}
                    description={`${aggregatedAlbum.name} by ${aggregatedAlbum.artistNames.join(", ")} (${aggregatedAlbum.releaseDate}) • ${aggregatedAlbum.trackCount} tracks`}
                />
                <div id="err" />
                {/* <div className="titleContainer">
                <h1 className={styles.seedTitle} id="searchFor">Seed Release</h1>
            </div> */}
                {harmonyProviders.includes(aggregatedAlbum.provider) && <Notice type={"onHarmony"} data={harmony.buildUrl(aggregatedAlbum.url.url, aggregatedAlbum.upc)}/>}
                <SearchBox type="lookup" />
                <ReleaseSeedButton data={data} orgin={`https://${hostName ?? process.env.NEXT_PUBLIC_URL?.replaceAll(/https|http|[\:\/]/g , '')}${router.asPath}`}/>
                {targetAlbum &&
                    <ReleaseActionsPopup data={data} button={<ActionButton type="releaseActions"/>} open={showActions}/>
                }
                <br />
                <div id="contentContainer" >
                    <div id="albumContainer" className={styles.albumContainer}>
                        <TrackMenuInner data={data} refresh={() => { }} isStandalone={true} />
                    </div>
                </div>
            </div>
        </>


    )
}