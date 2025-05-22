import styles from "../styles/artistInfo.module.css";
import { LuImageUp } from "react-icons/lu";

function SpotifyUrlContainer({ id }) {
	return (
		<div className={styles.spURLContainer}>
			<a id="spURL" target="_blank" href={"https://open.spotify.com/artist/" + id}>
				<img alt="Spotify Icon" className={styles.spIcon} src="../assets/images/Spotify_icon.svg" />
			</a>
		</div>
	);
}

function MusicBrainzUrlContainer({ id }) {
	return (
		<div className={styles.mbURLContainer}>
			<a id="mbURL" target="_blank" href={"https://musicbrainz.org/artist/" + id}>
				<img alt="MusicBrainz Icon" className={styles.mbIcon} src="../assets/images/MusicBrainz_Logo.svg" />
			</a>
		</div>
	);
}

function UrlIcons({ artist }) {
	return (
		<>
			{artist.spotifyId && <SpotifyUrlContainer id={artist.spotifyId} />}
			{artist.spotifyIds &&
				artist.spotifyIds.map((spotifyId) =>
					<SpotifyUrlContainer id={spotifyId} />
				)
			}
			{artist.mbid && <MusicBrainzUrlContainer id={artist.mbid} />}
		</>
	);
}

function ImageContainer({ artist }) {
	const { mbid, imageUrl } = artist;
	let editNote = `Artist image imported from ''SAMBL''%0A'''Provider:''' Spotify%0A'''Source:''' ${imageUrl}`
	let importUrl = `https://musicbrainz.org/artist/${mbid}/edit?edit-artist.url.0.text=https://web.archive.org/web/0/${imageUrl}&edit-artist.url.0.link_type_id=173&edit-artist.edit_note=${editNote}`
	return (
		<div id="artistImageContainer" className={styles.artistImageContainer}>
			<div className={styles.imageWrapper}>
				<a href={imageUrl} target="_blank" className={styles.imageLink}>
					<img id="artistImage" className={styles.artistImage} src={imageUrl} />
				</a>

				{mbid &&<div className={styles.imageOverlay}>
					<span className={styles.overlayText}></span>
					
						<a href={importUrl} target="_blank"><div className={styles.importIcon} title="Import Artist Image to MusicBrainz"><LuImageUp /></div></a>
					
				</div>}
			</div>
		</div>
	)
}

export default function ArtistInfo({ artist }) {
	return (
		<>
			<div id="artistPageContainer" className={styles.artistPageContainer}>
				{artist.imageUrl && <ImageContainer artist={artist}/>}
				<div id="artistTextContainer" className={styles.artistTextContainer}>
					<div className={styles.nameContainer}>
						<h1 id="artistName" className={styles.artistName}>{artist.name || artist.names.join(" / ")}</h1>
						<UrlIcons artist={artist} />
					</div>
					<h2 id="artistFollowerCount" className={styles.artistFollowerCount}>{artist.followers} Followers</h2>
					<div id="artistGenres" className={styles.artistGenres}>{artist.genres}</div>
					<div id="artistPopularityContainer" className={styles.artistPopularityContainer} title={'Popularity: ' + artist.popularity + '%'}>
						<div id="artistPopularity" className={styles.artistPopularity}>Popularity:</div>
						<div id="artistPopularityBar" className={styles.artistPopularityBar}>
							<div id="artistPopularityFill" className={styles.artistPopularityFill} style={{ width: `${artist.popularity}%` }} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
