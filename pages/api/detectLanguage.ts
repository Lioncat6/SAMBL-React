import { NextApiRequest, NextApiResponse } from "next";
import normalizeVars from "../../utils/normalizeVars";
import scriptAndLanguage from "../../utils/scriptAndLanguage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    var { text } = normalizeVars(req.query);
    return res.status(200).json([scriptAndLanguage.detectLanguage(text||""), scriptAndLanguage.detectScript(text||"")])
}