let STREAM_URL = "https://server29.srvsh.com.br:7618/;";
export const setStreamUrl = (url: string) => {
  if (url && url !== STREAM_URL) {
    STREAM_URL = url;
    if (typeof window !== "undefined" && window.__top100Radio) {
      const radio = window.__top100Radio;
      if (radio.status === "playing" || radio.wantsToPlay) {
        radio.el.src = STREAM_URL;
        radio.el.play().catch(() => {});
      } else {
        radio.el.src = STREAM_URL;
      }
    }
  }
};
const INTENT_KEY = "top100_radio_intent"; // kept only to clear legacy localStorage on init

type PlaybackStatus = "idle" | "connecting" | "playing" | "paused" | "blocked" | "error";

type GlobalRadio = {
  el: HTMLAudioElement;
  listeners: Set<() => void>;
  retryTimer: number | null;
  connectTimer: number | null;
  status: PlaybackStatus;
  gestureUnlocked: boolean;
  wantsToPlay: boolean;
  isStarting: boolean;
};

declare global {
  interface Window {
    __top100Radio?: GlobalRadio;
  }
}

const isBrowser = typeof window !== "undefined";


function emit(radio: GlobalRadio) {
  radio.listeners.forEach((listener) => listener());
}

function clearRetry(radio: GlobalRadio) {
  if (radio.retryTimer) {
    window.clearTimeout(radio.retryTimer);
    radio.retryTimer = null;
  }
}

function clearConnectTimeout(radio: GlobalRadio) {
  if (radio.connectTimer) {
    window.clearTimeout(radio.connectTimer);
    radio.connectTimer = null;
  }
}

function setStatus(radio: GlobalRadio, next: PlaybackStatus) {
  radio.status = next;
  emit(radio);
}

function ensureSource(radio: GlobalRadio, forceReload = false) {
  if (forceReload) {
    try {
      radio.el.pause();
    } catch {
      /* ignore */
    }
    radio.el.removeAttribute("src");
    radio.el.load();
  }

  if (!radio.el.src) {
    radio.el.src = STREAM_URL;
  }
}

function scheduleRetry(radio: GlobalRadio, delay = 4000, forceReload = true) {
  if (!radio.wantsToPlay || radio.status === "blocked" || radio.retryTimer) return;
  radio.retryTimer = window.setTimeout(() => {
    radio.retryTimer = null;
    void startPlayback(radio, { forceReload });
  }, delay) as unknown as number;
}

function scheduleConnectTimeout(radio: GlobalRadio) {
  clearConnectTimeout(radio);
  radio.connectTimer = window.setTimeout(() => {
    radio.connectTimer = null;
    radio.isStarting = false;
    if (radio.wantsToPlay && radio.status !== "playing") {
      scheduleRetry(radio, 5000, true);
    }
  }, 15000) as unknown as number;
}

async function startPlayback(
  radio: GlobalRadio,
  options?: { forceReload?: boolean; fromGesture?: boolean },
) {
  const forceReload = options?.forceReload ?? false;
  const fromGesture = options?.fromGesture ?? false;

  if (!radio.wantsToPlay) return;
  if (fromGesture) radio.gestureUnlocked = true;
  if (radio.isStarting) return;

  radio.isStarting = true;
  clearRetry(radio);
  ensureSource(radio, forceReload);
  setStatus(radio, "connecting");

  try {
    const playPromise = radio.el.play();
    scheduleConnectTimeout(radio);
    await playPromise;
  } catch (error) {
    radio.isStarting = false;
    clearConnectTimeout(radio);

    const errorName = error instanceof DOMException ? error.name : "";
    if (errorName === "NotAllowedError") {
      setStatus(radio, "blocked");
      return;
    }

    if (errorName !== "AbortError") {
      setStatus(radio, "error");
    }

    scheduleRetry(radio, 4000, errorName !== "AbortError");
  }
}

function init(): GlobalRadio | null {
  if (!isBrowser) return null;
  if (window.__top100Radio) return window.__top100Radio;

  const early = (window as unknown as { __top100EarlyAudio?: HTMLAudioElement }).__top100EarlyAudio;
  const el = early ?? new Audio();
  el.preload = "auto";
  el.volume = 1;
  el.autoplay = true;
  // @ts-expect-error Safari/iOS compatibility
  el.playsInline = true;
  el.setAttribute("playsinline", "true");
  el.setAttribute("autoplay", "true");

  // Clear legacy localStorage intent so every page load starts fresh
  try { localStorage.removeItem(INTENT_KEY); } catch { /* ignore */ }

  const radio: GlobalRadio = {
    el,
    listeners: new Set(),
    retryTimer: null,
    connectTimer: null,
    status: "idle",
    gestureUnlocked: false,
    wantsToPlay: true,
    isStarting: false,
  };

  // Detect current state from existing element (script inline may have already started playback)
  const alreadyPlaying = !el.paused && !el.ended && el.readyState >= 2;
  if (alreadyPlaying) {
    radio.status = "playing";
  } else if (el.src && !el.paused) {
    radio.status = "connecting";
  }

  window.__top100Radio = radio;

  el.addEventListener("loadstart", () => {
    if (radio.wantsToPlay) setStatus(radio, "connecting");
  });

  el.addEventListener("waiting", () => {
    if (radio.wantsToPlay) setStatus(radio, "connecting");
  });

  el.addEventListener("playing", () => {
    radio.isStarting = false;
    clearRetry(radio);
    clearConnectTimeout(radio);
    if (el.muted && radio.gestureUnlocked) el.muted = false;
    setStatus(radio, "playing");
  });

  el.addEventListener("pause", () => {
    radio.isStarting = false;
    clearConnectTimeout(radio);
    if (!radio.wantsToPlay) {
      clearRetry(radio);
      setStatus(radio, "paused");
      return;
    }
    setStatus(radio, "connecting");
    scheduleRetry(radio, 3000, false);
  });

  el.addEventListener("error", () => {
    radio.isStarting = false;
    clearConnectTimeout(radio);
    setStatus(radio, "error");
    scheduleRetry(radio, 5000, true);
  });

  el.addEventListener("stalled", () => {
    if (!radio.wantsToPlay) return;
    radio.isStarting = false;
    clearConnectTimeout(radio);
    setStatus(radio, "connecting");
    scheduleRetry(radio, 6000, true);
  });

  el.addEventListener("ended", () => {
    if (!radio.wantsToPlay) return;
    radio.isStarting = false;
    clearConnectTimeout(radio);
    setStatus(radio, "connecting");
    scheduleRetry(radio, 1000, true);
  });

  const recover = () => {
    if (!radio.wantsToPlay || radio.status === "playing") return;
    if (document.visibilityState === "hidden") return;
    void startPlayback(radio, { forceReload: false });
  };

  document.addEventListener("visibilitychange", recover);
  window.addEventListener("focus", recover);
  window.addEventListener("online", recover);
  window.addEventListener("pageshow", recover);

  // Muted autoplay já foi tentado pelo script inline em __root.tsx via __top100EarlyAudio.
  // Aqui apenas garantimos play() se o áudio inicial não existir (ex: navegação client-side).
  if (!early && radio.wantsToPlay) {
    setTimeout(() => {
      if (radio.status === "playing") return;
      ensureSource(radio, false);
      el.muted = true;
      const p = el.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          el.muted = false;
          setStatus(radio, "blocked");
        });
      }
    }, 0);
  }

  let unlocked = false;
  const unlockFromGesture = () => {
    if (unlocked) return;
    unlocked = true;
    radio.gestureUnlocked = true;
    el.muted = false;
    if (radio.wantsToPlay && radio.status !== "playing") {
      ensureSource(radio, false);
      const playPromise = radio.el.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((error: unknown) => {
          const errorName = error instanceof DOMException ? error.name : "";
          if (errorName === "NotAllowedError") {
            setStatus(radio, "blocked");
            return;
          }
          scheduleRetry(radio, 4000, false);
        });
      }
    }
  };

  // Single unlock, captura cedo, sem repetição
  ["pointerdown", "touchstart", "keydown", "click"].forEach((eventName) => {
    window.addEventListener(eventName, unlockFromGesture, { passive: true, once: true, capture: true });
  });

  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "TOP100 FM",
        artist: "Ao Vivo",
        album: "Rádio TOP100 FM",
      });
      navigator.mediaSession.setActionHandler("play", () => {
        radio.gestureUnlocked = true;
        radio.wantsToPlay = true;
        void startPlayback(radio, { forceReload: false, fromGesture: true });
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        radio.wantsToPlay = false;
        clearRetry(radio);
        clearConnectTimeout(radio);
        radio.el.pause();
      });
      navigator.mediaSession.setActionHandler("stop", () => {
        radio.wantsToPlay = false;
        clearRetry(radio);
        clearConnectTimeout(radio);
        radio.el.pause();
      });
    } catch {
      /* ignore */
    }
  }

  return radio;
}

export const radioAudio = {
  play: async () => {
    const radio = init();
    if (!radio) return;
    radio.wantsToPlay = true;
    radio.gestureUnlocked = true;

    // Se o stream já está pré-carregado e tocando mudo, apenas desmuta no gesto.
    if (!radio.el.paused && radio.el.muted) {
      radio.el.muted = false;
      radio.el.volume = radio.el.volume || 1;
      setStatus(radio, "playing");
      return;
    }

    await startPlayback(radio, { forceReload: false, fromGesture: true });
  },
  pause: () => {
    const radio = init();
    if (!radio) return;
    radio.wantsToPlay = false;
    clearRetry(radio);
    clearConnectTimeout(radio);
    radio.el.pause();
    setStatus(radio, "paused");
  },
  toggle: async () => {
    const radio = init();
    if (!radio) return;
    if (radio.status === "playing" || radio.wantsToPlay) {
      radioAudio.pause();
      return;
    }
    await radioAudio.play();
  },
  setVolume: (value: number) => {
    const radio = init();
    if (!radio) return;
    radio.el.volume = value;
    emit(radio);
  },
  getState: () => {
    const radio = init();
    if (!radio) {
      return {
        isPlaying: false,
        volume: 1,
        isBuffering: false,
        needsGesture: false,
      };
    }

    return {
      isPlaying: radio.status === "playing",
      volume: radio.el.volume,
      isBuffering: radio.status === "connecting",
      needsGesture: radio.status === "blocked" && !radio.gestureUnlocked,
    };
  },
  subscribe: (fn: () => void) => {
    const radio = init();
    if (!radio) return () => {};
    radio.listeners.add(fn);
    return () => {
      radio.listeners.delete(fn);
    };
  },
  autoStart: async () => {
    const radio = init();
    if (!radio) return;
    radio.wantsToPlay = true;
    if (radio.status === "playing") return; // already running
    ensureSource(radio, false);
    await startPlayback(radio, { forceReload: false });
  },
  setStreamUrl,
};
