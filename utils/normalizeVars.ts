export default function (vars: Partial<{ [key: string]: string | string[]; }>): any {
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