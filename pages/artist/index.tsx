import { useEffect, useState, useRef, RefObject } from "react";
import ArtistInfo from "../../components/ArtistInfo";
import Head from "next/head";
import ItemList from "../../components/ItemList";
import Notice from "../../components/notices";
import { useRouter } from "next/router";
import { SAMBLSettingsContext, useSettings } from "../../components/SettingsContext";
import processData from "../../utils/processAlbumData";
import { AlbumData, AlbumObject, ArtistObject, ExtendedAlbumData, ExtendedAlbumObject, ProviderNamespace } from "../../types/provider-types";
import { SAMBLApiError, ArtistData } from "../../types/api-types"
import { ArtistPageData, SAMBLError } from "../../types/component-types";
import ErrorPage from "../../components/ErrorPage";
import { AggregatedAlbum, AggregatedData } from "../../types/aggregated-types";
import toasts from "../../utils/toasts";

async function fetchArtistData(id: string, provider: ProviderNamespace | string) {
	const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/getArtistInfo?provider_id=${id}&provider=${provider}&mbData`);
	if (response.ok) {
		return await response.json() as ArtistData;
	} else {
		let errorMessage = "";
		try {
			const errorJson = await response.json() as SAMBLApiError;
			errorMessage = errorJson.details || errorJson.error;
		} catch {
			errorMessage = response.statusText;
		}
		throw new Error(`Failed to fetch artist data: ${errorMessage}`);
	}
}

export async function getServerSideProps(context) {
	try {
	let { spid, spids, artist_mbid, mbid, provider_id, provider_ids, provider, pid, pids }:
	 {spid?: string, spids?: string, artist_mbid?: string, mbid?: string, provider_id?: string, provider_ids?: string, provider?: string, pid?: string, pids?: string} = context.query;
	if (spid) provider_id = spid;
	if (spids) provider_ids = spids;
	if ((spid || spids) && !provider) provider = "spotify";
	if (pid) provider_id = pid;
	if (pids) provider_ids = pids;
	if (mbid) artist_mbid = mbid;
	const splitIds = provider_ids?.split(",");
	if (!provider_id && splitIds && splitIds.length > 0) provider_id = splitIds[0];

	if (!provider){
		const error: SAMBLError = {
			type: "parameter",
			parameters: ["provider"]
		}
		return {
			props: { error }
		}
	}

	if (!provider_id){
		const error: SAMBLError = {
			type: "parameter",
			parameters: ["provider_id"]
		}
		return {
			props: { error }
		}
	}

	if (!artist_mbid && provider_id || (splitIds && splitIds.length > 0)) {
		let ids = provider_id ? provider_id : (splitIds && splitIds[0]);
		const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/lookupArtist?provider_id=${ids}&provider=${provider}`);
		if (response.ok) {
			const { mbid: fetchedMBid } = await response.json();
			if (fetchedMBid) {
				let destination = `/artist?provider_id=${ids}&provider=${provider}&artist_mbid=${fetchedMBid}`;
				if (!spid && splitIds && splitIds?.length > 1) {
					destination = `/artist?provider_ids=${provider_ids}&provider=${provider}&artist_mbid=${fetchedMBid}`;
				}
				return {
					redirect: {
						destination: destination,
						permanent: false,
					},
				};
			}
		}
	}
	if (!provider_id && splitIds?.length == 1) {
		let destination = `/artist?spid=${splitIds[0]}${artist_mbid ? `&artist_mbid=${artist_mbid}` : ""}`;
		return {
			redirect: {
				destination: destination,
				permanent: false,
			},
		};
	}
	
		let data: ArtistObject[];
		let artist: ArtistPageData;
		if (!provider_id && provider_ids) {
			data = [];
			let pIDArray = splitIds || [];
			for (let id of pIDArray) {
				data.push((await fetchArtistData(id, provider)).providerData);
			}
			const uniqueNames = [...new Set(data.map((artist) => artist.name))];
			const genres = [...new Set(data.flatMap((artist) => artist.genres))].filter((genre) => genre?.trim() != "");
			let mostPopularArtist: ArtistObject | null = null;
			let mostPopularity = 0;
			for (let artist of data) {
				if (artist.popularity && artist.popularity > mostPopularity) {
					mostPopularArtist = artist;
					mostPopularity = artist.popularity;
				}
			}
			const totalFollowers = data.reduce(function (total, artist) {
				return total + (artist.followers || 0);
			}, 0);
			artist = {
				names: uniqueNames,
				name: uniqueNames.join(" / "),
				imageUrl: mostPopularArtist?.imageUrl || "",
				imageUrlSmall: mostPopularArtist?.imageUrlSmall || "",
				bannerUrl: mostPopularArtist?.bannerUrl || "",
				genres: genres.filter((genre) => genre != null),
				followers: totalFollowers,
				popularity: mostPopularArtist?.popularity || null,
				ids: pIDArray,
				id: pIDArray[0],
				provider: provider as ProviderNamespace || "spotify",
				mbid: artist_mbid || null,
				url: mostPopularArtist?.url || "",
				relevance: mostPopularArtist?.relevance || "",
				info: mostPopularArtist?.info || ""
			};
		} else {
			const fetchedArtist = (await fetchArtistData(provider_id, provider)).providerData;
			artist = {
				... fetchedArtist,
				mbid: artist_mbid || null,
			};
		}
		return {
			props: { artist },
		};
	} catch (error) {
		console.error(error);
		const samblError: SAMBLError = {
			type: "general",
			message: String(error)
		}
		return {
			props: {
				error: samblError
			}
		}
	}
}

async function fetchSourceAlbums(providerId: string, provider: ProviderNamespace, offset: string | number = 0, bypassCache = false) {
	return fetch(`/api/getArtistAlbums?provider_id=${providerId}&provider=${provider}&offset=${offset}&limit=50${bypassCache ? "&forceRefresh" : ""}`).then(async (response) => {
		if (!response.ok) {
			return response.status;
		}
		return await response.json() as AlbumData;
	});
}

async function fetchMbArtistAlbums(mbid, offset = 0, bypassCache = false) {
	return fetch(`/api/getMusicBrainzAlbums?mbid=${mbid}&offset=${offset}&limit=100${bypassCache ? "&forceRefresh" : ""}`).then(async (response) => {
		if (!response.ok) {
			return response.status;
		}
		return await response.json() as ExtendedAlbumData;
	});
}

async function fetchMbArtistFeaturedAlbums(mbid, offset = 0, bypassCache = false) {
	return fetch(`/api/getMusicBrainzFeaturedAlbums?mbid=${mbid}&offset=${offset}&limit=100${bypassCache ? "&forceRefresh" : ""}`).then(async (response) => {
		if (!response.ok) {
			return response.status;
		}
		return await response.json() as ExtendedAlbumData;
	});
}

async function fetchArtistReleaseCount(mbid) {
	const response = await fetch(`/api/getArtistReleaseCount?mbid=${mbid}&featured`);
	if (response.ok) {
		return await response.json();
	} else {
		return response.status;
	}
}

let loadArtistAlbums: ((bypassCache: boolean) => Promise<void> )| null = null;

export default function Artist({ artist, error }: {artist: ArtistPageData, error: SAMBLError} ) {
	if (error || !artist) {
		return <ErrorPage error={error} />
	}
	const { settings, loading: waitingForMount } = useSettings() as SAMBLSettingsContext;
	const router = useRouter();
	const { quickFetch } = router.query;
	const [isQuickFetched, setIsQuickFetched] = useState(false);
	const [albums, setAlbums] = useState<AggregatedAlbum[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusText, setStatusText] = useState("Loading albums...");
	// const { setExportData } = useExport(); // Access setExportData from context

	let sourceAlbumCount = -1;
	let mbAlbumCount = -1;
	let mbFeaturedAlbumCount = -1;
	let sourceAlbums: RefObject<AlbumObject[]> = useRef([]);
	let mbAlbums: RefObject<ExtendedAlbumObject[]> = useRef([]);
	let mbFeaturedAlbums: RefObject<ExtendedAlbumObject[]> = useRef([]);

	function resetData() {
		sourceAlbumCount = -1;
		mbAlbumCount = -1;
		mbFeaturedAlbumCount = -1;
		sourceAlbums.current = [];
		mbAlbums.current = [];
		mbFeaturedAlbums.current = [];
	}

	useEffect(() => {
		function updateLoadingText(musicBrainz = false) {
			if (musicBrainz) {
				if (mbAlbumCount > -1 && mbFeaturedAlbumCount > -1) {
					setStatusText(`Loading albums from musicbrainz... ${Number(mbAlbums.current.length) + Number(mbFeaturedAlbums.current.length)}/${Number(mbAlbumCount) + Number(mbFeaturedAlbumCount)}`);
				}
			} else {
				setStatusText(`Loading albums from ${artist.provider}... ${sourceAlbums.current.length}${sourceAlbumCount ? `/${sourceAlbumCount}`: ""}`);
			}
		}

		async function fetchProviderAlbums(provider_ids: string[], provider: ProviderNamespace, bypassCache = false) {
			let attempts = 0;
			for (const pid of provider_ids) {
				let offset: string | number | null = 0;
				let currentAlbumCount = 999;
				let fetchedAlbums = 0;
				while (offset != null) {
					try {
						const data = await fetchSourceAlbums(pid, provider, offset, bypassCache);
						if (typeof data === "number") {
							if (data === 404) {
								toasts.error(`Artist ID ${pid} not found!`);
								return;
							}
							throw new Error(`Error fetching provider albums: ${data}`);
						}
						sourceAlbums.current = [...sourceAlbums.current, ...data.albums];
						fetchedAlbums += data.albums.length;
						currentAlbumCount = data.count || 0;
						if (sourceAlbumCount < 0) {
							sourceAlbumCount = currentAlbumCount;
						}
						offset = data.next;
						updateLoadingText();
					} catch (error) {
						attempts++;
						console.error("Error fetching albums:", error);
					}
					if (attempts > 3) {
						toasts.error("Failed to fetch provider albums");
						break;
					}
				}
				sourceAlbumCount += currentAlbumCount;
			}
		}

		async function fetchMusicbrainzArtistAlbums(bypassCache = false) {
			let offset: number = 0;
			let attempts = 0;
			while (offset < mbAlbumCount || mbAlbumCount == -1) {
				try {
					const data = await fetchMbArtistAlbums(artist.mbid, offset, bypassCache);
					if (typeof data == "number") {
						if (data == 404) {
							toasts.error("MBID not found!");
							return;
						}
						throw new Error(`Error fetching MusicBrainz albums: ${data}`);
					}
					mbAlbums.current = [...mbAlbums.current, ...data.albums];
					mbAlbumCount = data.count || 0;
					offset = mbAlbums.current.length;
					updateLoadingText(true);
				} catch (error) {
					attempts++;
					console.error("Error fetching albums:", error);
				}
				if (attempts > 3) {
					toasts.error("Failed to MusicBrainz albums");
					break;
				}
			}
		}

		async function fetchMusicBrainzFeaturedAlbums(bypassCache = false) {
			let offset = 0;
			let attempts = 0;
			while (offset < mbFeaturedAlbumCount || mbFeaturedAlbumCount == -1) {
				try {
					const data = await fetchMbArtistFeaturedAlbums(artist.mbid, offset, bypassCache);
					if (typeof data == "number") {
						if (data == 404) {
							toasts.error("MBID not found!");
							return;
						}
						throw new Error(`Error fetching MusicBrainz Featured albums: ${data}`);
					}
					mbFeaturedAlbums.current = [...mbFeaturedAlbums.current, ...data.albums];
					mbFeaturedAlbumCount = data.count || 0;
					offset = mbFeaturedAlbums.current.length;
					updateLoadingText(true);
				} catch (error) {
					attempts++;
					console.error("Error fetching albums:", error);
				}
				if (attempts > 3) {
					toasts.error("Failed to fetch MusicBrainz Featured albums");
					return;
				}
			}
		}

		async function quickFetchAlbums(pId, provider, mbid, bypassCache = false) {
			let attempts = 0;
			while (attempts < 3) {
				try {
					const response = await fetch(`/api/compareArtistAlbums?provider_id=${pId}&provider=${provider}&mbid=${mbid}&quick${bypassCache ? "&forceRefresh" : ""}`);
					if (response.ok) {
						return await response.json() as AggregatedData;
					} else {
						throw new Error("Failed to fetch artist albums");
					}
				} catch (error) {
					attempts++;
					if (attempts >= 3) {
						throw error;
					}
				}
			}
			throw new Error("Maximum Quick Fetch attempts exceeded");
		}

		async function shouldQuickfetch() {
			if (waitingForMount) {
				await new Promise<void>((resolve) => {
					const interval = setInterval(() => {
						if (!waitingForMount) {
							clearInterval(interval);
							resolve();
						}
					}, 50);
				});
			}
			if (artist.mbid && settings?.quickFetchThreshold > 0) {
				try {
					const releaseCount = await fetchArtistReleaseCount(artist.mbid);
					if (releaseCount.releaseCount > settings?.quickFetchThreshold) {
						setIsQuickFetched(true);
						return true;
					} else if (typeof releaseCount == "number") {
						toasts.error("Failed to fetch artist release count!");
					}
				} catch (e) {
					console.error(e);
					toasts.error("Failed to fetch artist release count!");
				}
			}
			return false;
		}

		async function fetchAlbums(pids, provider, bypassCache = false) {
			await Promise.all([fetchProviderAlbums(pids, provider, bypassCache), fetchMusicbrainzArtistAlbums(bypassCache), fetchMusicBrainzFeaturedAlbums(bypassCache)]);
		}

		async function loadAlbums(bypassCache = false) {
			const providerIds = artist.ids ? artist.ids : [artist.id];
			let didQuickFetch = false;
			if (!artist.mbid) {
				await fetchProviderAlbums(providerIds, artist.provider, bypassCache);
			} else {
				if (providerIds.length > 1 || quickFetch) {
					await fetchAlbums(providerIds, artist.provider, bypassCache);
				} else {
					didQuickFetch = await shouldQuickfetch();
					if (!didQuickFetch) {
						await fetchAlbums(providerIds, artist.provider, bypassCache);
					}
				}
			}

			let data: AggregatedData;
			if (didQuickFetch) {
				data = await toasts.dispPromise(quickFetchAlbums(providerIds[0], artist.provider, artist.mbid, bypassCache), "Quick Fetching albums...", "Failed to quick fetch albums!");
			} else {
				data = processData(sourceAlbums.current, [ ...mbAlbums.current, ...mbFeaturedAlbums.current], artist.mbid, artist.id, artist.provider);
			}
			setStatusText(data.statusText);
			setAlbums(data.albumData);
			setLoading(false);
		}
		loadAlbums();
		loadArtistAlbums = loadAlbums;
	}, [artist.id, waitingForMount]);

	async function refreshAlbums() {
		setLoading(true);
		resetData();
		setStatusText("Refreshing albums...");
		loadArtistAlbums && await loadArtistAlbums(true);
	}
	return (
		<>
			<Head>
				<title>{`SAMBL • ${artist.name}`}</title>
				<meta name="description" content={`View Artist • ${artist.name} • ${artist.followers} Followers`} />
				{artist.imageUrl && <meta property="og:image" content={artist.imageUrl} />}
				<meta property="og:title" content={`SAMBL • ${artist.name}`} />
				<meta property="og:description" content={`View Artist • ${artist.name} • ${artist.followers} Followers`} />
			</Head>
			{!artist.mbid && <Notice type={"noMBID"} data={artist} />}
			{isQuickFetched && <Notice type={"quickFetched"} />}
			<ArtistInfo artist={artist} />
			<div id="contentContainer">{loading ? <ItemList type={"loadingAlbum"} text={statusText} refresh={refreshAlbums} items={[]} /> : <ItemList type={"album"} items={albums} text={statusText} refresh={refreshAlbums} />}</div>
		</>
	);
}
