import "../styles/main.css";
import Layout from "../components/Layout";
import Router from "next/router";
import {useState, useEffect} from "react";
import dynamic from 'next/dynamic';
const ProgressBar = dynamic(() => import('/components/ProgressBar.js'), { ssr: false });

export default function App({ Component, pageProps }) {
    return (
        <>
        <Layout>
            <Component {...pageProps} />
        </Layout>
        <ProgressBar />
        </>
        
    );
}

// export default function App({ Component, pageProps }) {
// 	const [loading, setLoading] = useState(false);
// 	useEffect(() => {
// 		const start = () => {
// 			setLoading(true);
// 		};
// 		const end = () => {
// 			setLoading(false);
// 		};
// 		Router.events.on("routeChangeStart", start);
// 		Router.events.on("routeChangeComplete", end);
// 		Router.events.on("routeChangeError", end);
// 		return () => {
// 			Router.events.off("routeChangeStart", start);
// 			Router.events.off("routeChangeComplete", end);
// 			Router.events.off("routeChangeError", end);
// 		};
// 	}, []);
// 	return (
// 		<>
// 			<Layout>{loading ? <h1>Loading...</h1> : <Component {...pageProps} />}</Layout>
// 		</>
// 	);
// }
