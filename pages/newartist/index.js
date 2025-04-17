import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ArtistInfo from "../../components/ArtistInfo";

async function getArtist(spfId) {
    const response = await fetch(`/api/getArtistInfo?spotifyId=${spfId}`);
    if (response.ok) {
        return await response.json();
    } else {
        throw new Error("Spotify artist not found!");
    }
}

export default function NewArtist() {
    const router = useRouter();
    const { spid } = router.query;

    const [artist, setArtist] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (spid) {
            // Fetch artist data when spid is available
            getArtist(spid)
                .then((data) => {
                    console.log(data)
                    setArtist({
                        name: data.name,
                        imageUrl: data.images[0]?.url || "",
                        genres: data.genres,
                        followers: data.followers.total,
                        popularity: data.popularity,
                        spotifyId: spid,
                    });
                })
                .catch((err) => {
                    console.error(err);
                    setError("Failed to fetch artist data.");
                });
        }
    }, [spid]); // Run the effect when spid changes

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!artist) {
        return <div>Loading...</div>; // Show a loading state while fetching data
    }

    return (
        <>
            <ArtistInfo artist={artist} />
        </>
    );
}