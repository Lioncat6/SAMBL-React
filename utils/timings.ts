import { APITimingData, APITimingStage } from "../types/api-types";

// export class Stage {
//     name: string;
//     stages: APITimingStage[];
//     start: number;
//     constructor(name: string, stages: APITimingStage[]) {
//         this.name = name;
//         this.stages = stages;
//         this.start = Date.now();
//     }

//     end() {
//         this.stages.push({ name: this.name, duration: Date.now() - this.start })
//     }
// }

// export class MainStage {
//     start: number;
//     constructor() {
//         this.start = Date.now();
//     }

//     end(): number {
//         return Date.now() - this.start;
//     }
// }

// function init(): [Stages, MainStage] {
//     return [new Stages(), new MainStage()]
// }

// const timings = {
//     getTimings,
//     init
// }

// export default timings;

interface PartialStage {
    name: string
    start: number
}

// Is this overcomplicated and probably already done by somebody else? Yes.
export class Stages {
    partialStages: PartialStage[]
    stages: APITimingStage[];
    startTime: number;
    constructor() {
        this.stages = []
        this.partialStages = []
        this.startTime = Date.now()
    }

    start(name: string) {
        this.partialStages.push({ name, start: Date.now() })
    }

    end(name: string) {
        const ps = this.partialStages.find((stage) => stage.name == name)
        if (!ps) throw new Error(`Unknown timing stage name '${name}'`)
        this.partialStages.filter((item) => item != ps);
        this.stages.push({
            name: name,
            duration: Date.now() - ps.start
        })
    }

    async await<T>(name: string, promise: Promise<T>): Promise<Awaited<T>> {
        this.start(name)
        const result = await promise;
        this.end(name);
        return result;
    }

    finish(): APITimingData {
        return { totalDuration: Date.now() - this.startTime, stages: this.stages };
    }
}