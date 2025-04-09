export function limitStr(str: string, charLimit: number): string {
    const suffix = "...";
    const trimmed = str.substring(0, charLimit - suffix.length);
    
    if(trimmed.length != str.length) {
        return trimmed.trimEnd() + suffix;
    }

    return str;
}

// TODO: Handle words longer than the lineLength
export function wordWrap(str: string, lineLength: number): string {
    let lines: string[] = [];
    let line = "";

    str.split(" ").forEach((word) => {
        if(line.length >= lineLength) {
            lines.push(line);
            line = "";
        }

        line += word + " ";
    });

    return lines.join("\n");
}

export function cleanStr(str: string): string {
    return str.replace(/\s+/g,' ').trim();
}
