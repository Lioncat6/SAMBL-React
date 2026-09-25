import { Provider, ProviderNamespace } from "../types/provider-types";
import text from "./text";
import { FaSpotify, FaDeezer, FaSoundcloud, FaQuestion } from "react-icons/fa6";
import { SiTidal, SiBandcamp, SiApplemusic, SiNaver, SiDiscogs, SiMusicbrainz } from "react-icons/si";
import { TbCircleDashedLetterS, TbVinyl } from "react-icons/tb";
import { PiLetterCircleVFill } from "react-icons/pi";
import { ProviderDisplay } from "../types/component-types";
import { JSX } from "react/jsx-runtime";

function isDisabled(provider: Provider): boolean {
    const disabledProviders = process.env.NEXT_PUBLIC_DISABLED_PROVIDERS ? process.env.NEXT_PUBLIC_DISABLED_PROVIDERS.split(",").map(p => p.trim().toLowerCase()) : [];
    return disabledProviders.some((p) => (p === provider.namespace.toLowerCase()));
}

function getDisplayName(provider: ProviderNamespace | Provider): string {
    const namespace = typeof provider == "string" ? provider : provider.namespace;
    return GetDisplayProviders().find((p) => p.namespace == namespace)?.name ?? text.capitalizeFirst(namespace);
}

function getDisplayIcon(provider: ProviderNamespace | Provider): JSX.Element {
    const namespace = typeof provider == "string" ? provider : provider.namespace;
    return GetDisplayProviders().find((p) => p.namespace == namespace)?.icon ?? <FaQuestion />;
}

function GetDisplayProviders() {
    let providerArray: ProviderDisplay[] = [
        { name: 'MusicBrainz', namespace:'musicbrainz', icon: <SiMusicbrainz />, hide: true},
        { name: "Spotify", namespace: "spotify", icon: <FaSpotify /> },
        { name: "Apple Music", namespace: "applemusic", icon: <SiApplemusic /> },
        { name: "Deezer", namespace: "deezer", icon: <FaDeezer /> },
        { name: "Tidal", namespace: "tidal", icon: <SiTidal /> },
        { name: "Bandcamp", namespace: "bandcamp", icon: <SiBandcamp /> },
        { name: "SoundCloud", namespace: "soundcloud", icon: <FaSoundcloud /> },
        { name: "Naver VIBE", namespace: "naver", icon: <SiNaver />},
        { name: "Qobuz", namespace: "qobuz", icon: <TbVinyl />},
        { name: 'Discogs', namespace: "discogs", icon: <SiDiscogs /> },
        { name: 'Volumo', namespace: "volumo", icon: <PiLetterCircleVFill /> },
        { name: 'Subvert', namespace: "subvert", icon: <TbCircleDashedLetterS /> }
    ];
    return providerArray;
}

const clientProviders = {
    isDisabled,
    getDisplayName,
    getDisplayIcon,
    GetDisplayProviders
}

export default clientProviders;