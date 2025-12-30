import styles from "../styles/artistInfo.module.css";
import { FaSpotify, FaDeezer, FaBandcamp, FaSoundcloud  } from "react-icons/fa6";
import { SiTidal, SiBandcamp, SiApplemusic } from "react-icons/si";
import { LuImageUp } from "react-icons/lu";
import editNoteBuilder from "../utils/editNoteBuilder";

function SpotifyUrlContainer({ id, url }) {
	return (
		<div className={styles.spURLContainer}>
			<a id="spURL" target="_blank" href={url || "https://open.spotify.com/artist/" + id}>
				<img alt="Spotify Icon" className={styles.spIcon} src="../assets/images/Spotify_icon.svg" />
			</a>
		</div>
	);
}

function TidalUrlContainer({ id, url }) {
	return (
		<div className={styles.tidalURLContainer}>
			<a id="tidalURL" target="_blank" href={url ||"https://tidal.com/artist/" + id}>
				<div className={styles.iconWrapper}>
					<SiTidal className={styles.tidalIcon} />
				</div>
			</a>
		</div>
	);
}

function DeezerUrlContainer({ id, url }) {
	return (
		<div className={styles.deezerURLContainer}>
			<a id="deezerUrl" target="_blank" href={url || "https://www.deezer.com/artist/" + id}>
				<img alt="Deezer Icon" className={styles.deezerIcon} src="../assets/images/Deezer_icon.svg" />
			</a>
		</div>
	);
}

function BandcampUrlContainer({ id, url }) {
	return (
		<div className={styles.bandcampURLContainer}>
			<a id="bandcampURL" target="_blank" href={url || `https://${id}.bandcamp.com`}>
				<div className={styles.iconWrapper}>
					<SiBandcamp className={styles.bandcampIcon} />
				</div>
			</a>
		</div>
	);
}

function SoundcloudUrlContainer({ url }) {
	return (
		<div className={styles.soundcloudUrlContainer}>
			<a id="bandcampURL" target="_blank" href={url}>
				<div className={styles.iconWrapper}>
					<FaSoundcloud className={styles.FaSoundcloud} />
				</div>
			</a>
		</div>
	);
}

function AppleMusicUrlContainer({ url }) {
	return (
		<div className={styles.applemusicURLContainer}>
			<a id="applemusicURL" target="_blank" href={url}>
				<div className={styles.iconWrapper}>
					<SiApplemusic className={styles.applemusicIcon} />
				</div>
			</a>
		</div>
	);
}

function UrlContainer({ id, provider, url }) {
	switch (provider) {
		case "spotify":
			return <SpotifyUrlContainer url={url} id={id} />;
		case "tidal":
			return <TidalUrlContainer url={url} id={id} />;
		case "deezer":
			return <DeezerUrlContainer url={url} id={id} />;
		case "musicbrainz":
			return <MusicBrainzUrlContainer url={url} id={id} />;
		case "bandcamp":
			return <BandcampUrlContainer url={url} id={id} />;
		case "soundcloud":
			return <SoundcloudUrlContainer url={url} />;
		case "applemusic":
			return <AppleMusicUrlContainer url={url} />;
		default:
			return null;
	}
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
			{artist.provider_id && <UrlContainer url={artist.url} provider={artist.provider} />}
			{artist.provider_ids &&
				artist.provider_ids.map((providerId) =>
					<UrlContainer id={providerId} provider={artist.provider} />
				)
			}
			{artist.mbid && <MusicBrainzUrlContainer id={artist.mbid} />}
		</>
	);
}

function ImageContainer({ artist }) {
	const { mbid, imageUrl } = artist;
	let editNote = editNoteBuilder.buildEditNote('Artist image', artist.provider, imageUrl, artist.url);
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

function PopularityContainer({ artist }) {
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

function FollowerContainer({ artist }) {
	if (artist.followers != null && artist.followers != "NaN") {
		return (
			<h2 id="artistFollowerCount" className={styles.artistFollowerCount}>{artist.followers} Followers</h2>
		);
	}
	return null;
}

function GenresContainer({ artist }) {
	if (artist.genres != null) {
		return (
			<div id="artistGenres" className={styles.artistGenres}>{Array.isArray(artist.genres) ? artist.genres.join(", ") : artist.genres}</div>
		);
	}
	return null;
}

export default function ArtistInfo({ artist }) {
	return (
		<>
			<div id="artistPageContainer" className={styles.artistPageContainer} style={{ "--background-image": `url('${artist.bannerUrl || ""}')` }}>
				{artist.imageUrl && <ImageContainer artist={artist}/>}
				<div id="artistTextContainer" className={styles.artistTextContainer}>
					<div className={styles.nameContainer}>
						<h1 id="artistName" className={styles.artistName}>{artist.name || artist.names?.join(" / ")}</h1>
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
