import { NextApiResponse } from "next";
import { SAMBLAPIData, SAMBLAPIResponse } from "../types/api-types";
import { Stages } from "./timings";

type SAMBLAPIResponseWithoutTimings<T> = Omit<SAMBLAPIResponse<T>, "timings">

function SAMBLResponse<T extends SAMBLAPIData | never = never>(res: NextApiResponse, code: number, response: SAMBLAPIResponseWithoutTimings<T>, stages: Stages) {
    return res.status(code).json({...response, timings: stages.finish()} as SAMBLAPIResponse<T>);
}


export default class ServerAPIHandler {
    private route: string;
    private res: NextApiResponse;
    private stages: Stages;
    private parameters: string[];

    constructor(route: string, res: NextApiResponse, stages: Stages, parameters?: string[]) {
        this.route = route;
        this.res = res;
        this.stages = stages;
        this.parameters = parameters ?? [];
    }

    response<T extends SAMBLAPIData | never = never>(code: number, response: SAMBLAPIResponseWithoutTimings<T>) {
        return SAMBLResponse<T>(this.res, code, response, this.stages)
    }
}