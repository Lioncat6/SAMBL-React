import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import scriptAndLanguage from "../../utils/scriptAndLanguage";
import { LangData, SAMBLAPIResponse } from "../../types/api-types";
import { Stages } from "../../utils/timings";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    var { text } = normalizeVars(req.query);
    var { threshold } = normalizeVars(req.query);
    const cleanThreshold = !Number.isNaN(Number(threshold)) ? Number(threshold): undefined
    try {
        const stages = new Stages()
        return res.status(200).json({data: {language: scriptAndLanguage.detectLanguage(text||"", cleanThreshold), script: scriptAndLanguage.detectScript(text||"")}, timings: stages.finish()} as SAMBLAPIResponse<LangData>)
    } catch (e) {
        return res.status(500).json({error: {error: "Failed to detect language", details: e}} as SAMBLAPIResponse<LangData>)
    }
}