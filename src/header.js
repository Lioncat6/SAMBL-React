export default function header() {
	return (
		<>
			<link rel="stylesheet" href="css/header.css" />
			<header>
				<a className="samblWrapper" href="./" target="_parent">
					<div className="imagewrapper">
						<img src="assets/images/favicon.svg" alt="SAMBL Logo" />
					</div>
				</a>
				<div className="textwrapper">
					<h1>SAMBL</h1>
					<div className="subdesc">Streaming Artist MusicBrainz Lookup</div>
				</div>
				<div id="buttonWrapper">
					<button id="savedArtists">
						<div id="buttonText">
							<i className="fa-solid fa-user" /> Artists
						</div>
					</button>
					<button id="configButton">
						<div id="buttonText">
							<i className="fa-solid fa-gear" /> Configure
						</div>
					</button>
				</div>
			</header>
		</>
	);
}
