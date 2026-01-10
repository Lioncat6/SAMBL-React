import styles from "../styles/itemList.module.css";
import Link from "next/link";
import React, { useEffect, useState, memo } from "react";
import { useSettings } from "./SettingsContext";
import { FaSquarePlus } from "react-icons/fa6";
import dynamic from "next/dynamic";
import { useExport as useExportState } from "./ExportState";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { FaDeezer, FaSpotify } from "react-icons/fa";
import { SiApplemusic, SiTidal } from "react-icons/si";
import { FaAnglesRight, FaAnglesLeft } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";
import { toast, Flip, ToastOptions } from "react-toastify";
import text from "../utils/text";
import { PiPlaylistBold } from "react-icons/pi";
import { TbPlaylistOff } from "react-icons/tb";
import editNoteBuilder from "../utils/editNoteBuilder";
import { IoFilter } from "react-icons/io5";
import { DisplayAlbum } from "./component-types";
import seeders from "../lib/seeders/seeders";
import { AggregatedAlbum } from "../utils/aggregated-types";

function AlbumIcons({ item }) {
	const { id, url, releaseDate, mbAlbum, trackCount, albumStatus, mbid, albumIssues, provider, artistMBID } = item;

	return (
		<div className={styles.iconContainer}>
			{albumIssues.includes("noUPC") && <img className={styles.upcIcon} src="../assets/images/noUPC.svg" title="This release is missing a UPC/Barcode!" alt="Missing UPC" />}
			{albumIssues.includes("missingISRCs") && (
				<a
					className={albumStatus === "green" ? styles.isrcTextAvaliable : styles.isrcText}
					href={albumStatus === "green" ? `https://isrchunt.com/${provider}/importisrc?releaseId=${id}` : undefined}
					target={albumStatus === "green" ? "_blank" : undefined}
					rel={albumStatus === "green" ? "noopener" : undefined}
					title={albumStatus === "green" ? "This release has missing ISRCs! [Click to Fix]" : "This release has missing ISRCs!"}
				>
					ISRC
				</a>
			)}
			{albumIssues.includes("noCover") && (
				<a
					className={albumStatus === "green" ? styles.coverArtMissingAvaliable : styles.coverArtMissing}
					href={albumStatus === "green" ? `https://musicbrainz.org/release/${mbid}/cover-art` : undefined}
					target={albumStatus === "green" ? "_blank" : undefined}
					rel={albumStatus === "green" ? "noopener" : undefined}
					title={albumStatus === "green" ? "This release is missing cover art! [Click to Fix]" : "This release is missing cover art!"}
				/>
			)}
			{albumIssues.includes("trackDiff") && (
				<div className={styles.numDiff} title={`This release has a differing track count! [SP: ${trackCount} MB: ${mbAlbum?.trackCount}]`}>
					#
				</div>
			)}
			{albumIssues.includes("noDate") && (
				<a
					className={`${styles.dateMissing} ${albumStatus === "green" ? styles.dateMissingAvaliable : ""}`}
					href={
						albumStatus === "green"
							? `https://musicbrainz.org/release/${mbid}/edit?events.0.date.year=${releaseDate.split("-")[0]}&events.0.date.month=${releaseDate.split("-")[1]}&events.0.date.day=${releaseDate.split("-")[2]
							}&edit_note=${encodeURIComponent(editNoteBuilder.buildEditNote(`Release Date`, provider, url, `https://musicbrainz.org/artist/${artistMBID}`))}`
							: undefined
					}
					title={albumStatus === "green" ? "This release is missing a release date!\n[Click to Fix]" : "This release is missing a release date!"}
					target={albumStatus === "green" ? "_blank" : undefined}
					rel={albumStatus === "green" ? "noopener" : undefined}
				></a>
			)}
			{albumIssues.includes("dateDiff") && <div className={styles.dateDiff} title={`This release has a differing release date! [SP: ${releaseDate} MB: ${mbAlbum?.releaseDate}]\n(This may indicate that you have to split a release.)`} />}
		</div>
	);
}

function ActionButtons({ item }:  { item: DisplayAlbum }) {
	const { settings } = useSettings();
	const { url, upc, provider } = item;
	const [collapsed, setCollapsed] = useState(true);
	function toggleState() {
		setCollapsed(!collapsed);
	}
	return (
		<>
			<div className={styles.actionButtons}>
				{
					<div className={`${collapsed ? styles.expand : styles.collapse}`} onClick={toggleState}>
						{collapsed ? <FaAnglesLeft /> : <FaAnglesRight />}
					</div>
				}
				<div className={`${collapsed ? styles.collapsed : styles.expanded}`}>
					{settings?.showExport && <SelectionButtons item={item} />}
					{seeders.getAllSeeders().map((seeder) => {
							if (settings?.enabledSeeders.includes(seeder.namespace) && seeder.providers.includes(provider)) {
								return (
									<a className={styles[`${seeder.namespace}Button`]} href={seeder.buildUrl(url, upc)} target="_blank" rel="noopener noreferrer">
										<div>{seeder.displayName}</div>
									</a>
								)
							}
						})
					}
				</div>
			</div>
		</>
	);
}

function SelectionButtons({ item }) {
	const Popup = dynamic(() => import("./Popup"), { ssr: false });

	return (
		<>
			<Popup
				button={
					<a className={styles.exportButton}>
						<div>Export</div>
					</a>
				}
				data={item}
				type="export"
				apply={null}
			/>
		</>
	);
}

const AlbumItem = ({ item, selecting = false, onUpdate }: { item: DisplayAlbum; selecting?: boolean; onUpdate?: (updatedItem: DisplayAlbum) => void }) => {
	const [isLoading, setIsLoading] = useState(false);
	const { exportState } = useExportState();
	const Popup = dynamic(() => import("./Popup"), { ssr: false });

	let toastProperties: ToastOptions = {
		position: "top-left",
		autoClose: 5000,
		hideProgressBar: false,
		closeOnClick: false,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,

		transition: Flip,
	};
	async function dispError(message, type = "warn") {
		if (type === "error") {
			toast.error(message, toastProperties);
		} else {
			toast.warn(message, toastProperties);
		}
	}
	async function dispPromise(promise: Promise<any>, message: string): Promise<any> {
		return toast
			.promise(
				promise,
				{
					pending: message,
					error: "Data not found!",
				},
				toastProperties
			)
			.finally(() => { });
	}

	const {
		provider,
		id,
		name,
		url,
		imageUrl,
		imageUrlSmall,
		albumArtists,
		releaseDate,
		trackCount,
		albumType,
		status,
		mbAlbum,
		albumTracks,
		mbid,
		artistMBID,
		albumIssues,
		highlightTracks,
	} = item;

	async function refreshData() {
		setIsLoading(true);
		const response = await dispPromise(fetch(`/api/compareSingleAlbum?url=${url}&mbid=${artistMBID}`), "Refreshing album...");
		setIsLoading(false);
		if (response.ok) {
			const updatedItem = await response.json();
			if (onUpdate) onUpdate(updatedItem);
		} else {
			dispError("Failed to refresh album data!", "error");
		}
	}

	const sourceTrackString = trackCount && trackCount > 1 ? `${trackCount} Tracks` : "1 Track";

	const mbTrackString = mbAlbum?.albumTracks.map((track) => track.name).join(",");
	const mbISRCString = mbAlbum?.albumTracks.map((track) => track.isrcs.join(",")).join(",");
	const trackISRCString = albumTracks.map((track) => track.isrcs.join(",")).join(",");

	function getTracksWithoutISRCs(): string {
		let tracksWithoutISRCs: string[] = [];
		for (const track in albumTracks) {
			if (albumTracks[track].isrcs.length === 0) {
				tracksWithoutISRCs.push(albumTracks[track].name);
			}
		}
		return tracksWithoutISRCs.join(",");
	}





	let pillTooltipText = "This album has no MB release with a matching name, UPC, or URL"

	switch(status) {
		case "green":
			pillTooltipText = "This album has a MB release with a matching URL"
			break;
		case "orange":
			pillTooltipText = "This album has a MB release with a matching name but no associated link"
		case "blue":
			pillTooltipText = "This album has a MB release with a matching UPC but no associated link"
	}

	let data_params = {
		"data-id": id,
		"data-name": name,
		"data-url": url,
		"data-image-url": imageUrl,
		"data-image-url-small": imageUrlSmall,
		"data-album-artists": albumArtists.map((artist) => artist.name).join(", "),
		"data-album-artist-ids": albumArtists.map((artist) => artist.id).join(", "),
		"data-release-date": releaseDate,
		"data-track-count": trackCount,
		"data-album-type": albumType,
		"data-status": status,
		"data-mb-track-count": mbAlbum?.trackCount,
		"data-mb-release-date": mbAlbum?.releaseDate,
		"data-mbid": mbid,
		"data-album-issues": albumIssues,
		"data-track-names": mbTrackString,
		"data-track-isrcs": mbISRCString,
		"data-isrcs": trackISRCString,
		"data-tracks-without-isrcs": getTracksWithoutISRCs(),
		"data-barcode": mbAlbum?.upc || "",
	};

	return (
		<div className={`${styles.listItem} ${styles.album}`} {...data_params}>
			<div className={styles.innerItem}>
				{/* Status Pill */}
				<div className={`${styles.statusPill} ${styles[status]}`} title={pillTooltipText}></div>

				{/* Album Cover */}
				{(imageUrlSmall || imageUrl) && (
					<div className={styles.albumCover}>
						<a href={imageUrl || undefined} target="_blank" rel="noopener noreferrer">
							<img src={imageUrlSmall || imageUrl || undefined} alt={`${name} cover`} loading="lazy" />
						</a>
					</div>
				)}

				{/* Text Container */}
				<div className={styles.textContainer}>
					{/* Album Title */}
					<div className={styles.albumTitle}>
						<a href={url} target="_blank" rel="noopener noreferrer">
							{name}
						</a>
						{mbAlbum?.url && (
							<a href={mbAlbum.url} target="_blank" rel="noopener noreferrer">
								<img
									className={styles.albumMB}
									src={status === "green" ? "../assets/images/MusicBrainz_logo_icon.svg" : "../assets/images/MB_Error.svg"}
									alt="MusicBrainz"
									title={status === "green" ? "View on MusicBrainz" : "Warning: This could be the incorrect MB release for this album!"}
								/>
							</a>
						)}
						<div className={`${styles.refreshIcon} ${isLoading && styles.loading}`} onClick={refreshData} title="Refresh Album Data">
							<IoMdRefresh />
						</div>
					</div>

					{/* Artists */}
					<div className={styles.artists}>
						{albumArtists.map((artist, index) => (
							<span key={artist.id}>
								{index > 0 && ", "}
								<a href={artist.url} target="_blank" rel="noopener noreferrer" className={styles.artistLink}>
									{artist.name}
								</a>
								<a href={`../newartist?provider_id=${artist.id}&provider=${artist.provider}`} target="_blank" rel="noopener noreferrer">
									<img className={styles.SAMBLicon} src="../assets/images/favicon.svg" alt="SAMBL" />
								</a>
							</span>
						))}
					</div>

					{/* Album Info */}
					<div className={styles.albumInfo}>
						<div>
							{releaseDate} • {text.capitalizeFirst(albumType || "")} •{" "}
							{status === "red"
								? (
									albumTracks.length > 0
										? <Popup
											button={
												<span className={`${styles.hasTracks} ${highlightTracks ? styles.trackHighlight : ""}`} title={"Click to view tracks"}>
													<PiPlaylistBold /> {sourceTrackString}
												</span>
											}
											type="track"
											data={item}
											apply={null}
										></Popup>
										: (
											<span className={`${styles.tracks} ${highlightTracks ? styles.trackHighlight : ""}`} title={"No track data available\nRefresh the album to fetch track data!"}>
												<TbPlaylistOff /> {sourceTrackString}
											</span>
										)
								)
								: (
									<Popup
										button={
											<span className={`${styles.hasTracks} ${highlightTracks ? styles.trackHighlight : ""}`} title={"Click to view tracks"}>
												<PiPlaylistBold /> {sourceTrackString}
											</span>
										}
										type="track"
										data={item}
										apply={null}
									></Popup>
								)
							}
						</div>
						<AlbumIcons item={item} />
					</div>
				</div>
				{exportState ? <SelectionButtons item={item} /> : <ActionButtons item={item} />}
			</div>
		</div>
	);
};

const MemorizedAlbumItem  = memo(AlbumItem);

function AddButton({ item }) {
	return (
		<Link className={styles.viewButton} href={`/newartist?provider_id=${item.id}&provider=${item.provider}`}>
			<div>
				Add <img title={"MusicBrainz"} className={styles.artistMB} src="../assets/images/MusicBrainz_logo_icon.svg"></img>
			</div>
		</Link>
	);
}

function ViewButton({ item }) {
	return (
		<Link className={styles.viewButton} href={`/artist?provider_id=${item.id}&provider=${item.provider}&artist_mbid=${item.mbid}`}>
			<div>View Artist</div>
		</Link>
	);
}

function ArtistItem({ item }) {
	return (
		<div className={styles.listItem} style={{ '--background-image': `url('${item.bannerUrl || item.imageUrl || ""}')` } as React.CSSProperties}>
			{item.imageUrl && (
				<div className={styles.artistIcon}>
					<a href={item.imageUrl} target="_blank">
						<img title={item.name} src={item.imageUrlSmall} />
					</a>
				</div>
			)}
			<div className={styles.textContainer}>
				<div className={styles.artistName}>
					<a href={item.url} target="_blank">
						{item.name}
					</a>
				</div>
				<div className={styles.artistFollowers}>{item.relevance}</div>
				<div className={styles.artistGenres}>{item.info}</div>
			</div>

			{item.mbid == null ? <AddButton item={item} /> : <ViewButton item={item} />}
		</div>
	);
}

function Icon({ source }) {
	return (
		<>
			{source === "spotify" && <img className={styles.spotifyIcon} title={"Spotify"} src="../assets/images/Spotify_icon.svg" />}
			{source === "musicbrainz" && <img className={styles.mbIcon} title={"MusicBrainz"} src="../assets/images/MusicBrainz_logo_icon.svg" />}
			{source === "deezer" && <FaDeezer title={"Deezer"} className={styles.deezerIcon} />}
			{source === "musixmatch" && <img className={styles.musixMatchIcon} title={"Musixmatch"} src="../assets/images/Musixmatch_logo_icon_only.svg" />}
			{source === "tidal" && <SiTidal title={"Tidal"} className={styles.tidalIcon} />}
			{source === "applemusic" && <SiApplemusic title={"Apple Music"} className={styles.applemusicIcon} />}
		</>
	);
}

function LinkButton({ item }) {
	const { settings } = useSettings();

	return (
		<div className={styles.actionButtons}>
			{settings?.showExport && <SelectionButtons item={item} />}
			<a href={item.link} target="_blank" className={styles.viewButton}>
				<div>
					View <Icon source={item.source} />
				</div>
			</a>
		</div>
	);
}

function GenericItem({ item }) {
	const { exportState } = useExportState();
	const { source, imageUrl, title, artists, info, link } = item;
	let artistString = artists?.map((artist, index) => (
		<>
			{index > 0 && ", "}
			<a href={artist.link} target="_blank" rel="noopener noreferrer" className={styles.artists}>
				{artist.name}
			</a>
		</>
	));
	let infoString = Array.isArray(info) ? info.filter((item) => item != null && item != "").join(" • ") : "";
	return (
		<div className={styles.listItem} style={{ "--background-image": `url('${imageUrl}')` } as React.CSSProperties}>
			{imageUrl && (
				<div className={styles.artistIcon}>
					<a href={imageUrl} target="_blank">
						<img title={title} src={imageUrl} />
					</a>
				</div>
			)}
			<div className={styles.textContainer}>
				<div className={styles.artistName}>
					<a href={link} target="_blank">
						{title}
					</a>
				</div>
				<div className={styles.artistFollowers}>{artistString}</div>
				<div className={styles.artistGenres}>{infoString}</div>
			</div>
			{exportState ? <SelectionButtons item={item} /> : <LinkButton item={item} />}
		</div>
	);
}

function ListBuilder({ items, type, onItemUpdate }) {
	return (
		<>
			{items.map((item, index) => (
				<div id={index} key={index} className={styles.itemContainer}>
					{type == "album" && <MemorizedAlbumItem item={item} onUpdate={onItemUpdate} />}
					{type == "artist" && <ArtistItem item={item} />}
					{type == "mixed" && <GenericItem item={item} />}
				</div>
			))}
		</>
	);
}

function ListContainer({ items, type, text, onItemUpdate }) {
	return (
		<>
			<div className={styles.listContainer}>{items && <ListBuilder items={items} type={type} onItemUpdate={onItemUpdate} />}</div>
			<div className={styles.statusText}>{text}</div>
		</>
	);
}

function VirtualizedList({ items, type, text, onItemUpdate }) {
	return (
		<>
			<div className={styles.virtualListContainer}>
				<AutoSizer>
					{({ height, width }) => (
						<List
							height={height}
							itemCount={items.length}
							itemSize={69} //nice
							width={width}
						>
							{({ index, style }) => (
								<div style={style}>
									{type === "album" && <MemorizedAlbumItem item={items[index]} onUpdate={onItemUpdate} />}
									{type === "artist" && <ArtistItem item={items[index]} />}
									{type === "mixed" && <GenericItem item={items[index]} />}
								</div>
							)}
						</List>
					)}
				</AutoSizer>
			</div>
			<div className={styles.statusText}>{text}</div>
		</>
	);
}

function LoadingItem() {
	const { settings } = useSettings();
	return (
		<div className={styles.listItemContainer}>
			<div className={`${styles.listItem} ${styles.skeleton}`}>
				<div className={styles.innerItem}>
					{/* Status Pill Placeholder */}
					<div className={`${styles.statusPill} ${styles.skeletonPill}`}></div>

					{/* Album Cover Placeholder */}
					<div className={`${styles.albumCover} ${styles.skeletonCover}`}></div>

					{/* Text Container Placeholder */}
					<div className={`${styles.textContainer} ${styles.skeletonTextContainer}`}>
						<div className={`${styles.skeletonText} ${styles.skeletonTitle}`}></div>
						<div className={`${styles.skeletonText} ${styles.skeletonSubtitle}`}></div>
						<div className={`${styles.skeletonText} ${styles.skeletonInfo}`}></div>
					</div>
					{/* Buttons Placeholder */}
					{settings?.showExport && <div className={`${styles.skeletonButton} ${styles.skeletonButton1}`}></div>}
					{seeders.getAllSeeders().filter(seeder => settings?.enabledSeeders.includes(seeder.namespace)).map(() => {
						return <div className={`${styles.skeletonButton} ${styles.skeletonButton1}`}></div>
					})}
				</div>
			</div>
		</div>
	);
}

function LoadingContainer({ text, showRefresh = false }) {
	return (
		<>
			<LoadingSearchContainer text={text} showRefresh={showRefresh} />
			<div className={styles.listSkeletonContainer}>
				{Array.from({ length: 13 }).map((_, index) => (
					<LoadingItem key={index} />
				))}
			</div>
		</>
	);
}

function RefreshButton({ refresh, showRefresh = false }) {
	if (refresh != undefined) {
		return (
			<button id="refreshButton" className={styles.refreshButton} onClick={refresh}>
				<IoMdRefresh />
			</button>
		)
	} else if (showRefresh) {
		return (
			<button title={"Refresh Artist Albums"} id="refreshButton" className={styles.refreshButton}>
				<IoMdRefresh />
			</button>
		);
	}
}

function LoadingSearchContainer({ text, showRefresh = false }) {
	return (
		<>
			<div id="searchContainer" className={styles.searchContainer}>
				<div className={styles.listSearchLoading}>{text}</div>
				<button title={"Filter & Sort Menu"} id="filterSearchLoading" className={styles.filterSearch}>
					<div id="fbText" className={styles.fbText}>
						<IoFilter />
					</div>
				</button>
				<RefreshButton showRefresh={showRefresh} refresh={null} />
			</div>
		</>
	);
}


function SearchContainer({ onSearch, currentFilter, setFilter, refresh }) {
	const Popup = dynamic(() => import("./Popup"), { ssr: false });
	return (
		<div id="searchContainer" className={styles.searchContainer}>
			<input
				id="listSearch"
				placeholder="Search..."
				className={styles.listSearch}
				onChange={(e) => onSearch(e.target.value)} // Call onSearch when input changes
			/>
			<Popup
				type="filter"
				button={
					<button title={"Filter & Sort Menu"} id="filterSearch" className={styles.filterSearch}>
						<div id="fbText" className={styles.fbText}>
							<IoFilter />
						</div>
					</button>
				}
				data={currentFilter}
				apply={(newFilter) => setFilter(newFilter)}
			/>
			<RefreshButton refresh={refresh} />
		</div>
	);
}

export default function ItemList({ items, type, text, refresh }) {
	const { settings } = useSettings();
	const [searchQuery, setSearchQuery] = useState(""); // State for search query
	const [filteredItems, setFilteredItems] = useState(items || []); // State for filtered items
	const [currentItems, setCurrentItems] = useState(items || []);
	const [filter, setFilter] = useState({ showGreen: true, showOrange: true, showRed: true, showVarious: true, onlyIssues: false });
	const { setAllItems } = useExportState();
	if (currentItems?.length > 0) {
		setAllItems(currentItems);
	}

	useEffect(() => {
		setCurrentItems(items || []);
	}, [items]);

	useEffect(() => {
		if (type !== "album") {
			return;
		}
		items = items as DisplayAlbum[];


		let updatedItems = currentItems as DisplayAlbum[];

		// Search
		if (searchQuery.trim() !== "") {
			const lowerCaseQuery = searchQuery.toLowerCase();
			updatedItems = updatedItems
				.map((item) => {
					let tracks = item.aggregatedTracks && item.aggregatedTracks.length > 0 ? item.aggregatedTracks : item.aggregatedTracks && item.aggregatedTracks.length > 0 ? item.albumTracks: item.mbAlbum?.albumTracks || [];
					const matchesTrack = tracks.map(track => track.name)?.some((track) => track.toLowerCase().includes(lowerCaseQuery));
					const matchesTitle = item.name.toLowerCase().includes(lowerCaseQuery);

					return {
						...item,
						highlightTracks: matchesTrack && !matchesTitle,
					};
				})
				.filter((item) => {
					return item.name.toLowerCase().includes(lowerCaseQuery) || item.albumArtists.some((artist) => artist.name.toLowerCase().includes(lowerCaseQuery)) || item.highlightTracks;
				});
		}

		// Filter
		if (filter) {
			if (!filter.showGreen) {
				updatedItems = updatedItems.filter((item) => item.status !== "green");
			}
			if (!filter.showOrange) {
				updatedItems = updatedItems.filter((item) => item.status !== "orange");
			}
			if (!filter.showRed) {
				updatedItems = updatedItems.filter((item) => item.status !== "red");
			}
			const variousArtistsList = ["Various Artists", "Artistes Variés", "Verschiedene Künstler", "Varios Artistas", "ヴァリアス・アーティスト"];
			if (!filter.showVarious) {
				updatedItems = updatedItems.filter((item) => !variousArtistsList.some((artist) => item.albumArtists?.some((a) => a.name === artist)));
			}
			if (filter.onlyIssues) {
				updatedItems = updatedItems.filter((item) => item.albumIssues.length > 0);
			}
		}
		if (updatedItems != filteredItems) {
			setFilteredItems(updatedItems);
		}
	}, [searchQuery, filter, currentItems, type]);

	let itemArray: any = [];
	if (type != "album" && type != "loadingAlbum") {
		itemArray = Array.isArray(currentItems) ? currentItems : Object.values(currentItems);
	}

	const handleItemUpdate = (updatedItem) => {
		setCurrentItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
	};
	return (
		<div className={styles.listWrapper}>
			{type === "album" && <SearchContainer onSearch={setSearchQuery} currentFilter={filter} setFilter={setFilter} refresh={refresh} />}
			{type === "loadingAlbum" ? (
				<LoadingContainer text={text} showRefresh={refresh != undefined} />
			) : items.length > 75 && settings?.listVirtualization ? ( // If over 200 albums, use the virtualized list. Reason why I don't want to always use it is because it scrolls less smooth
				<VirtualizedList items={type === "album" ? filteredItems : itemArray} type={type} text={text} onItemUpdate={handleItemUpdate} />
			) : (
				<ListContainer items={type === "album" ? filteredItems : itemArray} type={type} text={text} onItemUpdate={handleItemUpdate} />
			)}
		</div>
	);
}
