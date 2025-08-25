import spotify from "./providers/spotify";
import providers from "./providers/providers";
import musicbrainz from "./providers/musicbrainz";
import logger from "../../utils/logger";

export default async function handler(req, res) {
	try {
		var { provider_id, provider, offset, limit } = req.query;
		const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
		if (!provider_id || !provider) {
			return res.status(400).json({ error: "Parameters `provider_id` and `provider` are required" });
        }
		let providerObj = providers.parseProvider(provider, ["getArtistAlbums"])
		if (!providerObj) {
            return res.status(400).json({ error: "Provider doesn't exist or doesn't support this operation" });
        }
		let data = await providerObj.getArtistAlbums(provider_id, offset, limit, { noCache: forceRefresh });
		data = providerObj.formatAlbumGetData(data);
		data.albums = data.albums.map(album => providerObj.formatAlbumObject(album));
		res.status(200).json(data);
	} catch (error) {
		logger.error(error)
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}
