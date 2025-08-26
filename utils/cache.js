import logger from "./logger";

const NodeCache = require("node-cache");

const requestCache = new NodeCache();

export default function withCache(func, options) {
	let { ttl = 60 * 60, namespace = "", noCache = false } = options;
	return async function (...args) {
		let skipCache = noCache;
		// If last arg is an object and has noCache, use it and remove it from args
		if (args.length && typeof args[args.length - 1] === "object" && args[args.length - 1] !== null && "noCache" in args[args.length - 1]) {
			skipCache = args[args.length - 1].noCache !== false;
			args = args.slice(0, -1); // Remove the last argument (the options object)
		}
		const cacheKey = `${namespace ? namespace + ":" : ""}${func.name}-${JSON.stringify(args)}`;

		if (!skipCache) { //Not skipping cache
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
