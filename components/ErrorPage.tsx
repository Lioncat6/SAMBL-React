import { JSX } from "react";
import { ProviderNamespace } from "../pages/api/providers/provider-types";
import { errorType, SAMBLError } from "./component-types";
import Head from "next/head";
import styles from "../styles/ErrorPage.module.css";

const messages: Record<errorType, string> = {
    "provider": "A provider returned an error while generating this page",
    "general": "An error occurred while generating this page",
    "parameter": "A required parameter for this page is missing or malformed",
    "timeout": "A request timed out while generating this page",
    "fetch": "A request failed while generating this page"
}

function Code({code}: {code: string}){
    return (
        <code className={styles.codeBlock}>{code}</code>
    )
}

function Description({ error }: { error: SAMBLError | null }) {
    if (!error) return <>An unknown internal server error occurred while generating this page</>;

    const descriptions: Record<errorType, () => JSX.Element> = {
        "general": () => (
            <>
                {error.code && (
                    <>
                        An error occurred with code <Code code={error.code} />
                    </>
                )}
            </>
        ),
        "provider": () => (
            <>
                {error.provider ? (
                    <>
                        Provider <Code code={error.provider} /> returned an error!
                    </>
                ) : (
                    "An unknown provider returned an error"
                )}
            </>
        ),
        "parameter": () => (
            <>
                {error.parameters ? (
                    <>
                    {"The following required parameters required for this page are missing or malformed: "}
                    {error.parameters.map((parameter => 
                        <Code code={parameter} />
                    ))}
                    </> 
                ) : (
                    "One or more required parameters for this page are missing or malformed"
                )}
            </>
        ),
        "timeout": () => (
            <>
                {error.url ? (
                    <>A timeout occurred while fetching <Code code={error.url}/> </>
                ) : (
                    "A timeout occurred while fetching content for this page"
                )}
                {error.provider && (
                    <> for provider <Code code={error?.provider} /> </>
                )}
            </>
        ),
        "fetch": () => (
            <>
                {error.url ? (
                    <>Failed to fetch <Code code={error.url}/> </>
                ) : (
                    "An error occurred while fetching content for this page"
                )}
                {error.provider && (
                    <> for provider <Code code={error?.provider} /> </>
                )}
            </>
        )
    };

    return descriptions[error.type]?.();
}


export default function ErrorPage({error = null}: {error: SAMBLError | null}) {
    return (
        <>
        <Head>
				<title>{`SAMBL • Error`}</title>
				<meta name="description" content={`An error occurred while generating this page`} />
				<meta property="og:title" content={`SAMBL • Error`} />
				<meta property="og:description" content={`An error occurred while generating this page`} />
        </Head>
        <div>
            <h1>{error ? messages[error.type] : "An error occurred while generating this page"}</h1>
            <div><Description error={error} /></div>
            {error?.message && <div>Full error: <Code code={error?.message} /></div>}
        </div>
        </>
    );
}