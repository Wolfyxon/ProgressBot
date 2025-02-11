export function getTotalXpForLevel(level: number): number {
    return 10 * level ** 2;
}

export function getLevel(totalXp: number): number {
    let lvl = 1;

    while (getTotalXpForLevel(lvl + 1) <= totalXp) {
        lvl++;
    }

    return lvl;
}

export function getTotalXpForNextLevel(currentLevel: number): number {
    return getTotalXpForLevel(currentLevel + 1) - getTotalXpForLevel(currentLevel);
}