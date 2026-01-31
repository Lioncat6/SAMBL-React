import Link from "next/link";

export default function Custom404() {
	return (<>
		<h1>500 Internal Server Error</h1>
		<Link href="/">
			<b> Return Home </b>
		</Link>
	</>)
}
