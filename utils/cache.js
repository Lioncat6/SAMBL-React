import logger from './logger'

const NodeCache = require("node-cache");

const requestCache = new NodeCache();

export default function withCache(func, ttl = 60 * 60) {
	return async function (...args) {
		const cacheKey = `${func.name}-${JSON.stringify(args)}`;
		const cachedResult = requestCache.get(cacheKey);
		if (cachedResult) {
            logger.debug(`Returned cached result for ${func.name}`);
			return cachedResult;
		}

		try {
			const result = await func(...args);
			requestCache.set(cacheKey, result, ttl);
			return result;
		} catch (error) {
			// Don't cache on error, just rethrow
			throw error;
		}
	};
}
