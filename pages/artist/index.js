import { useEffect, useState, useRef } from "react";
import ArtistInfo from "../../components/ArtistInfo";
import Head from "next/head";
import ItemList from "../../components/ItemList";
import Notice from "../../components/notices";
import { useRouter } from "next/router";
import { useSettings } from "../../components/SettingsContext";
import { toast, Flip } from "react-toastify";

import processData from "../../utils/processAlbumData";

async function fetchArtistData(id, provider) {
	const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/getArtistInfo?provider_id=${id}&provider=${provider}`);
	if (response.ok) {
		return await response.json();
	} else {
		throw new Error("Artist not found!");
	}
}

export async function getServerSideProps(context) {
	let { spid, spids, artist_mbid, mbid, provider_id, provider_ids, provider, pid, pids } = context.query;
	if (spid) provider_id = spid;
	if (spids) provider_ids = spids;
	if ((spid || spids) && !provider) provider = "spotify";
	if (pid) provider_id = pid;
	if (pids) provider_ids = pids;

	const splitIds = provider_ids?.split(",");
	if (!artist_mbid && !mbid) {
		const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/lookupArtist?provider_id=${provider_id || splitIds[0]}&provider=${provider}`);
		if (response.ok) {
			const { mbid: fetchedMBid } = await response.json();
			if (fetchedMBid) {
				let destination = `/artist?provider_id=${provider_id || splitIds[0]}&provider=${provider}&artist_mbid=${fetchedMBid}`;
				if (!spid && splitIds?.length > 1) {
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
		let destination = `/artist?spid=${splitIds[0]}${mbid || artist_mbid ? `&artist_mbid=${artist_mbid || mbid}` : ""}`;
		return {
			redirect: {
				destination: destination,
				permanent: false,
			},
		};
	}
	try {
		let data;
		let artist;
		if (!provider_id && provider_ids) {
			data = [];
			let pIDArray = splitIds;
			for (let id of pIDArray) {
				data.push((await fetchArtistData(id, provider)).providerData);
			}
			const uniqueNames = [...new Set(data.map((artist) => artist.name))];
			const genres = [...new Set(data.flatMap((artist) => artist.genres))].filter((genre) => genre?.trim() != "");
			let mostPopularIndex = 0;
			let mostPopularity = 0;
			for (let artist in data) {
				if (data[artist].popularity > mostPopularity) {
					mostPopularIndex = artist;
					mostPopularity = data[artist].popularity;
				}
			}
			const totalFollowers = data.reduce(function (total, artist) {
				return total + artist.followers;
			}, 0);
			artist = {
				names: uniqueNames,
				name: uniqueNames.join(" / "),
				imageUrl: data[mostPopularIndex].imageUrl || "",
				bannerUrl: data[mostPopularIndex].bannerUrl || "",
				genres: genres.join(", "),
				followers: totalFollowers,
				popularity: data[mostPopularIndex].popularity,
				provider_ids: pIDArray,
				provider: provider || "spotify",
				mbid: artist_mbid || mbid || null,
				url: data[mostPopularIndex].url || null
			};
		} else {
			data = (await fetchArtistData(provider_id, provider)).providerData;
			artist = {
				name: data.name,
				imageUrl: data.imageUrl || "",
				bannerUrl: data.bannerUrl || "",
				genres: data.genres ? data.genres.join(", ") : "",
				followers: data.followers,
				popularity: data.popularity,
				provider_id: provider_id,
				provider: provider || "spotify",
				mbid: artist_mbid || mbid || null,
				url: data.url || null
			};
		}
		return {
			props: { artist },
		};
	} catch (error) {
		console.error("Error fetching artist data:", error);
		return {
			notFound: true,
		};
	}
}

async function fetchSourceAlbums(providerId, provider, offset = 0, bypassCache = false) {
	return fetch(`/api/getArtistAlbums?provider_id=${providerId}&provider=${provider}&offset=${offset}&limit=50${bypassCache ? "&forceRefresh" : ""}`).then((response) => {
		if (!response.ok) {
			return response.status;
		}
		return response.json();
	});
}

async function fetchMbArtistAlbums(mbid, offset = 0, bypassCache = false) {
	return fetch(`/api/getMusicBrainzAlbums?mbid=${mbid}&offset=${offset}&limit=100${bypassCache ? "&forceRefresh" : ""}`).then((response) => {
		if (!response.ok) {
			return response.status;
		}
		return response.json();
	});
}

async function fetchMbArtistFeaturedAlbums(mbid, offset = 0, bypassCache = false) {
	return fetch(`/api/getMusicBrainzFeaturedAlbums?mbid=${mbid}&offset=${offset}&limit=100${bypassCache ? "&forceRefresh" : ""}`).then((response) => {
		if (!response.ok) {
			return response.status;
		}
		return response.json();
	});
}

async function fetchArtistReleaseCount(mbid) {
	const response = await fetch(`/api/getArtistReleaseCount?mbid=${mbid}&featured`);
	if (response.ok) {
		return await response.json();
	} else {
		throw new Error("Failed to fetch artist release count");
	}
}

let toastProperties = {
	position: "top-left",
	autoClose: 5000,
	hideProgressBar: false,
	closeOnClick: false,
	pauseOnHover: true,
	draggable: true,
	progress: undefined,

	transition: Flip,
};
async function dispError(message, type = "error") {
	if (type === "error") {
		toast.error(message, toastProperties);
	} else {
		toast.warn(message, toastProperties);
	}
}
async function dispPromise(promise, message) {
	return toast
		.promise(
			promise,
			{
				pending: message,
				error: "An error occured while quick fetching!",
			},
			toastProperties
		)
		.finally(() => {});
}

export default function Artist({ artist }) {
	const { settings, loading: waitingForMount } = useSettings();
	const router = useRouter();
	const { quickFetch } = router.query;
	const [isQuickFetched, setIsQuickFetched] = useState(false);
	const [albums, setAlbums] = useState([]);
	const [loading, setLoading] = useState(true);
	const [statusText, setStatusText] = useState("Loading albums...");
	// const { setExportData } = useExport(); // Access setExportData from context

	let sourceAlbumCount = -1;
	let mbAlbumCount = -1;
	let mbFeaturedAlbumCount = -1;
	let sourceAlbums = useRef([]);
	let mbAlbums = useRef([]);
	let mbFeaturedAlbums = useRef([]);

	function resetData() {
		sourceAlbumCount = -1;
		mbAlbumCount = -1;
		mbFeaturedAlbumCount = -1;
		sourceAlbums.current = [];
		mbAlbums.current = [];
		mbFeaturedAlbums.current = [];
	}

	useEffect(() => {
		function updateLoadingText(musicBrainz) {
			if (musicBrainz) {
				if (mbAlbumCount > -1 && mbFeaturedAlbumCount > -1) {
					setStatusText(`Loading albums from musicbrainz... ${parseInt(mbAlbums.current.length)+ parseInt(mbFeaturedAlbums.current.length)}/${Number(mbAlbumCount) + Number(mbFeaturedAlbumCount)}`);
				}
			} else {
				setStatusText(`Loading albums from ${artist.provider}... ${sourceAlbums.current.length}${sourceAlbumCount ? `/${sourceAlbumCount}`: ""}`);
			}
		}

		async function fetchProviderAlbums(pids, provider, bypassCache = false) {
			let attempts = 0;
			for (const pid of pids) {
				let offset = 0;
				let currentAlbumCount = 999;
				let fetchedAlbums = 0;
				while (offset != null) {
					try {
						const data = await fetchSourceAlbums(pid, provider, offset, bypassCache);
						if (typeof data === "number") {
							if (data === 404) {
								dispError(`Artist ID ${pid} not found!`);
								return;
							}
							throw new Error(`Error fetching provider albums: ${data}`);
						}
						sourceAlbums.current = [...sourceAlbums.current, ...data.albums];
						fetchedAlbums += data.albums.length;
						currentAlbumCount = data.count;
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
						dispError("Failed to fetch provider albums");
						break;
					}
				}
				sourceAlbumCount += currentAlbumCount;
			}
		}

		async function fetchMusicbrainzArtistAlbums(bypassCache = false) {
			let offset = 0;
			let attempts = 0;
			while (offset < mbAlbumCount || mbAlbumCount == -1) {
				try {
					const data = await fetchMbArtistAlbums(artist.mbid, offset, bypassCache);
					if (typeof data == "number") {
						if (data == 404) {
							dispError("MBID not found!");
							return;
						}
						throw new Error(`Error fetching MusicBrainz albums: ${data}`);
					}
					mbAlbums.current = [...mbAlbums.current, ...data.albums];
					mbAlbumCount = data.count;
					offset = mbAlbums.current.length;
					updateLoadingText(true);
				} catch (error) {
					attempts++;
					console.error("Error fetching albums:", error);
				}
				if (attempts > 3) {
					dispError("Failed to MusicBrainz albums");
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
							dispError("MBID not found!");
							return;
						}
						throw new Error(`Error fetching MusicBrainz Featured albums: ${data}`);
					}
					mbFeaturedAlbums.current = [...mbFeaturedAlbums.current, ...data.albums];
					mbFeaturedAlbumCount = data.count;
					offset = mbFeaturedAlbums.current.length;
					updateLoadingText(true);
				} catch (error) {
					attempts++;
					console.error("Error fetching albums:", error);
				}
				if (attempts > 3) {
					dispError("Failed to fetch MusicBrainz Featured albums");
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
						return await response.json();
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
				await new Promise((resolve) => {
					const interval = setInterval(() => {
						if (!waitingForMount) {
							clearInterval(interval);
							resolve();
						}
					}, 50);
				});
			}
			if (artist.mbid && settings?.quickFetchThreshold > 0) {
				const releaseCount = await fetchArtistReleaseCount(artist.mbid);
				if (releaseCount.releaseCount > settings?.quickFetchThreshold) {
					setIsQuickFetched(true);
					return true;
				}
			}
			return false;
		}

		async function fetchAlbums(pids, provider, bypassCache = false) {
			await Promise.all([fetchProviderAlbums(pids, provider, bypassCache), fetchMusicbrainzArtistAlbums(bypassCache), fetchMusicBrainzFeaturedAlbums(bypassCache)]);
		}

		async function loadAlbums(bypassCache = false) {
			const providerIds = artist.provider_ids ? artist.provider_ids : [artist.provider_id];
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

			let data;
			if (didQuickFetch) {
				data = await dispPromise(quickFetchAlbums(providerIds[0], artist.provider, artist.mbid, bypassCache), "Quick Fetching albums...");
			} else {
				data = processData(sourceAlbums.current, [ ...mbAlbums.current, ...mbFeaturedAlbums.current], artist.mbid, artist.provider_id);
			}
			setStatusText(data.statusText);
			setAlbums(data.albumData);
			setLoading(false);
		}
		loadAlbums();
		Artist.loadAlbums = loadAlbums;
	}, [artist.provider_id, waitingForMount]);

	async function refreshAlbums() {
		setLoading(true);
		resetData();
		setStatusText("Refreshing albums...");
		await Artist.loadAlbums(true);
	}
	return (
		<>
			<Head>
				<title>{`SAMBL • ${artist.name}`}</title>
				<meta name="description" content={`View Artist • ${artist.name} • ${artist.followers} Followers`} />
				<meta property="og:image" content={artist.imageUrl} />
				<meta property="og:title" content={`SAMBL • ${artist.name}`} />
				<meta property="og:description" content={`View Artist • ${artist.name} • ${artist.followers} Followers`} />
			</Head>
			{!artist.mbid && <Notice type={"noMBID"} data={artist} />}
			{isQuickFetched && <Notice type={"quickFetched"} />}
			<ArtistInfo artist={artist} />
			<div id="contentContainer">{loading ? <ItemList type={"loadingAlbum"} text={statusText} refresh={refreshAlbums} /> : <ItemList type={"album"} items={albums} text={statusText} refresh={refreshAlbums} />}</div>
		</>
	);
}
