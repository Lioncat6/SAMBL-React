import styles from "../styles/itemList.module.css";
import Link from "next/link";

function AlbumItem() {}

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
        <div
            className={styles.listItem}
            style={{ '--background-image': `url('${item.imageUrl}')` }}
        >
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
				<div key={index} className={styles.itemContainer}>
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

function SearchContainer() {
	return (
		<>
			<div id="searchContainer">
				<input id="listSearch" placeholder="Search..." />
				<button id="filterSearch">
					<div id="fbText">Filter</div>
				</button>
			</div>
		</>
	);
}

export default function ItemList({ items, type }) {
	const itemArray = Array.isArray(items) ? items : Object.values(items);
	return (
		<>
			{" "}
			<div className={styles.listWrapper}>
				{type == "album" && <SearchContainer />}
				<ListContainer items={itemArray} type={type} />
			</div>
		</>
	);
}
