import React, { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
    const [errorMessage, setErrorMessage] = useState(""); // State for error message
    const router = useRouter();

    async function handleSearch() {
        const query = document.getElementById("searchbox").value.trim();
        if (query !== "") {
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const spfPattern = /^[A-Za-z0-9]{22}$/;

            if (query.includes("https://open.spotify.com/artist/")) {
                const match = query.match(/\/artist\/([^/?]+)/);
                if (match) {
                    const spfId = match[1];
                    await fetchSpotifyArtist(spfId);
                } else {
                    setErrorMessage("Invalid Spotify artist link!");
                }
            } else if (spfPattern.test(query)) {
                const spfId = query;
                await fetchSpotifyArtist(spfId);
            } else if (uuidPattern.test(query)) {
                setErrorMessage("MB Lookup isn't currently supported; Please enter a Spotify artist link instead!");
            } else if (query.includes("https://open.spotify.com/")) {
                setErrorMessage("This type of link isn't currently supported; Please enter a Spotify artist link instead!");
            } else {
                if (query.includes("https")) {
                    setErrorMessage("This type of link isn't currently supported!");
                } else {
                    router.push(`/search?query=${encodeURIComponent(query)}`);
                }
            }
        } else {
            setErrorMessage("Please enter a query");
        }
    }

    async function fetchSpotifyArtist(spfId) {
        try {
            const response = await fetch(`/api/spotify?artistId=${spfId}`);
            if (response.ok) {
                const data = await response.json();
                console.log(data);
            } else {
                setErrorMessage("Failed to fetch Spotify artist data.");
            }
        } catch (error) {
            console.error(error);
            setErrorMessage("An error occurred while fetching Spotify artist data.");
        }
    }

    return (
        <>
            <div id="main">
                <textarea
                    id="searchbox"
                    rows={1}
                    placeholder="Search for artist or enter id/url..."
                    defaultValue={""}
                />
                <button type="button" id="searchEnter" onClick={handleSearch}>
                    Search
                </button>
                {errorMessage && <div id="err">{errorMessage}</div>} {/* Render error message */}
                <div id="loadingMsg" />
            </div>
        </>
    );
}