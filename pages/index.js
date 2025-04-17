import Head from "next/head";
import Home from "./home";

export default function Index() {
    return (
        <>
            <Head>
                <title>SAMBL</title>
                <meta name="description" content="Streaming Artist MusicBrainz Lookup" />
            </Head>
            <Home />
        </>
    );
}