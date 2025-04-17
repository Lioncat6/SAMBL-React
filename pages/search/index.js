import { useRouter } from "next/router";

async function checkArtist(spfId) {
    const response = await fetch(`/api/lookupArtist?spotifyId=${spfId}`);
    if (response.ok) {
        const mbid = await response.json();
        if (mbid) {
            router.push(`/artist?spid=${spfId}&artist_mbid=${mbid}`);
        } else {
            router.push(`/newartist?spid=${spfId}`);
        }
    } else {
        dispError("Spotify artist not found!");
    }
}

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
                        <div id="artistList" />
                        <div id="statusText" />
                    </div>
                </div>
            </div>
        </>

    )
}