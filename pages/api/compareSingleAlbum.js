import logger from "../../utils/logger";
import providers from "./providers/providers"
import musicbrainz from "./providers/musicbrainz";

import processData from "../../utils/processAlbumData";

export default async function handler(req, res) {
    try {
		var { provider_id, provider, url, mbid } = req.query;

        if (provider_id && !provider) {
            return res.status(400).json({ error: "Provider must be specified when provider_id is provided" });
        }
        if (!provider_id && !url) {
            return res.status(400).json({ error: "Either `provider_id` or `url` must be provided" });
        }
        if (url) {
            const urlInfo = providers.getUrlInfo(url);
            if (!urlInfo) {
                return res.status(400).json({ error: "Invalid URL" });
            }
            provider_id = urlInfo.id;
            provider = urlInfo.provider.namespace;
        }
        const providerObj = providers.parseProvider(provider, ["getAlbumById", "formatAlbumObject"]);

        if (!providerObj) {
            return res.status(400).json({ error: "Provider doesn't exist or doesn't support this operation" });
        }

		if (mbid & !musicbrainz.validateMBID(mbid)) {
			return res.status(400).json({ error: "Parameter `mbid` is missing or malformed" });
		}

        if (!providerObj) {
            return res.status(400).json({ error: "Provider doesn't exist or doesn't support this operation" });
        }

        let sourceAlbum = await providerObj.getAlbumById(provider_id, { noCache: true });
        if (!sourceAlbum) {
            return res.status(404).json({ error: "Album not found" });
        }
        sourceAlbum = providerObj.formatAlbumObject(sourceAlbum);
        let mbAlbum = null;
        let urlResults = (await musicbrainz.getAlbumsBySourceUrls([sourceAlbum.url], ["release-rels"], { noCache: true })).urls[0];
        if (urlResults && urlResults?.relations?.length > 0) {
            mbAlbum = await musicbrainz.getAlbumByMBID(urlResults.relations[0].release.id, ["url-rels", "recordings", "isrcs"], { noCache: true });
        } else {
            let mbSearch = await musicbrainz.serachForAlbumByArtistAndTitle(mbid, sourceAlbum.name, { noCache: true })
            if (mbSearch && mbSearch?.releases?.length > 0) {
                mbAlbum = await musicbrainz.getAlbumByMBID(mbSearch.releases[0].id, ["url-rels", "recordings", "isrcs"], { noCache: true });
            }
        }
        let albumData = processData([sourceAlbum], [mbAlbum], mbid);
        if (albumData?.albumData && albumData?.albumData.length > 0) {
            res.status(200).json(albumData.albumData[0]);
        }
    } catch (error) {
		logger.error("Error in CompareSingleAlbum API", error);
		res.status(500).json({ error: "Internal Server Error", details: error.message });
	}
}