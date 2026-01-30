import musicbrainz from "./providers/musicbrainz";
import providers from "./providers/providers";
import logger from "../../utils/logger";
import { FullProvider } from "./providers/provider-types";
import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { ArtistSearchData } from "./api-types";
/**
 * @swagger
 * /api/searchArtists:
 *   get:
 *     summary: Search artists by name using a specified provider
 *     description: Returns formatted artist data including MusicBrainz IDs when available.
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: The artist name to search for.
 *       - in: query
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: The provider to use for the search (e.g., 'spotify').
 *     responses:
 *       200:
 *         description: A list of matched artists with metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Artist's name
 *                   url:
 *                     type: string
 *                     description: Provider-specific artist URL
 *                   mbid:
 *                     type: string
 *                     nullable: true
 *                     description: MusicBrainz ID if available
 *       400:
 *         description: Bad request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Parameter `query` is required
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 *                 details:
 *                   type: string
 *                   example: Error details
 */

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
    try {
        const { query, provider } = normalizeVars(req.query);
        if (!query) {
            return res.status(400).json({ error: "Parameter `query` is required" });
        }
        let sourceProvider: FullProvider | false = provider ? providers.parseProvider(provider, ["searchByArtistName", "formatArtistSearchData", "formatArtistObject", "getArtistUrl"]): false;
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` });
        }
        let results = await sourceProvider.searchByArtistName(query);
        let artistUrls: string[] = [];
        let artistData: ArtistSearchData = {};
        const artistAdditionalUrls: Record<string, string[]> = {};
        for (let artist of sourceProvider.formatArtistSearchData(results)) {
            // TODO: Decide how to refactor for all sources.
            let providerArtistUrls = sourceProvider.getArtistUrl(artist);
            if (!providerArtistUrls) continue;
            if (!Array.isArray(providerArtistUrls)) providerArtistUrls = [ providerArtistUrls ];
            artistUrls.push(providerArtistUrls[0]);
            artistData[providerArtistUrls[0]] = sourceProvider.formatArtistObject(artist);
            for (const artistUrl of providerArtistUrls.slice(1)) {
                artistAdditionalUrls[providerArtistUrls[0]] ??= [];
                artistAdditionalUrls[providerArtistUrls[0]].push(artistUrl);
            }
        }
        if (artistUrls.length == 0) {
            return res.status(200).json({})
        }
        let mbids = await musicbrainz.getIdsByExternalUrls([ ...artistUrls, ...Object.values(artistAdditionalUrls).flat() ]);
        if (mbids) {
            for (let url of artistUrls) {
                artistData[url].mbid = mbids[url] || mbids[url+"/"] || artistAdditionalUrls[url]?.map(additionalUrl => mbids[additionalUrl]).find(Boolean) || null
            }
        }
        return res.status(200).json(artistData);
	} catch (error) {
        logger.error("Error in searchArtists API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
