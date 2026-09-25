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
import clientProviders from "../../utils/clientProviders";
import { SAMBLFetch } from "../../utils/clientAPIHandler";
import { GetServerSidePropsContext } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { redirect } from "next/dist/server/api-utils";

async function getItems(query: string, provider: string) {
    try {
        const [data, timings] = await SAMBLFetch<ArtistSearchData>(`/api/searchArtists?query=${query}&provider=${provider}`, true);
        return data;
    } catch (error) {
        throw new Error(`Error fetching artist data: ${error}`);
    }
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    try {
        let { query, provider } = normalizeVars(context.query);
        if (!provider) {
            provider = context.req.cookies?.provider || "spotify";
        }
        if (!query) {
            return {
                redirect: {
                    destination: `/`,
                    permanent: true,
                },
            }
        }
        const items = await getItems(query, provider);
        return {
            props: { items, provider },
        };
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

export default function search({ items, error, provider }: { items?: [], error?: SAMBLError, provider?: ProviderNamespace }) {
    if (error || !items) {
        return (
            <ErrorPage error={error || null} />
        )
    }
    const router = useRouter();
    const { query } = router.query;
    return (
        <>
            <SAMBLHead
                title={`SAMBL • Results for "${query}"`}
                fullTitle={`Search results for "${query}"`}
                description={text.infoToString([
                    provider && clientProviders.getDisplayName(provider),
                    `${items.length} results for "${query}"`
                ])}
            />
            <div id="err" />
            <div className="titleContainer">
                <h1 id="searchFor">Search Results for "{query}"</h1>
            </div>
            <SearchBox />
            <br />
            <div id="contentContainer">
                <div id="loadingContainer" />
                <div id="loadingText" />
                <ItemList type={"artist"} items={items} />
                <div id="statusText" />
            </div>

        </>

    )
}