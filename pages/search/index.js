import { useRouter } from "next/router";
import ArtistList from "../../components/ItemList";

export default function search() {
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
                        <ArtistList type={"artist"} />
                        <div id="statusText" />
                    </div>
                </div>
            </div>
        </>

    )
}