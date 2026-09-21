import providers from "../../lib/providers/providers";
import logger from "../../utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
import { AlbumData, RawAlbumData } from "../../types/provider-types";
import normalizeVars from "../../utils/normalizeVars";
import { SAMBLApiError } from "../../types/api-types";
import ServerAPIHandler from "../../utils/serverAPIHandler";
import { Stages } from "../../utils/timings";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const stages = new Stages();
	const api = new ServerAPIHandler('getArtistAlbums', res, stages, ['provider_id', 'provider', 'offset', 'limit'])
	try {
		var { provider_id, provider, offset, limit } = normalizeVars(req.query);
		const forceRefresh = Object.prototype.hasOwnProperty.call(req.query, "forceRefresh");
		if (!provider_id || !provider) {
			return api.response(400, { error: { error: "Parameters `provider_id` and `provider` are required", parameters: ['provider_id', 'provider'] } });
		}
		let providerObj = providers.parseProvider(provider, ["getArtistAlbums", "formatAlbumGetData", "formatAlbumObject"]);
		if (!providerObj) {
			return api.response(400, { error: { error: "Provider doesn't exist or doesn't support this operation" } });
		}
		stages.start('Get source artist albums', providerObj.namespace);
		let rawData = await providerObj.getArtistAlbums(provider_id, offset, Number(limit), { noCache: forceRefresh });
		stages.end('Get source artist albums');
		let data: RawAlbumData = providerObj.formatAlbumGetData(rawData);
		let formattedData: AlbumData = {
			...data,
			albums: data.albums.map(album => providerObj.formatAlbumObject(album))
		}
		api.response<AlbumData>(200, { data: formattedData });
	} catch (error) {
		logger.error("Error in getArtistAlbums API", error)
		api.response(500, { error: { error: "Internal Server Error", details: error.message } });
	}
}
