import styles from "../styles/artistInfo.module.scss";
import { FaSpotify, FaDeezer, FaBandcamp, FaSoundcloud } from "react-icons/fa6";
import { SiTidal, SiBandcamp, SiApplemusic } from "react-icons/si";
import { LuImageUp } from "react-icons/lu";
import editNoteBuilder from "../utils/editNoteBuilder";
import { ArtistPageData } from "../types/component-types";
import clientProviders from "../utils/clientProviders";
import { ProviderNamespace } from "../types/provider-types";

function Icon({ source }: { source: ProviderNamespace }) {
	const displayName = clientProviders.getDisplayName(source);
	const iconStyles = `${styles.urlIcon}${styles[source] ? ` ${styles[source]}` : ''}`;
	return (
		<>
			{source === "spotify" && <img className={iconStyles} title={displayName} src="../assets/images/Spotify_icon.svg" />}
			{source === "musicbrainz" && <img className={iconStyles} title={displayName} src="../assets/images/MusicBrainz_logo.svg" />}
			{source === "deezer" && <FaDeezer title={displayName} className={iconStyles} />}
			{source === "musixmatch" && <img className={iconStyles} title={displayName} src="../assets/images/Musixmatch_logo_icon_only.svg" />}
			{source === "tidal" && <SiTidal title={displayName} className={iconStyles} />}
			{source === "applemusic" && <SiApplemusic title={displayName} className={iconStyles} />}
			{source === "soundcloud" && <FaSoundcloud title={displayName} className={iconStyles} />}
			{source === "bandcamp" && <SiBandcamp title={displayName} className={iconStyles} />}
			{source === "naver" && <img className={iconStyles} title={displayName} src="../assets/images/Naver_icon.svg" />}
			{source === "qobuz" && <img className={iconStyles} title={displayName} src="../assets/images/Qobuz_icon.svg" />}
			{source === "discogs" && <img className={iconStyles} title={displayName} src="../assets/images/Discogs_icon.svg" />}
			{source === "volumo" && <img className={iconStyles} title={displayName} src="../assets/images/Volumo_icon.svg" />}
			{source === "subvert" && <img className={iconStyles} title={displayName} src="../assets/images/Subvert_logo.svg" />}
		</>
	);
}

function UrlContainer({ provider, url }: { provider: ProviderNamespace; url: string }) {
	return (
		<div className={`${styles.urlContainer}${styles[provider] ? ` ${styles[provider]}` : ''}`}>
			<a id="providerURL" target="_blank" href={url}>
				<Icon source={provider} />
			</a>
		</div>
	)
}

function UrlIcons({ artist }: { artist: ArtistPageData }) {
	return (
		<>
			{artist.urls ?
				artist.urls.map((url) =>
					<UrlContainer url={url} provider={artist.provider} />
				)
				:
				<UrlContainer url={artist.url.url} provider={artist.provider} />
			}
			{artist.mbid && <UrlContainer url={`https://musicbrainz.org/artist/${artist.mbid}`} provider="musicbrainz" />}
		</>
	);
}

function ImageContainer({ artist }: { artist: ArtistPageData }) {
	const { mbid, imageUrl, name } = artist;
	if (!imageUrl) return null;
	let editNote = editNoteBuilder.buildEditNote('Artist image', artist.provider, imageUrl, artist.url.url);
	let importUrl = `https://musicbrainz.org/artist/${mbid}/edit?edit-artist.url.0.text=https://web.archive.org/web/0/${imageUrl}&edit-artist.url.0.link_type_id=173&edit-artist.edit_note=${editNote}`
	return (
		<div id="artistImageContainer" className={styles.artistImageContainer}>
			<div className={styles.imageWrapper}>
				<a href={imageUrl} target="_blank" className={styles.imageLink}>
					<img id="artistImage" alt={`Artist image for ${name}`} className={styles.artistImage} src={imageUrl} />
				</a>

				{mbid && <div className={styles.imageOverlay}>
					<span className={styles.overlayText}></span>

					<a href={importUrl} target="_blank"><div className={styles.importIcon} title="Import Artist Image to MusicBrainz"><LuImageUp /></div></a>

				</div>}
			</div>
		</div>
	)
}

function PopularityContainer({ artist }: { artist: ArtistPageData }) {
	if (artist.popularity != null) {
		return (
			<div id="artistPopularityContainer" className={styles.artistPopularityContainer} title={'Popularity: ' + artist.popularity + '%'}>
				<div id="artistPopularity" className={styles.artistPopularity}>Popularity:</div>
				<div id="artistPopularityBar" className={styles.artistPopularityBar}>
					<div id="artistPopularityFill" className={styles.artistPopularityFill} style={{ width: `${artist.popularity}%` }} />
				</div>
			</div>
		);
	}
	return null;
}

function FollowerContainer({ artist }: { artist: ArtistPageData }) {
	if (artist.followers != null && !Number.isNaN(artist.followers)) {
		return (
			<h2 id="artistFollowerCount" className={styles.artistFollowerCount}>{artist.followers} Followers</h2>
		);
	}
	return null;
}

function GenresContainer({ artist }: { artist: ArtistPageData }) {
	if (artist.genres != null) {
		return (
			<div id="artistGenres" className={styles.artistGenres}>{artist.genres.join(", ")}</div>
		);
	}
	return null;
}

export default function ArtistInfo({ artist }: { artist: ArtistPageData }) {
	return (
		<>
			<div id="artistPageContainer" className={styles.artistPageContainer} style={{ "--background-image": `url('${artist.bannerUrl || ""}')` } as React.CSSProperties}>
				<ImageContainer artist={artist} />
				<div id="artistTextContainer" className={styles.artistTextContainer}>
					<div className={styles.nameContainer}>
						<h1 id="artistName" className={styles.artistName}>{artist.name}</h1>
						<UrlIcons artist={artist} />
					</div>
					<FollowerContainer artist={artist} />
					<GenresContainer artist={artist} />
					<PopularityContainer artist={artist} />
				</div>
			</div>
		</>
	);
}
