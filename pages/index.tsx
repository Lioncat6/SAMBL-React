import SearchBox from "../components/SearchBox";
import Head from "next/head";

export default function Home() {
	const  mastodonUrl = process.env.NEXT_PUBLIC_MASTODON_URL;
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
