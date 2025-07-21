import spotify from "./providers/spotify";
import musicbrainz from "./providers/musicbrainz";
import musixmatch from "./providers/musixmatch";
import deezer from "./providers/deezer";
import logger from "../../utils/logger";


export default async function handler(req, res) {
	try {
		const { query, type } = req.query;
		if (!query) {
			return res.status(400).json({ error: "Parameter `query` is required" });
		}
		if (!type) {
			return res.status(400).json({ error: "Parameter `type` is required" });
		}
		let urls = [];

        if (type === "ISRC") {
            let MxMurls = await musixmatch.clientGetTrackByISRC(query);
            if (MxMurls && MxMurls.length > 0) {
               urls.push({
                    provider: "musixmatch",
                    urls: MxMurls,
                });
            }
        } 

		res.status(200).json({ urls: urls });
	} catch (error) {
		logger.error("Error in find API", error);
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}
