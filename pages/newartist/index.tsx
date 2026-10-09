import ArtistInfo from "../../components/ArtistInfo";
import { AddButtons } from "../../components/buttons";
import Head from "next/head";
import { ProviderNamespace } from "../../types/provider-types";
import { ArtistPageData, ArtistPageProps, SAMBLError } from "../../types/component-types";
import ErrorPage from "../../components/ErrorPage";
import { SAMBLApiError, ArtistData, ArtistLookupData } from "../../types/api-types";
import SAMBLHead from "../../components/SAMBLHead";
import text from "../../utils/text";
import clientProviders from "../../utils/clientProviders";
import { RawSAMBLFetch, SAMBLFetch } from "../../utils/clientAPIHandler";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { getAllValues, getFirst } from "../../utils/pageVarsUtils";
import Notice from "../../components/notices";

async function fetchArtistData(id: string, provider: string) {
    try { 
        const [data, timings] = await SAMBLFetch<ArtistData>(`/api/getArtistInfo?provider_id=${id}&provider=${provider}&mbData`, true);
        return data;
    } catch (error) {
       throw new Error(`Failed to fetch artist data: ${error}`);
    }
}

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<ArtistPageProps>> {
    try {
        let { provider, provider_id } = context.query;
        const artistIDs = getAllValues(provider_id);
        const artistID = getFirst(artistIDs);
        const sourceProvider = getFirst(provider);
        const noRedirect = Object.prototype.hasOwnProperty.call(context.query, "noRedirect");

        if (!sourceProvider) {
			const error: SAMBLError = {
				type: "parameter",
				parameters: ["provider"]
			}
			return {
				props: { error }
			}
		}

		if (!artistID) {
			const error: SAMBLError = {
				type: "parameter",
				parameters: ["provider_id"]
			}
			return {
				props: { error }
			}
		}

        if (!noRedirect){
            const response = await RawSAMBLFetch<ArtistLookupData>(`/api/lookupArtist?provider_id=${artistID}&provider=${provider}`, true)
            if (response.data) {
                const { mbid } = response.data;
                if (mbid) {
                    return {
                        redirect: {
                            destination: `/artist?provider_id=${provider_id}&provider=${provider}&artist_mbid=${mbid}`,
                            permanent: false,
                        },
                    };
                }
            }
        }

        const data = (await fetchArtistData(artistID, sourceProvider)).providerData;
        if (String(data.id).trim() != artistID.trim() && !noRedirect) {
            return {
                redirect: {
                    destination: `/newartist?provider_id=${data.id}&provider=${provider}`,
                    permanent: false,
                },
            };
        }
        const artist: ArtistPageData = {
            ...data,
            ids: artistIDs,
            mbid: null
        };

        return {
            props: { artist },
        };
    } catch (error) {
        console.error("Error fetching artist data:", error);
        const samblError: SAMBLError = {
            type: "general",
            message: String(error)
        }
        return {
            props: {
                error: samblError
            }
        }
    }
}

export default function NewArtist({ artist, error }: { artist?: ArtistPageData, error: SAMBLError }) {
    if (error || !artist) {
        return <ErrorPage error={error} />
    }
    return (
        <>
            <SAMBLHead
                title={`SAMBL • ${artist.name}`}
                fullTitle={`New Artist • ${artist.name}`}
                image={artist.imageUrl}
                description={text.infoToString([
                    clientProviders.getDisplayName(artist.provider),
                    artist.info,
                    artist.relevance,
                ])}
            />
            {(artist.ids && artist.ids?.length > 1) && <Notice text={`This page only supports a single artist ID; Ignored IDs: ${artist.ids.toSpliced(0, 1).join(", ")}`} />}
            <ArtistInfo artist={artist} />
            <div id="contentContainer">
                <AddButtons artist={artist} />
            </div>
        </>
    );
}