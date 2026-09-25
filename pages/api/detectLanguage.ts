import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import scriptAndLanguage from "../../utils/scriptAndLanguage";
import { LangData, SAMBLAPIResponse } from "../../types/api-types";
import { Stages } from "../../utils/timings";
import ServerAPIHandler from "../../utils/serverAPIHandler";
import logger from "../../utils/logger";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    var { text } = normalizeVars(req.query);
    var { threshold } = normalizeVars(req.query);
    const cleanThreshold = !Number.isNaN(Number(threshold)) ? Number(threshold) : undefined
    const stages = new Stages()
    const api = new ServerAPIHandler('detectLanguage', res, stages, ['text']);
    try {
        return api.response<LangData>(200, { data: { language: scriptAndLanguage.detectLanguage(text || "", cleanThreshold), script: scriptAndLanguage.detectScript(text || "") } })
    } catch (error) {
        logger.error("Error in detectLanguage API", error);
        return api.response<LangData>(500, { error: { error: "Failed to detect language", details: error } });
    }
}