import logger from "./logger";

const NodeCache = require("node-cache");
const requestCache = new NodeCache();

export interface CacheOptions {
	ttl?: number;
	namespace?: string;
	noCache?: boolean;
}

type NoCacheOverride = { noCache?: boolean };

export default function withCache<T extends (...args: any[]) => Promise<any>>(func: T, options: CacheOptions) {
	type Args = Parameters<T>;
	type Return = ReturnType<T>;

	return async function (...args: [...Args, NoCacheOverride?]): Promise<Awaited<Return>> {
		let { ttl = 60 * 60, namespace = "", noCache = false } = options;

		let skipCache = noCache;
		if (
			args.length &&
			typeof args[args.length - 1] === "object" &&
			args[args.length - 1] !== null &&
			"noCache" in (args[args.length - 1] as any)
		) {
			const override = args.pop() as NoCacheOverride;
      		skipCache = override.noCache !== false;
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