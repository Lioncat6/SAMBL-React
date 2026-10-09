export function normalizeVars(vars: Partial<{ [key: string]: string | string[]; }>): Partial<{ [key: string]: string; }> {
    const normalizedVars: { [key: string]: string | undefined; } = {};
    for (const key in vars) {
        const value = vars[key];
        if (Array.isArray(value)) {
            normalizedVars[key] = value[0];
        } else if (typeof value === 'string') {
            normalizedVars[key] = value;
        } else {
            normalizedVars[key] = undefined;
        }
    }
    return normalizedVars;
}

type pageVarValues =  (string | string[] | undefined)[] | string | undefined;

/**
 * Get all values from a list of string like variables
 * @param values Any string or string like value or list of values
 * @param delimiter Optional delimiter to split values with
 * @returns string[] Array of all values
 */
export function getAllValues(values: pageVarValues, delimiter?: string): string[] {
    let allValues: string[] = [];
    if (!values) return [];
    if (!Array.isArray(values)) values = [values];
    allValues = values.flatMap(value => {
        return value ?? []
    })
    if (delimiter) {
        for (let index in allValues) {
            const value = allValues[index];
            if (value.includes(delimiter)) {
                // Remove unsplit value and re-insert split values
                allValues.splice(Number(index), 1, ...value.split(delimiter))
            }
        }
    }
    return allValues;
}

export function getAllFromKeys(params: URLSearchParams, keys: string | string[]): string[] {
    keys = getAllValues(keys)
    let allValues: string[] = [];
    for (let key of keys) {
        allValues = allValues.concat(params.getAll(key))
    }
    return allValues;
}

export function hasAnyKey(params: URLSearchParams, keys: string | string[]): boolean {
    keys = getAllValues(keys)
    return !!params.keys().find(key => keys.includes(key))
}

export function deleteKeys(params: URLSearchParams, keys: string | string[]) {
    keys = getAllValues(keys)
    keys.forEach(key => {
        params.delete(key);
    })
}

export function getFirst(values: pageVarValues): string | undefined {
    return getAllValues(values)[0] ?? undefined;
}

export function getDestination(url: URL): string {
    return url.toString().replace(`${url.protocol}//${url.hostname}`, '')
}

/**
 * URL.searchParams.append but it can process multiple or single values
 * @param params URLSearchParams object
 * @param name query key
 * @param value query value or values
 */
export function setQuery(params: URLSearchParams, name: string, value: string | string[]) {
    const values = getAllValues(value);
    values.forEach(value => {
        params.append(name, value);
    })
}

export class PathOnlyURL extends URL {
    constructor(path: string) {
        super(path, 'foo://bar');
    }
    /**
     * URL.toString but just the path
     * @returns Stringified URL path without hostname or protocol
     */
    toString(): string {
        return getDestination(this)
    }
    /**
     * URL.searchParams.append but it can process multiple or single values
     * @param name query key
     * @param value query value or values
     */
    setQuery(name: string, value: string | string[]){
        setQuery(super.searchParams, name, value)
    }
} 