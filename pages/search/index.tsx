import { useRouter } from "next/router";
import ItemList from "../../components/ItemList";
import Head from 'next/head';
import SearchBox from '../../components/SearchBox';
import { ArtistSearchData } from "../../types/api-types";
import { SAMBLError } from "../../types/component-types";
import ErrorPage from "../../components/ErrorPage";
import SAMBLHead from "../../components/SAMBLHead";
import text from "../../utils/text";
import { ProviderNamespace } from "../../types/provider-types";

async function getItems(query, provider) {
    const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/searchArtists?query=${query}&provider=${provider}`);
    if (response.ok) {
        const data = await response.json() as ArtistSearchData;
        return data;
    } else {
        throw new Error("Error fetching artist data: " + response.statusText);
    }
}

export async function getServerSideProps(context) {
    try {
        let { query, provider } = context.query;
        if (!provider) {
            provider = context.req.cookies?.provider || "spotify";
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

export default function search({ items, error, provider }: {items?: [], error?:SAMBLError, provider?: ProviderNamespace}) {
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
                title = {`SAMBL • Results for "${query}"`}
                fullTitle={`Search results for "${query}"`}
                description={text.infoToString([
                    provider && text.capitalizeFirst(provider),
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