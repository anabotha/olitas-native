import useSWR from "swr";
import { getForecast } from "@/app/api/conditions/getForecast";
import type { SpotLocation } from "@/lib/types";

export function useForecast(spot: SpotLocation | null) {
    const latitude = spot?.latitude;
    const longitude = spot?.longitude;
    const swr = useSWR(
        latitude && longitude
            ? ["forecast", latitude, longitude]
            : null,
        () => getForecast(latitude!, longitude!),
        {
            refreshInterval: 1000 * 60 * 60 * 2, // cada 2 horas
            revalidateOnFocus: false,
        }
    );
    // Renombramos `data` a `forecastData` aquí mismo
    return {
        forecastData: swr.data,
        forecastError: swr.error,
        forecastIsLoading: swr.isLoading,
        mutate: swr.mutate, // si quieres poder revalidar manualmente
    };
}