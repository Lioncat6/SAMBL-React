import "../styles/main.css";
import Layout from "../components/Layout";
import Router from "next/router";
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
const ProgressBar = dynamic(() => import('/components/ProgressBar.js'), { ssr: false });
import { SettingsProvider } from "../components/SettingsContext";

export default function App({ Component, pageProps }) {
    return (
        <>

                <SettingsProvider>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                    <ProgressBar />
                </SettingsProvider >


        </>

    );
}
