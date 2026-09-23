//  async function refreshData(fetchISRCs = false) {
// setIsLoading(true);
// try {
//     const response = await toasts.dispPromise(fetch(`/api/compareSingleAlbum?url=${url.url}&mbid=${sourceArtist?.mbid}&artist_id=${sourceArtist?.id}${fetchISRCs ? '&fetchISRCs' : ""}`), "Refreshing album...", "Failed to fetch album");
//     setIsLoading(false);
//     if (response.ok) {
//         const apiResponse = await response.json() as SAMBLAPIResponse<AlbumStack>;
//         const album = apiResponse.data
//         if (onUpdate && album) onUpdate(album as DisplayAlbum);
//     } else {
//         try {
//             const apiResponse = await response.json() as SAMBLAPIResponse<AlbumStack>;
//             toasts.error("Failed to refresh album data!", apiResponse.error?.error);
//         } catch {
//             toasts.error("Failed to refresh album data!", `Failed to refresh album data: ${response.status} ${response.statusText}`);
//         }
//     }
// } catch (e) {
//     toasts.error("Failed to refresh album data!", e);
// }

import { APITimingData, SAMBLAPIResponse } from "../types/api-types";


export async function SAMBLFetch<T>(path: URL | string, isSSR = false): Promise<[T, APITimingData | null]> {
    const response = await fetch(`${isSSR ? `http://localhost:${process.env.PORT || 3000}` : ''}${path.toString()}`).catch(
        (error) => {
            throw new Error(`Error occured while fetching data from server: ${error}`)
        })
    if (response.ok) {
        const data = await response.json() as SAMBLAPIResponse<T>
        if (!data.data) throw new Error("Server returned no data");
        return [data.data, data.timings ?? null];
    } else {
        const data = await response.json().catch(() => null) as SAMBLAPIResponse<never>
        console.log(data.error?.error)
        if (data.error?.error) {
            throw new Error(`Recieved error from server: (${response.status}) ${data.error.error}${data.error.details ? ` | ${data.error.details}` : ''}`)
        }
        throw new Error(`Recieved unknown error from server: ${response.status} - ${response.statusText}`)
    }
}

export async function RawSAMBLFetch<T>(path: URL | string, isSSR = false): Promise<SAMBLAPIResponse<T>> {
    const response = await fetch(`${isSSR ? `http://localhost:${process.env.PORT || 3000}` : ''}${path.toString()}`).catch(
        (error) => {
            throw new Error(`Error occured while fetching data from server: ${error}`)
        })
    if (response.ok) {
        const data = await response.json() as SAMBLAPIResponse<T>
        return data;
    } else {
        const data = await response.json().catch(() => null) as SAMBLAPIResponse<never>
        if (data.error?.error) {
            return data;
        }
        throw new Error(`Recieved unknown error from server: ${response.status} - ${response.statusText}`)
    }
}