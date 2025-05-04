import styles from '../styles/footer.module.css'

export default function footer() {
	return (
		<>
			<footer className={styles.footer}>
				<div>
					Please report any bugs or suggestions here{" "}
					<a rel="noopener" href="https://github.com/Lioncat6/SAMBL-React" target="_blank">
						Github
					</a>{" "}
					|{" "}
					<a rel="noopener" href="https://community.metabrainz.org/t/sambl-spotify-artist-musicbrainz-lookup/716550" target="_blank">
						MetaBrainz
					</a>
					
					{/* <div>
						<div id="commitId" />
						<div id="serverStatus" className={styles.serverStatus}>
							Server Status:
							<div className={styles.loader} />
						</div>
					</div> */}
				</div>
			</footer>
		</>
	);
}
