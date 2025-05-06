import "../styles/main.css";
import Layout from "../components/Layout";
import Router from "next/router";
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import Head from "next/head";
const ProgressBar = dynamic(() => import('../components/ProgressBar.js'), { ssr: false });
import { SettingsProvider } from "../components/SettingsContext";
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'SAMBL',
    description: 'SAMBL Streaming Artist MusicBrainz Lookup',
  }
  

export default function RootLayout({ Component, pageProps }) {
    return (
        <>
            <Head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="icon" type="image/svg+xml" href="assets/images/favicon.svg" />
                <link rel="icon" type="image/png" href="assets/images/favicon.png" />
                <title>SAMBL</title>
            </Head>
            <body>
                <SettingsProvider>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                    <ProgressBar />
                </SettingsProvider>
            </body>
        </>
    );
}
