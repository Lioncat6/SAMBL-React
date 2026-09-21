import logger from "../../utils/logger";
import { FindData, SAMBLApiError } from "../../types/api-types";
import { AlbumObject, ProviderWithCapabilities, TrackObject } from "../../types/provider-types";
import { NextApiRequest, NextApiResponse } from "next";
import providers from "../../lib/providers/providers";
import normalizeVars from "../../utils/normalizeVars";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const stages = new Stages()
	const api = new ServerAPIHandler('find', res, stages, ['query', 'type']);
	try {
		const { query, type } = normalizeVars(req.query);
		if (!query) {
			return api.response<FindData>(400, { error: { error: "Parameter `query` is required", parameters: ['query'] } });
		}
		if (!type) {
			return api.response<FindData>(400, { error: { error: "Parameter `type` is required", parameters: ['type'] } });
		}
		let resultItems = [];
		let issues: SAMBLApiError[] = [];

		if (type.toLocaleLowerCase() == "upc") {
			let albums: AlbumObject[] = []
			const providerList = providers.getAllProviders(["getAlbumByUPC"]);
			const fetches: Promise<void>[] = [];
			for (const provider of providerList) {
				async function albumFetch(query: string, provider: ProviderWithCapabilities<"getAlbumByUPC"[]>) {
					const stage = stages.start('Fetch album by UPC', provider.namespace);
					try {
						const rawData = await provider.getAlbumByUPC(query)
						if (rawData) rawData.forEach((album) => albums.push(album))
					} catch (error) {
						logger.error(error)
						issues.push(<SAMBLApiError>{ provider: provider.namespace, error: error.message || error.toString() })
					}
					stage.end();
				}
				fetches.push(albumFetch(query, provider))
			}
			await Promise.all(fetches);
			return api.response<FindData>(200, { data: { type: "UPC", data: albums, issues }});

		} else if (type.toLocaleLowerCase() == "isrc") {
			let tracks: TrackObject[] = []
			const providerList = providers.getAllProviders(["getTrackByISRC"]);
			const fetches: Promise<void>[] = [];
			for (const provider of providerList) {
				async function trackFetch(query: string, provider: ProviderWithCapabilities<"getTrackByISRC"[]>) {
					const stage = stages.start('Fetch track by ISRC', provider.namespace);
					try {
						const rawData = await provider.getTrackByISRC(query)
						if (rawData) rawData.forEach((track) => tracks.push(track))
					} catch (error) {
						logger.error(error)
						issues.push(<SAMBLApiError>{ provider: provider.namespace, error: error.message || error.toString() })
					}
					stage.end()
				}
				fetches.push(trackFetch(query, provider))
			}
			await Promise.all(fetches);
			return api.response<FindData>(200, { data: { type: "ISRC", data: tracks, issues }});
		} else {
			return api.response<FindData>(400, { error: { error: "Invalid query type!", parameters: ['query'] } });
		}
	} catch (error) {
		logger.error("Error in find API", error);
		return api.response<FindData>(500, { error: { error: "Internal Server Error", details: error.message } })
	}
}
