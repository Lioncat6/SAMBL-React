import styles from "../styles/itemList.module.css";
import Link from "next/link";

function AlbumItem({ item }) {
	const {
		external_urls,
		id: spotifyId,
		name: spotifyName,
		images,
		artists: spotifyAlbumArtists,
		release_date: spotifyReleaseDate,
		total_tracks: spotifyTrackCount,
		album_type: spotifyAlbumType,
		mbData, // Assuming MusicBrainz data is passed as part of the item
	} = item;

	const spotifyUrl = external_urls.spotify;
	const spotifyImageURL = images[0]?.url || "";
	const spotifyImageURL300px = images[1]?.url || spotifyImageURL;
	const spotifyTrackString = spotifyTrackCount > 1 ? `${spotifyTrackCount} Tracks` : "1 Track";

	const albumStatus = mbData?.status || "red"; // Default to "red" if no MB data
	const albumMBUrl = mbData?.url || "";
	const pillTooltipText =
		albumStatus === "green"
			? "This album has a MB release with a matching Spotify URL"
			: albumStatus === "orange"
			? "This album has a MB release with a matching name but no associated link"
			: "This album has no MB release with a matching name or URL";

	return (
		<div className={styles.listItemContainer}>
			<div className={`${styles.listItem} ${styles.album}`}>
				{/* Status Pill */}
				<div className={`${styles.statusPill} ${styles[albumStatus]}`} title={pillTooltipText}></div>

				{/* Album Cover */}
				<div className={styles.albumCover}>
					<a href={spotifyImageURL} target="_blank" rel="noopener noreferrer">
						<img src={spotifyImageURL300px} alt={`${spotifyName} cover`} />
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
								<a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
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
							<span className={albumStatus === "red" ? "" : styles.hasTracks} title={mbData?.trackString || ""}>
								{spotifyTrackString}
							</span>
						</div>
					</div>
				</div>
				<a className={styles.aTisketButton} href={`https://atisket.pulsewidth.org.uk/?spf_id=${spotifyId}&amp;preferred_vendor=spf`} target="_blank" rel="noopener noreferrer">
					<div>A-Tisket</div>
				</a>
				<a className={styles.harmonyButton} href={`https://harmony.pulsewidth.org.uk/release?url=${spotifyUrl}`} target="_blank" rel="noopener noreferrer">
					<div>Harmony</div>
				</a>
			</div>
		</div>
	);
}

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

function ListBuilder({ items, type }) {
	return (
		<>
			{items.map((item, index) => (
				<div id={index} key={index} className={styles.itemContainer}>
					{type == "album" && <AlbumItem item={item} />}
					{type == "artist" && <ArtistItem item={item} />}
				</div>
			))}
		</>
	);
}

function ListContainer({ items, type }) {
	return <div className={styles.listContainer}>{items && <ListBuilder items={items} type={type} />}</div>;
}

function LoadingItem() {
	return (
		<div className={styles.listItemContainer}>
			<div className={`${styles.listItem} ${styles.skeleton}`}>
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
				<div className={`${styles.skeletonButton} ${styles.skeletonButton1}`}></div>
				<div className={`${styles.skeletonButton} ${styles.skeletonButton2}`}></div>
			</div>
		</div>
	);
}

function LoadingContainer() {
	return (
		<>
			<div className={styles.listSkeletonContainer}>
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
				<LoadingItem />
			</div>
		</>
	);
}
function SearchContainer() {
	return (
		<>
			<div id="searchContainer" className={styles.searchContainer}>
				<input id="listSearch" placeholder="Search..." className={styles.listSearch} />
				<button id="filterSearch" className={styles.filterSearch}>
					<div id="fbText" className={styles.fbText}>
						Filter
					</div>
				</button>
			</div>
		</>
	);
}

export default function ItemList({ items, type }) {
	let itemArray;
	if (items) {
		itemArray = Array.isArray(items) ? items : Object.values(items);
	}
	return (
		<>
			{" "}
			<div className={styles.listWrapper}>
				{(type == "album" || type == "loadingAlbum") && <SearchContainer />}
				{type == "loadingAlbum" ? <LoadingContainer /> : <ListContainer items={itemArray} type={type} />}
			</div>
		</>
	);
}
