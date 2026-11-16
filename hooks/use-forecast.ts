import useSWR from "swr";
import { getForecast } from "@/lib/api/getForecast";
import { fetchWithOfflineCache } from "@/lib/offline-cache";
import type { SpotLocation } from "@/lib/types";

export function useForecast(spot: SpotLocation | null) {
    const latitude = spot?.latitude;
    const longitude = spot?.longitude;
    const swr = useSWR(
        latitude && longitude
            ? ["forecast", latitude, longitude]
            : null,
        // Sin señal usa el último pronóstico guardado para esta playa
        () => fetchWithOfflineCache("forecast", latitude!, longitude!, () => getForecast(latitude!, longitude!)),
        {
            refreshInterval: 1000 * 60 * 60 * 2, // cada 2 horas
            revalidateOnFocus: false,
        }
    );
    // Renombramos `data` a `forecastData` aquí mismo
    return {
        forecastData: swr.data?.data,
        forecastError: swr.error,
        forecastIsLoading: swr.isLoading,
        forecastOfflineSince: swr.data?.offlineSince ?? null,
        mutate: swr.mutate, // si quieres poder revalidar manualmente
    };
}
