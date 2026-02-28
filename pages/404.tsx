import Link from "next/link";
import SAMBLHead from "../components/SAMBLHead"

export default function Custom404() {
	return (<>
		<SAMBLHead 
			title="SAMBL • Page Not Found"
			description="404 • The requested page could not be found"
		/>
		<h1>404 Page Not Found</h1>
		<Link href="/">
			<b> Return Home </b>
		</Link>
	</>)
}
