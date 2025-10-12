//Transcribed from https://github.com/Strvm/musicxmatch-api
// Strvm/musicxmatch-api: a reverse engineered API wrapper for MusicXMatch  
// Copyright (c) 2025 Strvm

// Permission is hereby granted, free of charge, to any person obtaining a copy  
// of this software and associated documentation files (the "Software"), to deal  
// in the Software without restriction, including without limitation the rights  
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
// copies of the Software, and to permit persons to whom the Software is  
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all  
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
// SOFTWARE.
import crypto from 'crypto';
import axios from 'axios';
import { Buffer } from 'buffer';

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36";
const SIGNATURE_KEY_BASE_URL = "https://s.mxmcdn.net/site/js/";

const EndPoints = {
    GET_ARTIST: "artist.get",
    GET_TRACK: "track.get",
    GET_TRACK_LYRICS: "track.lyrics.get",
    SEARCH_TRACK: "track.search",
    SEARCH_ARTIST: "artist.search",
    GET_ARTIST_CHART: "chart.artists.get",
    GET_TRACT_CHART: "chart.tracks.get",
    GET_ARTIST_ALBUMS: "artist.albums.get",
    GET_ALBUM: "album.get",
    GET_ALBUM_TRACKS: "album.tracks.get",
    GET_TRACK_LYRICS_TRANSLATION: "crowd.track.translations.get",
    GET_TRACK_RICHSYNC: "track.richsync.get"
};

class MusixMatchAPI {
    constructor(proxies = null, cookie = null, base_url = null) {
        this.alternate_base_url = base_url ? `${base_url}/ws/1.1/` : null;
        this.base_url = "https://www.musixmatch.com/ws/1.1/";
        this.headers = {
            "User-Agent": USER_AGENT,
            "Cookie": cookie || 'mxm_bab=BA',
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.musixmatch.com/",
            "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Chrome OS"',
        };
        this.proxies = proxies;
        this.secret = this.get_secret();
    }

    async get_latest_app() {
        const url = "https://www.musixmatch.com/search";
        const headers = {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Cookie": "mxm_bab=BA"
        };
        const response = await axios.get(url, { headers: headers });
        const html_content = response.data;

        const pattern = /src="([^"]*\/_next\/static\/chunks\/pages\/_app-[^"]+\.js)"/g;
        const matches = [...html_content.matchAll(pattern)];

        if (matches.length) {
            const latest_app_url = matches[matches.length - 1][1];
            return latest_app_url;
        } else {
            throw new Error("_app URL not found in the HTML content.");
        }
    }

    async get_secret() {
        const data = await axios.get(
            await this.get_latest_app(),
            { headers: this.headers, proxies: this.proxies, timeout: 10000 }
        );
        const javascript_code = data.data;

        const pattern = /from\(\s*"(.*?)"\s*\.split/g;
        const match = javascript_code.match(pattern);

        if (match) {
            const encoded_string = match[0].replace(/from\(\s*"/, "").replace(/"\s*\.split/g, "");
            const reversed_string = encoded_string.split("").reverse().join("");

            const decoded_bytes = Buffer.from(reversed_string, 'base64');
            const decoded_string = decoded_bytes.toString("utf-8");
            return decoded_string;
        } else {
            throw new Error("Encoded string not found in the JavaScript code.");
        }
    }

    async generate_signature(url) {
        const current_date = new Date();
        const l = current_date.getFullYear().toString();
        const s = String(current_date.getMonth() + 1).padStart(2, '0');
        const r = String(current_date.getDate()).padStart(2, '0');
        const message = (url + l + s + r);
        const key = this.secret;
        const hash_output = crypto.createHmac('sha256', await key).update(message).digest();
        const signature = "&signature=" + encodeURIComponent(hash_output.toString('base64')) + "&signature_protocol=sha256";
        return signature;
    }

    async search_tracks(track_query, page = 1) {
        const url = `${EndPoints.SEARCH_TRACK}?app_id=web-desktop-app-v1.0&format=json&q=${encodeURIComponent(track_query)}&f_has_lyrics=true&page_size=100&page=${page}`;
        return await this.make_request(url);
    }

    async get_track(track_id = null, track_isrc = null) {
        if (!(track_id || track_isrc)) {
            throw new Error("Either track_id or track_isrc must be provided.");
        }

        const param = track_id ? `track_id=${track_id}` : `track_isrc=${track_isrc}`;
        const url = `${EndPoints.GET_TRACK}?app_id=web-desktop-app-v1.0&format=json&${param}`;
        return await this.make_request(url);
    }

    async get_track_lyrics(track_id = null, track_isrc = null) {
        if (!(track_id || track_isrc)) {
            throw new Error("Either track_id or track_isrc must be provided.");
        }

        const param = track_id ? `track_id=${track_id}` : `track_isrc=${track_isrc}`;
        const url = `${EndPoints.GET_TRACK_LYRICS}?app_id=web-desktop-app-v1.0&format=json&${param}`;
        return await this.make_request(url);
    }

    async get_artist_chart(country = "US", page = 1) {
        const url = `${EndPoints.GET_ARTIST_CHART}?app_id=web-desktop-app-v1.0&format=json&page_size=100&country=${country}&page=${page}`;
        return await this.make_request(url);
    }

    async get_track_chart(country = "US", page = 1) {
        const url = `${EndPoints.GET_TRACT_CHART}?app_id=web-desktop-app-v1.0&format=json&page_size=100&country=${country}&page=${page}`;
        return await this.make_request(url);
    }

    async search_artist(query, page = 1) {
        const url = `${EndPoints.SEARCH_ARTIST}?app_id=web-desktop-app-v1.0&format=json&q_artist=${encodeURIComponent(query)}&page_size=100&page=${page}`;
        return await this.make_request(url);
    }

    async get_artist(artist_id) {
        const url = `${EndPoints.GET_ARTIST}?app_id=web-desktop-app-v1.0&format=json&artist_id=${artist_id}`;
        return await this.make_request(url);
    }

    async get_artist_albums(artist_id, page = 1) {
        const url = `${EndPoints.GET_ARTIST_ALBUMS}?app_id=web-desktop-app-v1.0&format=json&artist_id=${artist_id}&page_size=100&page=${page}`;
        return await this.make_request(url);
    }

    async get_album(album_id) {
        const url = `${EndPoints.GET_ALBUM}?app_id=web-desktop-app-v1.0&format=json&album_id=${album_id}`;
        return await this.make_request(url);
    }

    async get_album_tracks(album_id, page = 1) {
        const url = `${EndPoints.GET_ALBUM_TRACKS}?app_id=web-desktop-app-v1.0&format=json&album_id=${album_id}&page_size=100&page=${page}`;
        return await this.make_request(url);
    }

    async get_track_lyrics_translation(track_id, selected_language) {
        const url = `${EndPoints.GET_TRACK_LYRICS_TRANSLATION}?app_id=web-desktop-app-v1.0&format=json&track_id=${track_id}&selected_language=${selected_language}`;
        return await this.make_request(url);
    }

    async get_track_richsync(commontrack_id = null, track_id = null, track_isrc = null, f_richsync_length = null, f_richsync_length_max_deviation = null) {
        const base_url = `${EndPoints.GET_TRACK_RICHSYNC}?app_id=web-desktop-app-v1.0&format=json`;

        if (commontrack_id) base_url += `&commontrack_id=${commontrack_id}`;
        if (track_id) base_url += `&track_id=${track_id}`;
        if (track_isrc) base_url += `&track_isrc=${track_isrc}`;
        if (f_richsync_length) base_url += `&f_richsync_length=${f_richsync_length}`;
        if (f_richsync_length_max_deviation) base_url += `&f_richsync_length_max_deviation=${f_richsync_length_max_deviation}`;

        return await this.make_request(base_url);
    }

    async make_request(url) {
        url = url.replace(/%20/g, "+").replace(/ /g, "+");
        url = this.base_url + url;
        let signed_url = url + await this.generate_signature(url);
        if (this.alternate_base_url) {
            signed_url = signed_url.replace(this.base_url, this.alternate_base_url);
        }
        const response = await axios.get(signed_url, { headers: this.headers, proxies: this.proxies, timeout: 10000 });
        return response.data;
    }
}

export default MusixMatchAPI;