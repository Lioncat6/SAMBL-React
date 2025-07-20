import musicbrainz from "./providers/musicbrainz";

export default async function handler(req, res) {
    try {
        const { mbid, featured } = req.query;
        if (!mbid || !musicbrainz.validateMBID(mbid)) {
            return res.status(400).json({ error: "Parameter `mbid` is missing or malformed" });
        }

        const releaseCount = await musicbrainz.getArtistReleaseCount(mbid);
        if (releaseCount === null) {
            return res.status(404).json({ error: "Artist not found" });
        }

        if (featured) {
            const featuredCount = await musicbrainz.getArtistFeaturedReleaseCount(mbid); 
            releaseCount += featuredCount;
        }

        res.status(200).json({ releaseCount });
    } catch (error) {
        console.error("Error in getArtistReleaseCount API", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}