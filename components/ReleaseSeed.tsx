import { useRef } from "react";
import seed from "../utils/seed";
import { AggregatedAlbum } from "../types/aggregated-types";
import { ActionButton } from "./buttons";

export function ReleaseSeedButton({ data }: { data?: AggregatedAlbum }) {
	if (!data) return;
	const seedData = seed.buildSeed(data);
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
				action={`https://musicbrainz.org/release/add`} //TODO: Multi-server support
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
