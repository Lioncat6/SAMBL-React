import { NextRequest, NextResponse } from 'next/server'
import { deleteKeys, getAllFromKeys, getAllValues, hasAnyKey, setQuery } from './utils/pageVarsUtils';

export function proxy(request: NextRequest) {
    const nextUrl = request.nextUrl;
    let searchParams = nextUrl.searchParams;
    const spotifyIDKeys = ["spid", "spotifyId", "spids", "spotifyIds"]
    const artistIDKeys = [...spotifyIDKeys, "pid", "pids", "provider_ids"]
    if (hasAnyKey(searchParams, artistIDKeys)) {
        const isSpotify = hasAnyKey(searchParams, spotifyIDKeys)
        const artistIDs = getAllValues(getAllFromKeys(searchParams, artistIDKeys), ",");
        setQuery(searchParams, 'provider_id', artistIDs)
        if (isSpotify) searchParams.set('provider', 'spotify')
        deleteKeys(searchParams, artistIDKeys);
        return NextResponse.redirect(nextUrl.toString())
    }

    return NextResponse.next()
}