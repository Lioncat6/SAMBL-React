import styles from '../styles/footer.module.css'

const links: { name: string, href: string }[] = [
	{ name: "Github", href: "https://github.com/Lioncat6/SAMBL-React" },
	{ name: "MetaBrainz", href: "https://community.metabrainz.org/t/sambl-streaming-artist-musicbrainz-lookup/716550" },
	{ name: "Donate", href: "https://ko-fi.com/lioncat6" }
]

export default function footer() {
	return (
		<>
			<footer className={styles.footer}>
				<div>
					{/* <div className={styles.footerText}>Please report any bugs or suggestions here{" "}</div> */}
					{links.map((link, index) => (
						<span key={index}>
							{index > 0 && (
								<>{" "}|{" "}</>
							)}
							<a rel="noopener" href={link.href} target="_blank" key={index}>
								{link.name}
							</a>
						</span>
					))}

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
