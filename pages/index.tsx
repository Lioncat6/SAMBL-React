import SearchBox from "../components/SearchBox";
import Head from "next/head";
import getConfig from "next/config";

export default function Home() {
	const { publicRuntimeConfig } = getConfig();
	const  mastodonUrl = publicRuntimeConfig?.mastodonUrl || process.env.NEXT_PUBLIC_MASTODON_URL;
	return (
		<>
			{mastodonUrl && (
				<Head>
					<link rel="me" href={mastodonUrl} />
				</Head>
			)}
			<SearchBox />
		</>
	);
}
