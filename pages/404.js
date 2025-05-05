import Link from "next/link";
import Head from "next/head";

export default function Custom404() {
	return (<>
		<Head>
			<title>SAMBL • Page Not Found</title>
			<meta name="description" content={"SAMBL • The requested page could not be found"} />
		</Head>
		<h1>404 Page Not Found</h1>
		<Link href="/">
			<b> Return Home </b>
		</Link>
	</>)
}
