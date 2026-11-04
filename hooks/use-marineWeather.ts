// import { DEFAULT_SPOTS } from "@/lib/spots";
// import { useMemo } from "react";
import useSWR from "swr";
import { getMarineWeather } from "@/lib/api/getMarineWeather";
import type { SpotLocation } from "@/lib/types";

// const params: any = useMemo(() => ({
//     ...DEFAULT_SPOTS[0]
// }), [])

export function useMarineWeather(spot: SpotLocation | null) {
    const latitude = spot?.latitude;
    const longitude = spot?.longitude;
    return useSWR(
        latitude && longitude
            ? ["marine-weather", latitude, longitude]
            : null,
        () => getMarineWeather(latitude!, longitude!),
        {
            refreshInterval: 1000 * 60 * 60 * 2, // cada 2 horas busca info
            revalidateOnFocus: false,
        }
    )
}