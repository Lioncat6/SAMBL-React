import logger from "../../utils/logger";
import { FindData, SAMBLApiError, SAMBLAPIResponse } from "../../types/api-types";
import { AlbumObject, ProviderWithCapabilities, TrackObject } from "../../types/provider-types";
import { NextApiRequest, NextApiResponse } from "next";
import providers from "../../lib/providers/providers";
import normalizeVars from "../../utils/normalizeVars";
import { Stages } from "../../utils/timings";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const stages = new Stages()
		const { query, type } = normalizeVars(req.query);
		if (!query) {
			return res.status(400).json({ error: "Parameter `query` is required" });
		}
		if (!type) {
			return res.status(400).json({ error: "Parameter `type` is required" });
		}
		let resultItems = [];
		let issues: SAMBLApiError[] = [];

		if (type.toLocaleLowerCase() == "upc") {
			let albums: AlbumObject[] = []
			const providerList = providers.getAllProviders(["getAlbumByUPC"]);
			const fetches: Promise<void>[] = [];
			for (const provider of providerList){
				async function albumFetch(query: string, provider: ProviderWithCapabilities<"getAlbumByUPC"[]>) {
					const stage = stages.start('Fetch album by UPC', provider.namespace);
					try {
						const rawData = await provider.getAlbumByUPC(query)
						if (rawData) rawData.forEach((album) => albums.push(album))
					} catch (error) {
						logger.error(error)
						issues.push(<SAMBLApiError>{provider: provider.namespace, error: error.message || error.toString()})
					}
					stage.end();
				}
				fetches.push(albumFetch(query, provider))
			}
			await Promise.all(fetches);
			return res.status(200).json({data: {type: "UPC", data: albums, issues}, timings: stages.finish()} as SAMBLAPIResponse<FindData>)

		} else if (type.toLocaleLowerCase() == "isrc") {
			let tracks: TrackObject[] = []
			const providerList = providers.getAllProviders(["getTrackByISRC"]);
			const fetches: Promise<void>[] = [];
			for (const provider of providerList){
				async function trackFetch(query: string, provider: ProviderWithCapabilities<"getTrackByISRC"[]>) {
					const stage = stages.start('Fetch track by ISRC', provider.namespace);
					try {
						const rawData = await provider.getTrackByISRC(query)
						if (rawData) rawData.forEach((track) => tracks.push(track))
					} catch (error) {
						logger.error(error)
						issues.push(<SAMBLApiError>{provider: provider.namespace, error: error.message || error.toString()})
					}
					stage.end()
				}
				fetches.push(trackFetch(query, provider))
			}			
			await Promise.all(fetches);
			return res.status(200).json({data: {type: "ISRC", data: tracks, issues}, timings: stages.finish()} as SAMBLAPIResponse<FindData>)
		} else {
			return res.status(400).json({error:{ error: "Invalid query type!" }} as SAMBLAPIResponse<FindData>);
		}
	} catch (error) {
		logger.error("Error in find API", error);
		res.status(500).json({error:{ error: "Internal Server Error", details: error.message }} as SAMBLAPIResponse<FindData>);
	}
}
