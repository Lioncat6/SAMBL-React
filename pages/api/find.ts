import logger from "../../utils/logger";
import { FindData, SAMBLApiError } from "../../types/api-types";
import { AlbumObject, TrackObject } from "../../types/provider-types";
import { NextApiRequest, NextApiResponse } from "next";
import providers from "../../lib/providers/providers";
import normalizeVars from "../../utils/normalizeVars";
function createDataObject(source, imageUrl, title, artists, info, link, extraInfo = null) {
	return {
		source: source,
		imageUrl: imageUrl,
		title: title,
		artists: artists,
		info: info.filter((element) => element),
		link: link,
		extraInfo: extraInfo,
	};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
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
			for (const provider of providerList){
				try {
					const rawData = await provider.getAlbumByUPC(query)
					if (rawData) rawData.forEach((album) => albums.push(album))
				} catch (error) {
					logger.error(error)
					issues.push(<SAMBLApiError>{provider: provider.namespace, error: error.message || error.toString()})
				}
			}
			return res.status(200).json({type: "UPC", data: albums, issues} as FindData)

		} else if (type.toLocaleLowerCase() == "isrc") {
			let tracks: TrackObject[] = []
			const providerList = providers.getAllProviders(["getTrackByISRC"]);
			for (const provider of providerList){
				try {
					const rawData = await provider.getTrackByISRC(query)
					if (rawData) rawData.forEach((track) => tracks.push(track))
				} catch (error) {
					logger.error(error)
					issues.push(<SAMBLApiError>{provider: provider.namespace, error: error.message || error.toString()})
				}
			}			
			return res.status(200).json({type: "UPC", data: tracks, issues} as FindData)
		} else {
			return res.status(400).json({ error: "Invalid query type!" } as SAMBLApiError);
		}
	} catch (error) {
		logger.error("Error in find API", error);
		res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
	}
}
