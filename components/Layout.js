import React from "react";
import Header from "./header";
import Footer from "./footer";
import Head from "next/head";
import { ThemeProvider } from "next-themes";


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
            <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div id="main">{children}</div>
            </ThemeProvider>
            <Footer />
        </>
    );
}