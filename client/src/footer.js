export default function footer() {
	return (
		<>
			<link rel="stylesheet" href="css/footer.css" />
			<footer>
				<div>
					Please report any bugs or suggestions here{" "}
					<a rel="noopener" href="https://github.com/Lioncat6/SAMBL" target="_blank">
						Github
					</a>{" "}
					|{" "}
					<a rel="noopener" href="https://community.metabrainz.org/t/sambl-spotify-artist-musicbrainz-lookup/716550" target="_blank">
						MetaBrainz
					</a>
					<div>
						<div id="commitId" />
						<div id="serverStatus">
							Server Status:
							<div className="loader" />
						</div>
					</div>
				</div>
			</footer>
		</>
	);
}
