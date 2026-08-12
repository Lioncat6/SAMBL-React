import { GenericObject } from "../types/provider-types";

function deduplicate<T extends GenericObject>(a: T[]): T[] {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item.id || '') ? false : (seen[item.id || ''] = true);
    });
}

let objectUtils = {
    deduplicate
}

export default objectUtils;