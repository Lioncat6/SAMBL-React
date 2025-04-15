export default function Home() {
	return (
		<>
			<div id="main">
				<textarea id="searchbox" rows={1} placeholder="Search for artist or enter id/url..." defaultValue={""} />
				<button type="button" id="searchEnter" onclick="lookup()">
					Search
				</button>
				<div id="err" />
				<div id="loadingMsg" />
			</div>
		</>
	);
}
