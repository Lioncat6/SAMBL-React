import Link from "next/link";
import SAMBLHead from "../components/SAMBLHead";

export default function Custom404() {
	return (<>
		<SAMBLHead 
			title="SAMBL • Internal Server Error"
			description="500 • Internal Server Error"
		/>
		<h1>500 Internal Server Error</h1>
		<Link href="/">
			<b> Return Home </b>
		</Link>
	</>)
}
