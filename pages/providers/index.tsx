import { FaCheck, FaXmark } from "react-icons/fa6";
import providers from "../../lib/providers/providers";
import { AlbumDataPresence, DataAvailability, FullProvider, ProviderNamespace, TracKDataPresence } from "../../types/provider-types";
import text from "../../utils/text";
import { TbTilde } from "react-icons/tb";
import { FaCheckDouble } from "react-icons/fa";
import { MdAlbum, MdAudiotrack } from "react-icons/md";
import { IoMdRefresh } from "react-icons/io";
import styles from '../../styles/providersPage.module.scss'
import providerColors from '../../styles/providerColors.module.css'
import clientProviders from "../../utils/clientProviders";

type providerCapabilityNames =
    "Get artist by ID" |
    "Get album by ID" |
    "Get track by ID" |
    "Search for artists" |
    "Get artist albums" |
    "Lookup UPC" |
    "Lookup ISRC"

type providerAvalibilityNames =
    'ISRC avalibility' |
    'ISRC presence' |
    'UPC avalibility' |
    'UPC presence'

const capabilities: Record<providerCapabilityNames, keyof FullProvider> = {
    'Get artist by ID': 'getArtistById',
    'Get album by ID': 'getAlbumById',
    'Get track by ID': 'getTrackById',
    'Search for artists': 'searchByArtistName',
    'Get artist albums': 'getArtistAlbums',
    'Lookup UPC': 'getAlbumByUPC',
    'Lookup ISRC': 'getTrackByISRC'
}

type allCapabilities = providerCapabilityNames | providerAvalibilityNames

type x = {
    [key in allCapabilities]?: string | boolean | null;
};

interface providerRow extends x {
    icon: null
    name: string
    namespace: ProviderNamespace
}


export async function getStaticProps() {
    const capabilityRecord: providerRow[] = [];
    const allProviders = providers.getAllProviders();
    allProviders.forEach((provider) => {
        const providerRecord: providerRow = {
            icon: null,
            name: clientProviders.getDisplayName(provider.namespace),
            namespace: provider.namespace
        };
        for (const [key, value] of Object.entries(capabilities)) {
            providerRecord[key] = (value in provider)
        }
        providerRecord["ISRC avalibility"] = provider.config?.capabilities.isrcs?.availability || null
        providerRecord["ISRC presence"] = provider.config?.capabilities.isrcs?.presence || null
        providerRecord["UPC avalibility"] = provider.config?.capabilities.upcs?.availability || null
        providerRecord["UPC presence"] = provider.config?.capabilities.upcs?.presence || null
        capabilityRecord.push(providerRecord);
    })
    return {
        props: {
            providers: capabilityRecord
        }
    }
}

export default function ProvidersPage({ providers }: { providers: providerRow[] }) {
    if (providers.length == 0) {
        return null;
    }
    function formatValue(value: boolean | null | string | undefined, key: keyof providerRow, namespace: ProviderNamespace): React.ReactNode {
        const APIconRecord: Record<DataAvailability | AlbumDataPresence | TracKDataPresence, React.ReactNode> = {
            never: <FaXmark className={styles.never} title={"Data is never avalible for this provider"} />,
            always: <FaCheck className={styles.always} title={"Data is always avalible for this provider"} />,
            sometimes: <TbTilde className={styles.sometimes} title={"Data is sometimes avalible for this provider"} />,
            onAlbumRefresh: <span className={styles.refresh} title={"Data requires an album refresh for this provider"}><MdAlbum /><IoMdRefresh /></span>,
            onTrackRefresh: <span className={styles.refresh} title={"Data requires a track refresh for this provider"}><MdAudiotrack /><IoMdRefresh /></span>
        }
        if (key == 'icon') {
            return <span className={providerColors[namespace]}>{clientProviders.getDisplayIcon(namespace)}</span>
        }
        if (typeof value === "boolean") {
            return value ? <FaCheck className={styles.alwaysPassive} title={"Function is supported by this provider"} /> : <FaXmark className={styles.neverPassive} title={"Function is not supported by this provider"} />
        }
        if (!value) return <span title={"Property not set for this provider"} className={styles.never}>-</span>;
        if (APIconRecord[value]) return APIconRecord[value];
        return value;
    }
    const keys = Object.keys(providers[0]) as Array<keyof providerRow>;
    return (
    <>
        <h1>Supported Providers & Capabilities</h1>
        <table className={styles.table}>
            <thead>
                <tr>
                    {keys.map((key) => (
                        <th key={String(key)}>{text.capitalizeFirst(String(key), false)}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {providers.map((row) => (
                    <tr key={row.namespace}>
                        {keys.map((key) => (
                            <td key={`${row.namespace}-${String(key)}`} className={styles.tableValue}>{formatValue(row[key], key, row.namespace)}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
        </>
    );
}
