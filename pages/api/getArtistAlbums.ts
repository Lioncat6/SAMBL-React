import spotify from "./providers/spotify";
import providers from "./providers/providers";
import musicbrainz from "./providers/musicbrainz";
import logger from "../../utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
import { AlbumData, FullProvider, RawAlbumData } from "../../types/provider-types";
import normalizeVars from "../../utils/normalizeVars";
export default async function handler(req:NextApiRequest, res:NextApiResponse) {
	try {
		var { provider_id, provider, offset, limit } = normalizeVars(req.query);
		const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
		if (!provider_id || !provider) {
			return res.status(400).json({ error: "Parameters `provider_id` and `provider` are required" });
        }
		let providerObj = providers.parseProvider(provider, ["getArtistAlbums", "formatAlbumGetData", "formatAlbumObject"]);
		if (!providerObj) {
            return res.status(400).json({ error: "Provider doesn't exist or doesn't support this operation" });
        }
		let rawData = await providerObj.getArtistAlbums(provider_id, offset, Number(limit), { noCache: forceRefresh });
		let data: RawAlbumData = providerObj.formatAlbumGetData(rawData);
		let formattedData: AlbumData = {
			...data,
			albums: data.albums.map(album => providerObj.formatAlbumObject(album))
		}
		res.status(200).json(formattedData);
	} catch (error) {
		logger.error("Error in getArtistAlbums API", error)
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}
