export default function SAMBLUserAgent(): string  {
    return `(SAMBL - Streaming Artist MusicBrainz Lookup | ${process.env.NEXT_PUBLIC_URL || "https://sambl.lioncat6.com"}${process.env.CONTACT_INFO ? ` | ${process.env.CONTACT_INFO}` : ""})`;
}