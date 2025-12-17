import getConfig from "next/config";

const encode = str => encodeURIComponent(str).replace(/%250A/g, '%0A');

/**
 * Generate Edit note String
 *
 * @param {string} edit The type of edit being made (e.g., "Artist image", "Track ISRC", etc.).
 * @param {string} provider The provider of the content (e.g., "Spotify", "Deezer", etc.).
 * @param {string} sourceUrl The URL of the source content.
 * @param {string} artistUrl The URL of the artist's page.
 * @returns {string} The formatted edit note string.
 */
function buildEditNote(edit, provider, sourceUrl, artistUrl, pageUrl = null) {
	const { publicRuntimeConfig } = getConfig();
    return encode(
        `${edit} imported from ''SAMBL''%0A
        '''Provider:''' ${provider}%0A
        '''Source:''' ${sourceUrl}%0A
        '''Artist:''' ${artistUrl}%0A
        ${pageUrl ? `'''SAMBL URL:''' ${pageUrl}%0A` : ''}
        %0A
        '''SAMBL ${publicRuntimeConfig.version}''': https://sambl.lioncat6.com | https://github.com/lioncat6/SAMBL-React
    `);
}

function buildDeepSearchEditNote(data) {
    const { publicRuntimeConfig } = getConfig();
return encode(`Artist found with ''SAMBL Deep Search''%0A
    '''Provider:''' ${data.provider}%0A
    '''Albums:'''%0A
    ${data.albums.map(album => ` • '''${album.title}''' ''Barcode: ${album.upc}'' ${album.url}%0A''Artists:'' ${album.artists?.map(artist => artist.id).join(", ") || "none"}`).join("%0A ")}%0A%0A
    '''Most Common MBID:''' ${data.mostCommonMbid}%0A
    '''Name Similarity:''' ${Math.round(data.nameSimilarity * 100)}%%0A
    ${data.method=="most_common" ? `'''Method:''' Most Common MBID (${data.mostCommonMbid})%0A` : `'''Method:''' Name Similarity (''${Math.round(data.nameSimilarity * 100)}%'')%0A• ''Provider Name: ${data.sourceName}''%0A• ''Name in Musicbrainz: ${data.mbName}''`}
    %0A%0A'''SAMBL ${publicRuntimeConfig.version}''': https://sambl.lioncat6.com | https://github.com/lioncat6/SAMBL-React
    `);
}

const editNoteBuilder = {
    buildEditNote,
    buildDeepSearchEditNote
}

export default editNoteBuilder;