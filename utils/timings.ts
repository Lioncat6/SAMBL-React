import { APITimingData, APITimingStage } from "../types/api-types";
import { ProviderNamespace } from "../types/provider-types";

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
    provider?: ProviderNamespace
    uuid: string
}

class SingleStage {
    name: string
    uuid: string
    stagesEnd: (identifier: string) => void
    constructor(name: string, uuid: string, end: (name: string) => void) {
        this.name = name;
        this.uuid = uuid;
        this.stagesEnd = end;
    }
    /**
     * Safely end the stage; Uses a UUID instead of a name identifier to support identical stage names
     */
    end() {
        this.stagesEnd(this.uuid);
    }
    //TODO: startSubstage
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

    start(name: string, provider?: ProviderNamespace) {
        const uuid = crypto.randomUUID()
        this.partialStages.push({ name, start: Date.now(), provider, uuid})
        return new SingleStage(name, uuid, this.end.bind(this));
    }

    end(identifier: string) {
        const ps = this.partialStages.find((stage) => stage.uuid == identifier || stage.name == identifier)
        if (!ps) throw new Error(`Unknown timing stage identifier '${identifier}'`)
        this.partialStages.filter((item) => item != ps);
        this.stages.push({
            name: ps.name,
            duration: Date.now() - ps.start,
            provider: ps.provider
        })
    }

    async await<T>(name: string, promise: Promise<T>, provider?: ProviderNamespace): Promise<Awaited<T>> {
        const stage = this.start(name, provider)
        const result = await promise;
        stage.end();
        return result;
    }

    finish(): APITimingData {
        return { totalDuration: Date.now() - this.startTime, stages: this.stages };
    }
}