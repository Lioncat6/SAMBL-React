import Link from "next/link";
import styles from '../styles/header.module.css';

export default function Header() {
    return (
        <>
            <header className={styles.header}>
                <Link className={styles.samblWrapper} href="/">
                    <div className={styles.imagewrapper}>
                        <img src="assets/images/favicon.svg" alt="SAMBL Logo" className={styles.logo} />
                    </div>
                </Link>
                <div className={styles.textwrapper}>
                    <h1>SAMBL</h1>
                    <div className={styles.subdesc}>Streaming Artist MusicBrainz Lookup</div>
                </div>
                <div className={styles.buttonWrapper}>
                    <button className={styles.savedArtists}>
                        <div className={styles.buttonText}>
                            <i className="fa-solid fa-user" /> Artists
                        </div>
                    </button>
                    <button className={styles.configButton}>
                        <div className={styles.buttonText}>
                            <i className="fa-solid fa-gear" /> Configure
                        </div>
                    </button>
                </div>
            </header>
        </>
    );
}
