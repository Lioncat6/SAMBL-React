import unicode from 'unicode-properties'
import eld from 'eld/large';
import { iso15924 } from 'iso-15924';
import iso6391 from 'iso-639-1'

export type ReleaseLanguage = {
    code: string;
    name?: string;
    confidence?: number;
};

export type ReleaseScript = {
	code: string;
    name?: string
	frequency: number;
};

function getScriptCode(name: string) {
    return iso15924.find((script) => script.pva == name || script.name == name)?.code
}

function detectScript(input: string): ReleaseScript | null {
    if (input.length == 0) return null;
    let frequencies: Map<string, number> = new Map();
    for (const char of input) {
        const script = unicode.getScript(char.charCodeAt(0));
        frequencies.set(script, (frequencies.get(script) ?? 0)+1);
    }
    let mostFrequent = unicode.getScript(input.charCodeAt(0));
    for (const [script, frequency] of frequencies){
        if (frequency > frequencies.get(script)!) {
            mostFrequent = script;
        }
    }
    const code = getScriptCode(mostFrequent);
    if (!code) return null;
    return {
        code,
        name: mostFrequent,
        frequency: frequencies.get(mostFrequent)!
    }
}

function detectLanguage(input: string): ReleaseLanguage | null{
    const threshold = 0.65;
    let result = eld.detect(input);
    console.log(result.getScores())
    if (result.language.length == 0) return null;
    if (result.getScores()[result.language] < threshold) return null;
    return {
        code: result.language,
        name: iso6391.getName(result.language),
        confidence: result.getScores()[result.language]
    }
}

const scriptAndLanguage = {
    detectLanguage,
    detectScript
}

export default scriptAndLanguage;