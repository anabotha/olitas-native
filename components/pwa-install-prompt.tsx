"use client";

import { useState, useEffect, useCallback } from "react";

// ── Tipado del evento beforeinstallprompt ──
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // ── Detección de estado ──
    const isInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true;

    if (isInstalled) return; // Ya está instalada → no mostrar nada

    // ── iOS Safari → tip manual ──
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari =
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
      const dismissed = localStorage.getItem("pwa-ios-tip-dismissed");
      if (dismissed !== "1") {
        setShowIosTip(true);
      }
      return; // En iOS Safari no hay beforeinstallprompt
    }

    // ── Android / Chrome / Edge → botón nativo ──
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    const handleAppInstalled = () => {
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // ── Instalar PWA ──
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowButton(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // ── Cerrar tip iOS ──
  const handleDismissIosTip = useCallback(() => {
    setShowIosTip(false);
    localStorage.setItem("pwa-ios-tip-dismissed", "1");
  }, []);

  // ── No mostrar nada si no aplica ──
  if (!showButton && !showIosTip) return null;

  return (
    <>
      {/* Botón de instalación (Android / Chrome / Edge) */}
      {showButton && (
        <button
          id="pwa-install-btn"
          onClick={handleInstall}
          className="flex items-center gap-3 px-5 py-3 bg-primary text-primary-foreground
                     border-none rounded-xl cursor-pointer font-sans
                     shadow-[0_4px_14px_oklch(0.55_0.12_220_/_0.35)]
                     transition-all duration-150 ease-in-out w-fit
                     hover:-translate-y-0.5 hover:shadow-[0_6px_20px_oklch(0.55_0.12_220_/_0.45)]
                     active:translate-y-0"
        >
          <span className="text-2xl leading-none">⬇️</span>
          <span className="flex flex-col text-left leading-tight">
            <strong className="text-base font-bold">Instalar app</strong>
            <small className="text-xs opacity-85">
              Acceso rápido desde tu pantalla de inicio
            </small>
          </span>
        </button>
      )}

      {/* Tip manual para iOS Safari */}
      {showIosTip && (
        <div
          id="pwa-ios-tip"
          className="flex items-center gap-2.5 px-4 py-3
                     bg-amber-50 border border-amber-200 rounded-xl
                     text-sm text-amber-900 max-w-md relative"
        >
          <span className="text-xl shrink-0">📲</span>
          <span className="flex-1 leading-snug">
            Para instalar: tocá <strong>Compartir</strong> →{" "}
            <strong>Agregar a inicio</strong>
          </span>
          <button
            onClick={handleDismissIosTip}
            className="bg-transparent border-none cursor-pointer text-base text-muted-foreground
                       hover:text-foreground p-0 px-1 shrink-0"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
