import musicbrainz from "../../lib/providers/musicbrainz";
import providers from "../../lib/providers/providers";
import logger from "../../utils/logger";
import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import { ArtistSearchData } from "../../types/api-types";
import { SAMBLApiError } from "../../types/api-types";
import { ArtistObject } from "../../types/provider-types";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { query, provider } = normalizeVars(req.query);
        if (!query) {
            return res.status(400).json({ error: "Parameter `query` is required" } as SAMBLApiError);
        }
        let sourceProvider = provider ? providers.parseProvider(provider, ["searchByArtistName", "formatArtistSearchData", "formatArtistObject"]) : false;
        if (!sourceProvider) {
            return res.status(400).json({ error: `Provider \`${provider}\` does not support this operation` } as SAMBLApiError);
        }
        let results = await sourceProvider.searchByArtistName(query);
        let artists: ArtistObject[] = [];
        let artistData: ArtistSearchData = {};
        for (let artist of sourceProvider.formatArtistSearchData(results)) {
            const formattedArtist = sourceProvider.formatArtistObject(artist);
            artists.push(formattedArtist);
            artistData[formattedArtist.url] = formattedArtist;
        }
        if (artists.length == 0) {
            return res.status(200).json({})
        }
        let regexProvider = provider ? providers.parseProvider(provider, ["searchByArtistName", "formatArtistSearchData", "formatArtistObject", "buildUrlSearchQuery"]) : false;
        if (regexProvider) {
            let urlQuery = regexProvider.buildUrlSearchQuery("artist", artists.map((artist) => artist.id));
            const urlResults = await musicbrainz.getIdsByUrlQuery(urlQuery);
            if (urlResults){
                for (let artist of artists) {
                    artistData[artist.url].mbid = urlResults[artist.id] || null;
                }
            }
            res.status(200).json(artistData);
        }
        let mbids = await musicbrainz.getIdsByExternalUrls(artists.map((artist) => artist.url));
        if (mbids) {
            for (let artist of artists) {
                artistData[artist.url].mbid = mbids[artist.url] || mbids[artist.url + "/"] || null
            }
        }
        return res.status(200).json(artistData);
    } catch (error) {
        logger.error("Error in searchArtists API:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}
