// import { DEFAULT_SPOTS } from "@/lib/spots";
// import { useMemo } from "react";
import useSWR from "swr";
import { getMarineWeather } from "@/app/api/conditions/getMarineWeather";
import type { SpotLocation } from "@/lib/types";

// const params: any = useMemo(() => ({
//     ...DEFAULT_SPOTS[0]
// }), [])

export function useMarineWeather({ latitude, longitude }: SpotLocation) {
    return useSWR(
        latitude && longitude
            ? ["marine-weather", latitude, longitude]
            : null,
        () => getMarineWeather(latitude, longitude),
        {
            refreshInterval: 1000 * 60 * 60 * 12, // cada 12 horas busca info
            revalidateOnFocus: false,
        }
    )
}