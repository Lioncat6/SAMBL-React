import Head from "next/head";

export default function SAMBLHead({ title, fullTitle, description, image }: { title: string, fullTitle?: string | null, description?: string | null, image?: string | null }) {
    
    return (
        <>
            <Head>
                <title>{title}</title>
                {description && <>
                    <meta name="description" content={description} key="description" />
                    <meta property="og:description" content={description} key="ogDescription" />
                </>}
                {image && <meta property="og:image" content={image} key="image" />}
                <meta property="og:title" content={fullTitle || title} key="title" />
            </Head>
        </>
    )
}