import type { NextApiRequest, NextApiResponse } from 'next';
import { PingPongData, SAMBLApiError } from "../../types/api-types";
import { Stages } from '../../utils/timings';
import ServerAPIHandler from '../../utils/serverAPIHandler';
/**
 * @swagger
 * /api/ping:
 *   get:
 *     summary: Pong!
 *     description: Ping endpoint to check server status
 *     tags:
 *       - Health Check
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pong
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 *                 details:
 *                   type: string
 *                   example: Error details
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const stages = new Stages();
    const api = new ServerAPIHandler('ping', res, stages);
    try {
        api.response<PingPongData>(200, { data: "Pong" });
    } catch (error) {
        api.response(500, { error: { error: "Internal Server Error", details: error.message } });
    }
}