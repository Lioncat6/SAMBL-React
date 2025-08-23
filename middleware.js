import { NextResponse } from 'next/server'

export function middleware(request) {
    const url = new URL(request.url)
    const spotifyParams = ["spid", "spotifyId"]
    const spotifyRedirect = spotifyParams.find(param => url.searchParams.has(param))
    if (spotifyRedirect) {
        url.searchParams.set('provider_id', url.searchParams.get(spotifyRedirect))
        url.searchParams.set('provider', 'spotify')
        url.searchParams.delete(spotifyRedirect)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}