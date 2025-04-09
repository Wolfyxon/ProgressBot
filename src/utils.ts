export function limitStr(str: string, charLimit: number) {
    const suffix = "...";
    const trimmed = str.substring(0, charLimit - suffix.length);
    
    if(trimmed.length != str.length) {
        return trimmed.trimEnd() + suffix;
    }

    return str;
}
