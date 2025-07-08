import SearchBox from "../components/SearchBox";
import Head from "next/head";
import getConfig from "next/config";

export default function Home() {
	const { publicRuntimeConfig } = getConfig();
	const  masondonUrl = publicRuntimeConfig?.masondonUrl || process.env.NEXT_PUBLIC_MASTODON_URL;
	return (
		<>
			{masondonUrl && (
				<Head>
					<link rel="me" href={publicRuntimeConfig?.masondonUrl} />
				</Head>
			)}
			<SearchBox />
		</>
	);
}
