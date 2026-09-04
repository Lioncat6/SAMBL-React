import { TiPlus } from "react-icons/ti";
import styles from '../styles/icons.module.css'
import { PartialArtistObject } from '../types/provider-types'

export function SAMBLArtistIcon({artist, hasMBIDData = false}: {artist: PartialArtistObject, hasMBIDData?: boolean}) {
    return (
        <a href={`../${!artist.mbid ? 'new' : ''}artist?provider_id=${artist.id}&provider=${artist.provider}${artist.mbid ? `&artist_mbid=${artist.mbid}`: ''}`} target="_blank" rel="noopener noreferrer">
            {(artist.mbid || !hasMBIDData) ? 
            <img className={styles.SAMBLicon} src="../assets/images/favicon.svg" alt="SAMBL" /> :
            <TiPlus title={"Add artist with SAMBL"}/>
            }
        </a>
    )
}
