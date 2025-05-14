import styles from "../styles/itemList.module.css";
import Link from "next/link";
import React, { useEffect, useState, memo } from "react";
import { useSettings } from "./SettingsContext";
import { FaBarcode } from "react-icons/fa6";
import dynamic from "next/dynamic";
import { useExport as useExportState } from "./ExportState";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer"
import { TbTableExport } from "react-icons/tb";

function AlbumIcons({ item }) {
	const { spotifyId, spotifyUrl, spotifyReleaseDate, spotifyTrackCount, albumStatus, mbTrackCount, mbReleaseDate, mbid, albumIssues } = item;
	return (
		<div className={styles.iconContainer}>
			{albumIssues.includes("noUPC") && <img className={styles.upcIcon} src="../assets/images/noUPC.svg" title="This release is missing a UPC/Barcode!" alt="Missing UPC" />}
			{albumIssues.includes("missingISRCs") && (
				<a
					className={albumStatus === "green" ? styles.isrcTextAvaliable : styles.isrcText}
					href={albumStatus === "green" ? `https://isrchunt.com/spotify/importisrc?releaseId=${spotifyId}` : undefined}
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
				<div className={styles.numDiff} title={`This release has a differing track count! [SP: ${spotifyTrackCount} MB: ${mbTrackCount}]`}>
					#
				</div>
			)}
			{albumIssues.includes("noDate") && (
				<a
					className={`${styles.dateMissing} ${albumStatus === "green" ? styles.dateMissingAvaliable : ""}`}
					href={
						albumStatus === "green"
							? `https://musicbrainz.org/release/${mbid}/edit?events.0.date.year=${spotifyReleaseDate.split("-")[0]}&events.0.date.month=${spotifyReleaseDate.split("-")[1]}&events.0.date.day=${spotifyReleaseDate.split("-")[2]
							}&edit_note=${encodeURIComponent(`Added release date from Spotify using SAMBL: ${spotifyUrl}`)}`
							: undefined
					}
					title={albumStatus === "green" ? "This release is missing a release date!\n[Click to Fix]" : "This release is missing a release date!"}
					target={albumStatus === "green" ? "_blank" : undefined}
					rel={albumStatus === "green" ? "noopener" : undefined}
				></a>
			)}
			{albumIssues.includes("dateDiff") && <div className={styles.dateDiff} title={`This release has a differing release date! [SP: ${spotifyReleaseDate} MB: ${mbReleaseDate}]\n(This may indicate that you have to split a release.)`} />}
		</div>
	);
}

function ActionButtons({ item }) {
	const { settings } = useSettings();
	const { spotifyId, spotifyUrl } = item;

	return (
		<>
			<div className={styles.actionButtons}>
				{settings.showATisket && (
					<a className={styles.aTisketButton} href={`https://atisket.pulsewidth.org.uk/?spf_id=${spotifyId}&amp;preferred_vendor=spf`} target="_blank" rel="noopener noreferrer">
						<div>A-tisket</div>
					</a>
				)}
				{settings.showHarmony && (
					<a className={styles.harmonyButton} href={`https://harmony.pulsewidth.org.uk/release?url=${spotifyUrl}&category=preferred`} target="_blank" rel="noopener noreferrer">
						<div>Harmony</div>
					</a>
				)}
			</div>
		</>
	);
}

function SelectionButtons({ item }) {
	const Popup = dynamic(() => import("./Popup"), { ssr: false });

	return (
		<>
			<Popup button={
				<a className={styles.exportButton}>
					<div>Export</div>
				</a>
			} data={item} type="export" />
		</>
	);
}

const AlbumItem = memo(function AlbumItem({ item, selecting }) {
	const { exportState } = useExportState();

	const {
		spotifyId,
		spotifyName,
		spotifyUrl,
		spotifyImageURL,
		spotifyImageURL300px,
		spotifyAlbumArtists,
		spotifyReleaseDate,
		spotifyTrackCount,
		spotifyAlbumType,
		albumStatus,
		albumMBUrl,
		mbTrackCount,
		mbReleaseDate,
		mbid,
		albumIssues,
		mbTrackNames,
		mbTrackISRCs,
		tracksWithoutISRCs,
		highlightTracks,
		mbBarcode,
	} = item;

	const spotifyTrackString = spotifyTrackCount > 1 ? `${spotifyTrackCount} Tracks` : "1 Track";

	const mbTrackString = mbTrackNames.map((track) => track).join("\n");

	const pillTooltipText =
		albumStatus === "green"
			? "This album has a MB release with a matching Spotify URL"
			: albumStatus === "orange"
				? "This album has a MB release with a matching name but no associated link"
				: "This album has no MB release with a matching name or URL";

	let data_params = {
		"data-spotify-id": spotifyId,
		"data-spotify-name": spotifyName,
		"data-spotify-url": spotifyUrl,
		"data-spotify-image-url": spotifyImageURL,
		"data-spotify-image-url-300px": spotifyImageURL300px,
		"data-spotify-album-artists": spotifyAlbumArtists.map((artist) => artist.name).join(", "),
		"data-spotify-album-artist-ids": spotifyAlbumArtists.map((artist) => artist.id).join(", "),
		"data-spotify-release-date": spotifyReleaseDate,
		"data-spotify-track-count": spotifyTrackCount,
		"data-spotify-album-type": spotifyAlbumType,
		"data-status": albumStatus,
		"data-track-count": mbTrackCount,
		"data-release-date": mbReleaseDate,
		"data-mbid": mbid,
		"data-album-issues": albumIssues,
		"data-track-names": mbTrackNames,
		"data-track-isrcs": mbTrackISRCs,
		"data-tracks-without-isrcs": tracksWithoutISRCs,
		"data-barcode": mbBarcode,
	};

	return (
		<div className={`${styles.listItem} ${styles.album}`} {...data_params}>
			<div className={styles.innerItem}>
				{/* Status Pill */}
				<div className={`${styles.statusPill} ${styles[albumStatus]}`} title={pillTooltipText}></div>

				{/* Album Cover */}
				<div className={styles.albumCover}>
					<a href={spotifyImageURL} target="_blank" rel="noopener noreferrer">
						<img src={spotifyImageURL300px} alt={`${spotifyName} cover`} loading="lazy" />
					</a>
				</div>

				{/* Text Container */}
				<div className={styles.textContainer}>
					{/* Album Title */}
					<div className={styles.albumTitle}>
						<a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
							{spotifyName}
						</a>
						{albumMBUrl && (
							<a href={albumMBUrl} target="_blank" rel="noopener noreferrer">
								<img
									className={styles.albumMB}
									src={albumStatus === "green" ? "../assets/images/MusicBrainz_logo_icon.svg" : "../assets/images/MB_Error.svg"}
									alt="MusicBrainz"
									title={albumStatus === "green" ? "View on MusicBrainz" : "Warning: This could be the incorrect MB release for this album!"}
								/>
							</a>
						)}
					</div>

					{/* Artists */}
					<div className={styles.artists}>
						{spotifyAlbumArtists.map((artist, index) => (
							<span key={artist.id}>
								{index > 0 && ", "}
								<a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer" className={styles.artistLink}>
									{artist.name}
								</a>
								<a href={`../newartist?spid=${artist.id}`} target="_blank" rel="noopener noreferrer">
									<img className={styles.SAMBLicon} src="../assets/images/favicon.svg" alt="SAMBL" />
								</a>
							</span>
						))}
					</div>

					{/* Album Info */}
					<div className={styles.albumInfo}>
						<div>
							{spotifyReleaseDate} • {spotifyAlbumType.charAt(0).toUpperCase() + spotifyAlbumType.slice(1)} •{" "}
							<span className={`${albumStatus === "red" ? "" : styles.hasTracks} ${highlightTracks ? styles.trackHighlight : ""}`} title={mbTrackString || ""}>
								{spotifyTrackString}
							</span>
						</div>
						<AlbumIcons item={item} />
					</div>
				</div>
				{exportState ? <SelectionButtons item={item} /> : <ActionButtons item={item} />}
			</div>
		</div>
	);
});

function AddButton({ item }) {
	return (
		<Link className={styles.viewButton} href={`/newartist?spid=${item.spotifyId}`}>
			<div>
				Add <img className={styles.artistMB} src="../assets/images/MusicBrainz_logo_icon.svg"></img>
			</div>
		</Link>
	);
}

function ViewButton({ item }) {
	return (
		<Link className={styles.viewButton} href={`/artist?spid=${item.spotifyId}&artist_mbid=${item.mbid}`}>
			<div>View Artist</div>
		</Link>
	);
}

function ArtistItem({ item }) {
	return (
		<div className={styles.listItem} style={{ "--background-image": `url('${item.imageUrl}')` }}>
			{item.imageUrl && (
				<div className={styles.artistIcon}>
					<a href={item.imageUrl} target="_blank">
						<img src={item.imageUrl} />
					</a>
				</div>
			)}
			<div className={styles.textContainer}>
				<div className={styles.artistName}>
					<a href={`https://open.spotify.com/artist/${item.spotifyId}`} target="_blank">
						{item.name}
					</a>
				</div>
				<div className={styles.artistFollowers}>{item.followers} Followers</div>
				<div className={styles.artistGenres}>{item.genres}</div>
			</div>

			{item.mbid == null ? <AddButton item={item} /> : <ViewButton item={item} />}
		</div>
	);
}

function Icon({ source }) {
	return (
		<>
			{source === "spotify" && <img className={styles.spotifyIcon} src="../assets/images/Spotify_icon.svg" />}
			{source === "musicbrainz" && <img className={styles.mbIcon} src="../assets/images/MusicBrainz_logo_icon.svg" />}
		</>
	);
}

function GenericItem({ item }) {
	const { source, imageUrl, title, artists, info, link } = item;
	let artistString = artists.map((artist, index) => (
		<>
			{index > 0 && ", "}
			<a href={artist.link} target="_blank" rel="noopener noreferrer" className={styles.artists}>
				{artist.name}
			</a>
		</>
	));
	let infoString = Array.isArray(info) ? info.filter((item) => item != null && item != "").join(" • ") : "";
	return (
		<div className={styles.listItem} style={{ "--background-image": `url('${imageUrl}')` }}>
			{imageUrl && (
				<div className={styles.artistIcon}>
					<a href={imageUrl} target="_blank">
						<img src={imageUrl} />
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
			<a href={link} target="_blank" className={styles.viewButton}>
				<div>
					View <Icon source={source} />
				</div>
			</a>
		</div>
	);
}

function ListBuilder({ items, type }) {
	return (
		<>
			{items.map((item, index) => (
				<div id={index} key={index} className={styles.itemContainer}>
					{type == "album" && <AlbumItem item={item} />}
					{type == "artist" && <ArtistItem item={item} />}
					{type == "mixed" && <GenericItem item={item} />}
				</div>
			))}
		</>
	);
}

function ListContainer({ items, type, text }) {
	return (
		<>
			<div className={styles.listContainer}>{items && <ListBuilder items={items} type={type} />}</div>
			<div className={styles.statusText}>{text}</div>
		</>
	);
}

function VirtualizedList({ items, type, text }) {
	return (
		<>
			<div className={styles.virtualListContainer}>
				<AutoSizer>
					{({ height, width }) =>
						<List
							height={height}
							itemCount={items.length}
							itemSize={69} //nice 
							width={width}
						>
							{({ index, style }) => (
								<div style={style}>
									{type === "album" && <AlbumItem item={items[index]} />}
									{type === "artist" && <ArtistItem item={items[index]} />}
									{type === "mixed" && <GenericItem item={items[index]} />}
								</div>
							)}
						</List>
					}
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
					{settings.showHarmony && <div className={`${styles.skeletonButton} ${styles.skeletonButton1}`}></div>}
					{settings.showATisket && <div className={`${styles.skeletonButton} ${styles.skeletonButton2}`}></div>}
				</div>
			</div>
		</div>
	);
}

function LoadingContainer({ text }) {
	return (
		<>
			<LoadingSearchContainer text={text} />
			<div className={styles.listSkeletonContainer}>
				{Array.from({ length: 13 }).map((_, index) => (
					<LoadingItem key={index} />
				))}
			</div>
		</>
	);
}

function LoadingSearchContainer({ text }) {
	return (
		<>
			<div id="searchContainer" className={styles.searchContainer}>
				<div className={styles.listSearchLoading}>{text}</div>
				<button id="filterSearch" className={styles.filterSearch}>
					<div id="fbText" className={styles.fbText}>
						Filter
					</div>
				</button>
			</div>
		</>
	);
}

function SearchContainer({ onSearch, currentFilter, setFilter }) {
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
					<button id="filterSearch" className={styles.filterSearch}>
						<div id="fbText" className={styles.fbText}>
							Filter
						</div>
					</button>
				}
				data={currentFilter}
				apply={(newFilter) => setFilter(newFilter)}
			/>
		</div>
	);
}

export default function ItemList({ items, type, text }) {
	const { settings } = useSettings();
	const [searchQuery, setSearchQuery] = useState(""); // State for search query
	const [filteredItems, setFilteredItems] = useState(items || []); // State for filtered items
	const [filter, setFilter] = useState({ showGreen: true, showOrange: true, showRed: true, showVarious: true, onlyIssues: false });
	useEffect(() => {
		if (type !== "album") {
			return;
		}

		let updatedItems = items;

		// Search
		if (searchQuery.trim() !== "") {
			const lowerCaseQuery = searchQuery.toLowerCase();
			updatedItems = updatedItems
				.map((item) => {
					const matchesTrack = item.mbTrackNames.some((track) => track.toLowerCase().includes(lowerCaseQuery));
					const matchesTitle = item.spotifyName.toLowerCase().includes(lowerCaseQuery);

					return {
						...item,
						highlightTracks: matchesTrack && !matchesTitle,
					};
				})
				.filter((item) => {
					return item.spotifyName.toLowerCase().includes(lowerCaseQuery) || item.spotifyAlbumArtists.some((artist) => artist.name.toLowerCase().includes(lowerCaseQuery)) || item.highlightTracks;
				});
		}

		// Filter
		if (filter) {
			if (!filter.showGreen) {
				updatedItems = updatedItems.filter((item) => item.albumStatus !== "green");
			}
			if (!filter.showOrange) {
				updatedItems = updatedItems.filter((item) => item.albumStatus !== "orange");
			}
			if (!filter.showRed) {
				updatedItems = updatedItems.filter((item) => item.albumStatus !== "red");
			}
			const variousArtistsList = ["Various Artists", "Artistes Variés", "Verschiedene Künstler", "Varios Artistas", "ヴァリアス・アーティスト"];
			if (!filter.showVarious) {
				updatedItems = updatedItems.filter((item) => !variousArtistsList.some((artist) => item.spotifyAlbumArtists.some((a) => a.name === artist)));
			}
			if (filter.onlyIssues) {
				updatedItems = updatedItems.filter((item) => item.albumIssues.length > 0);
			}
		}
		if (updatedItems != filteredItems) {
			setFilteredItems(updatedItems);
		}
	}, [searchQuery, filter, items, type]);

	let itemArray = [];
	if (type != "album" && type != "loadingAlbum") {
		itemArray = Array.isArray(items) ? items : Object.values(items);
	}
	return (
		<div className={styles.listWrapper}>
			{type === "album" && <SearchContainer onSearch={setSearchQuery} currentFilter={filter} setFilter={setFilter} />}
			{type === "loadingAlbum" ? (
				<LoadingContainer text={text} />
			) : (items.length > 75 && settings.listVirtualization) ? ( // If over 200 albums, use the virtualized list. Reason why I don't want to always use it is because it scrolls less smooth
				<VirtualizedList items={type === "album" ? filteredItems : itemArray} type={type} text={text} />
			) : (
				<ListContainer items={type === "album" ? filteredItems : itemArray} type={type} text={text} />
			)}
		</div>
	);
}
