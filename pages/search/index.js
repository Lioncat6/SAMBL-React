import { useRouter } from "next/router";
import ItemList from "../../components/ItemList";
import Head from 'next/head';
import SearchBox from '../../components/SearchBox';

async function getItems(query) {
    const response = await fetch(`http://localhost:3000/api/searchArtists?query=${query}`);
    if (response.ok) {
        const data = await response.json();
        return data; 
    } else {
        throw new Error("Error fetching artist data");
    }
}

export async function getServerSideProps(context) {
    const { query } = context.query;

    try {
        const items = await getItems(query);
        return {
            props: { items },
        };
    } catch (error) {
        console.error("Error fetching artist data:", error);
        return {
            notFound: true,
        };
    }
}

export default function search({ items }) {
    const router = useRouter();
    const { query } = router.query;
    return (
        <>
            <Head>
                <title>{`SAMBL • Results for  "${query}"`}</title>
                <meta name="description" content={`SAMBL • Search results for "${query}"`} />
            </Head>
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