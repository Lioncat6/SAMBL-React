import logger from "./logger";

const NodeCache = require("node-cache");
const requestCache = new NodeCache();

export interface CacheOptions {
	ttl?: number;
	namespace?: string;
	noCache?: boolean;
}

export default function withCache<T extends (...args: any[]) => Promise<any>>(
	func: T,
	options: CacheOptions
) {
	let { ttl = 60 * 60, namespace = "", noCache = false } = options;
	return async function (...args: any[]) {
		let skipCache = noCache;
		if (
			args.length &&
			typeof args[args.length - 1] === "object" &&
			args[args.length - 1] !== null &&
			"noCache" in args[args.length - 1]
		) {
			skipCache = args[args.length - 1].noCache !== false;
			args = args.slice(0, -1);
		}
		const cacheKey = `${namespace ? namespace + ":" : ""}${func.name}-${JSON.stringify(args)}`;

		if (!skipCache) {
			const cachedResult = requestCache.get(cacheKey);
			if (cachedResult) {
				logger.debug(`Returned cached result for ${namespace ? namespace + ":" : ""}${func.name}`);
				return cachedResult;
			}
		}

		try {
			const result = await func(...args);
			requestCache.set(cacheKey, result, ttl);
			return result;
		} catch (error) {
			throw error;
		}
	};
}