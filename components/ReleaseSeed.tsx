import { JSX, useRef } from "react";
import seed from "../utils/seed";
import { AlbumStack } from "../types/aggregated-types";
import { ActionButton, PopupActionButton } from "./buttons";
import { useSettingsOrDefaults } from "./SettingsContext";
import { FaLink } from "react-icons/fa6";
import albumStack from "../utils/albumStack";

export function ReleaseSeedButton({ data, origin, type = "seed" }: { data?: AlbumStack, origin: string, type?: "seed" | "urls" }) {
	const { settings } = useSettingsOrDefaults();
	if (!data) return null;
	const [aggregatedAlbum, sourceAlbum, targetAlbum] = albumStack.unstack(data)
	const { mbid } = aggregatedAlbum;
	let seedData: Record<string, any> | undefined = undefined;
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

	switch (type) {
		case "seed":
			seedData = seed.buildSeed(data, origin)
			button = <ActionButton type="seed" onClick={seedRelease} />
			targetUrl = `https://${settings.targetBaseUrl}/release/add`
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
			<form
				ref={seedFormRef}
				action={targetUrl}
				method='post'
				target={'_blank'}
				name={'SeedButtonForm'}
			>
				{Object.entries(seedData).flatMap(([key, valueOrValues]) => {
					return preferArray(valueOrValues).map((value) => <input type='hidden' name={key} value={value} key={key} />);
				})}
			</form>
			{button}
		</>
	)
}