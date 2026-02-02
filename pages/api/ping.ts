import type { NextApiRequest, NextApiResponse } from 'next';
import { SAMBLApiError } from "../../types/api-types";
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
export default async function handler(req:NextApiRequest, res:NextApiResponse) {
    try {
        res.status(200).json({message: "Pong"});
	} catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message } as SAMBLApiError);
    }
}