import { AlbumIssue, TrackIssue, AlbumStatus } from "../utils/aggregated-types";

interface IssueDefinition {
    label: string;
    description: string;
    severity: "low" | "medium" | "high";
}

export const AlbumIssues: Record<AlbumIssue, IssueDefinition> = {
    noUPC: {
        label: "No UPC",
        description: "Album is missing a UPC code",
        severity: "high",
    },
    UPCDiff: {
        label: "UPC Mismatch",
        description: "UPC differs across providers",
        severity: "high",
    },
    missingISRCs: {
        label: "Missing ISRCs",
        description: "Some tracks lack ISRC codes",
        severity: "medium",
    },
    ISRCDiff: {
        label: "ISRC Mismatch",
        description: "ISRCs differ across providers",
        severity: "medium",
    },
    trackDiff: {
        label: "Track Count Mismatch",
        description: "Track count differs across providers",
        severity: "high",
    },
    noDate: {
        label: "No Release Date",
        description: "Album is missing a release date",
        severity: "low",
    },
    dateDiff: {
        label: "Date Mismatch",
        description: "Release date differs across providers",
        severity: "low",
    },
    noCover: {
        label: "No Cover Art",
        description: "Album is missing cover artwork",
        severity: "low",
    },
};

export const TrackIssues: Record<TrackIssue, IssueDefinition> = {
    noISRC: {
        label: "No ISRC",
        description: "Track is missing an ISRC code",
        severity: "high",
    },
    ISRCDiff: {
        label: "ISRC Mismatch",
        description: "ISRC differs across providers",
        severity: "medium",
    },
    noUrl: {
        label: "No URL",
        description: "Track is missing a provider URL",
        severity: "low",
    },
    noDuration: {
        label: "No Duration",
        description: "Track duration is missing",
        severity: "low",
    },
    artistDiff: {
        label: "Artist count mismatch",
        description: "Artist count differs across providers",
        severity: "medium"
    }
};

// export const getSeverityColor = (severity: IssueDefinition["severity"]): AlbumStatus => {
//     const colorMap = { low: "green", medium: "orange", high: "red" } as const;
//     return colorMap[severity];
// };