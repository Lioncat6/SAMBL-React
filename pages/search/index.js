import { useRouter } from "next/router";
import ArtistList from "../../components/ItemList";

async function getItems(query) {
    const response = await fetch(`http://localhost:3000/api/searchArtists?query=${query}`);
    if (response.ok) {
        console.log("Response:", response.body);
        return await response.json();
    } else {
        throw new Error("Error fetching artist data");
    }
}

export async function getServerSideProps(context) {
    const { query } = context.query;

    try {
        const items = await getItems(query);
        console.log(items);
        return {
            props: { items }, 
        };
    } catch (error) {
        console.error("Error fetching artist data:", error);
        return {
            notFound: true, // Return a 404 page if the artist is not found
        };
    }
}

export default function search({items}) {
    const router = useRouter();
    const { query } = router.query;
    return (
        <>
            <div id="main">
                <div id="err" />
                <div className="titleContainer">
                    <h1 id="searchFor">Search Results for "{query}"</h1>
                </div>
                <div id="contentContainer">
                    <div id="loadingContainer" />
                    <div id="loadingText" />
                    <div id="artistContainer">
                        <ArtistList type={"artist"} items={items} />
                        <div id="statusText" />
                    </div>
                </div>
            </div>
        </>

    )
}