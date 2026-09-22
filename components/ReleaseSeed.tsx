import { useRef } from "react";
import seed from "../utils/seed";
import { AlbumStack } from "../types/aggregated-types";
import { ActionButton } from "./buttons";
import { useSettingsOrDefaults } from "./SettingsContext";

export function ReleaseSeedButton({ data, orgin }: { data?: AlbumStack, orgin: string }) {
	const { settings } = useSettingsOrDefaults();
	if (!data) return;
	const seedData = seed.buildSeed(data, orgin);
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
	return (
		<>
			<form
				ref={seedFormRef}
				action={`https://${settings.targetBaseUrl}/release/add`} //TODO: Multi-server support
				method='post'
				target={'_blank'}
				name={'SeedButtonForm'}
			>
				{Object.entries(seedData).flatMap(([key, valueOrValues]) => {
					return preferArray(valueOrValues).map((value) => <input type='hidden' name={key} value={value} key={key} />);
				})}
			</form>
            <ActionButton type="seed" onClick={seedRelease}/>
		</>
	)
}
