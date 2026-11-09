// Eventos propios para Umami (https://umami.is).
// El script de Umami se carga en app/layout.tsx. Si todavía no cargó, los eventos
// se encolan y se mandan cuando esté listo. Si nunca carga (adblock, dev local),
// se descartan sin romper nada.

type EventData = Record<string, string | number | boolean>;

type Umami = {
  track: (event: string, data?: EventData) => void;
};

declare global {
  interface Window {
    umami?: Umami;
  }
}

const queue: Array<[string, EventData | undefined]> = [];
let polling = false;
const MAX_WAIT_MS = 15000;
const POLL_MS = 500;

function flush() {
  const umami = window.umami;
  if (!umami) return false;
  while (queue.length) {
    const [event, data] = queue.shift()!;
    try {
      umami.track(event, data);
    } catch {}
  }
  return true;
}

function startPolling() {
  if (polling) return;
  polling = true;
  const started = Date.now();
  const id = window.setInterval(() => {
    if (flush() || Date.now() - started > MAX_WAIT_MS) {
      window.clearInterval(id);
      queue.length = 0;
      polling = false;
    }
  }, POLL_MS);
}

export function track(event: string, data?: EventData) {
  if (typeof window === "undefined") return;
  queue.push([event, data]);
  if (!flush()) startPolling();
}
