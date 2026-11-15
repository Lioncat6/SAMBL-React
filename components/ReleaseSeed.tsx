import { JSX, useRef } from "react";
import seed from "../utils/seed";
import { AlbumStack } from "../types/aggregated-types";
import { ActionButton, PopupActionButton } from "./buttons";
import { useSettingsOrDefaults } from "./SettingsContext";
import { FaLink } from "react-icons/fa6";
import albumStack from "../utils/albumStack";

export function ReleaseSeedButton({ data, origin, type = "seed" }: { data?: AlbumStack, origin: string, type?: "seed" | "urls" | "recording" }) {
	const { settings } = useSettingsOrDefaults();
	if (!data) return null;
	const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(data)
	const { mbid } = aggregatedAlbum;
	let seedData: Record<string, any> | undefined | null = undefined;
	let button: JSX.Element | undefined = undefined;
	let targetUrl: string | undefined = undefined;
	function preferArray<T>(maybeArray: T | T[]) {
		if (!Array.isArray(maybeArray)) return [maybeArray];
		return maybeArray;
	}
	const seedFormRef = useRef<HTMLFormElement>(null);
	const seedRelease = () => {
		if (seedFormRef.current) {
			seedFormRef.current.submit();
		}
	}
	const openRecordingSeedLink = () => {
		const baseUrl = new URL(`https://${settings.targetBaseUrl}/recording/create`);
		if (!seedData) return;
		for (let [key, value] of Object.entries(seedData)) {
			// Because of course the URL editor form keys aren't compatible with the normal post method
			key = key.replace(/urls\.(\d*)\.url/, 'url.$1.text').replace(/urls\.(\d*)\.link_type/, 'url.$1.link_type_id')
			if (key == 'artist_credit.names.0.mbid'){
				baseUrl.searchParams.append(`artist`, String(value));
			} 
			baseUrl.searchParams.append(`edit-recording.${key}`, String(value));
		}
		window.open(baseUrl.toString())
	}
	switch (type) {
		case "seed":
			seedData = seed.buildSeed(data, origin)
			button = <ActionButton type="seed" onClick={seedRelease} />
			targetUrl = `https://${settings.targetBaseUrl}/release/add`
			break;
		case "recording":
			seedData = seed.buildRecordingSeed(data, origin)
			button = <ActionButton type="recording" onClick={openRecordingSeedLink} />
			targetUrl = `https://${settings.targetBaseUrl}/recording/create`
			break;
		case "urls":
			seedData = seed.seedUrls(data, origin)
			button = <PopupActionButton type="button" onClick={seedRelease}><FaLink /> Import release URLs</PopupActionButton>
			targetUrl = `https://${settings.targetBaseUrl}/release/${mbid}/edit`
			break;
	}

	if (!targetUrl || !seedData) return null;

	return (
		<>
			{ type != "recording" && <form
				ref={seedFormRef}
				action={targetUrl}
				method='post'
				target={'_blank'}
				name={'SeedButtonForm'}
			>
				{Object.entries(seedData).flatMap(([key, valueOrValues]) => {
					return preferArray(valueOrValues).map((value) => <input type='hidden' name={key} value={value} key={key} />);
				})}
			</form>}
			{button}
		</>
	)
}