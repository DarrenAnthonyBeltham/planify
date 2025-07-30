export type Theme = "Morning" | "Afternoon" | "Night" | "Dawn"

export function usedTimeBasedTheme() : Theme {
    const hour = new Date().getHours();

    if (hour >= 2 && hour < 6) {
        return "Dawn"
    } else if (hour >= 6 && hour < 15) {
        return "Morning"
    } else if (hour >= 15 && hour < 20) {
        return "Afternoon"
    } else {
        return "Night"
    }
}