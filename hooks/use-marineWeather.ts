import useSWR from "swr";
import { getMarineWeather } from "@/lib/api/getMarineWeather";
import { fetchWithOfflineCache } from "@/lib/offline-cache";
import type { SpotLocation } from "@/lib/types";

export function useMarineWeather(spot: SpotLocation | null) {
    const latitude = spot?.latitude;
    const longitude = spot?.longitude;
    const swr = useSWR(
        latitude && longitude
            ? ["marine-weather", latitude, longitude]
            : null,
        // Sin señal usa el último pronóstico guardado para esta playa
        () => fetchWithOfflineCache("marine", latitude!, longitude!, () => getMarineWeather(latitude!, longitude!)),
        {
            refreshInterval: 1000 * 60 * 60 * 2, // cada 2 horas busca info
            revalidateOnFocus: false,
        }
    );
    return {
        data: swr.data?.data,
        error: swr.error,
        isLoading: swr.isLoading,
        /** Hora del pronóstico guardado que se está mostrando por falta de conexión (o null) */
        offlineSince: swr.data?.offlineSince ?? null,
        mutate: swr.mutate,
    };
}
