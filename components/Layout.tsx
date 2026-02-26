import React, { JSX } from "react";
import Header from "./header";
import Footer from "./footer";
import Head from "next/head";
import { ThemeProvider, useTheme } from "next-themes";
import { ToastContainer, Flip } from "react-toastify";
import { ExportState } from "./ExportState";

function LayoutContent({ children }: { children: JSX.Element}) {
    const { systemTheme } = useTheme();
    return (
        <>
            <Head>
                <title>SAMBL</title>
                <meta property="og:title" content="SAMBL" />
                <meta property="og:site_name" content="SAMBL" />
                <meta name="description" content="Streaming Artist MusicBrainz Lookup" />
                <link rel="icon" type="image/svg+xml" href="../assets/images/favicon.svg" />
                <link rel="icon" type="image/png" href="../assets/images/favicon.png" />
            </Head>
            <Header />
            <div id="main">{children}</div>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={systemTheme === "dark" ? "dark" : "light"}
                transition={Flip}
            />
            <Footer />
        </>
    );
}

export default function Layout({ children }: { children: JSX.Element}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <ExportState>
                <LayoutContent>{children}</LayoutContent>
            </ExportState>
        </ThemeProvider>
    );
}