import React from "react";
import Header from "./header";
import Footer from "./footer";
import Head from "next/head";
export default function Layout({ children }) {
    return (
        <>
        <Head>
                <title>SAMBL</title>
                <meta name="description" content="Streaming Artist MusicBrainz Lookup" />
                <link rel="icon" type="image/svg+xml" href="../assets/images/favicon.svg" />
		        <link rel="icon" type="image/png" href="../assets/images/favicon.png" />
            </Head>
            <Header />
            <div id="main">{children}</div>
            <Footer />
        </>
    );
}