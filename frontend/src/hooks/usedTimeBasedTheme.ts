export type Theme = "morning" | "afternoon" | "night" | "dawn"

export function usedTimeBasedTheme() : Theme {
    const hour = new Date().getHours();

    if (hour >= 2 && hour < 6) {
        return "dawn"
    } else if (hour >= 6 && hour < 15) {
        return "morning"
    } else if (hour >= 15 && hour < 20) {
        return "afternoon"
    } else {
        return "night"
    }
}