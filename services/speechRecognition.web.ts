// Web stub for expo-speech-recognition (not supported on web)
// Uses Web Speech API where available, otherwise provides no-op fallbacks

type EventHandler = (event: any) => void;

const listeners: Record<string, EventHandler[]> = {};
let recognitionInstance: any = null;

const emit = (event: string, data: any) => {
  (listeners[event] || []).forEach((h) => {
    try { h(data); } catch {}
  });
};

const getRecognition = () => {
  if (typeof window === 'undefined') return null;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SR ? new SR() : null;
};

export const ExpoSpeechRecognitionModule = {
  requestPermissionsAsync: async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).mediaDevices?.getUserMedia) {
      try {
        const stream = await (navigator as any).mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t: any) => t.stop());
        return { granted: true, status: 'granted' };
      } catch {
        return { granted: false, status: 'denied' };
      }
    }
    return { granted: false, status: 'denied' };
  },
  getPermissionsAsync: async () => ({ granted: false, status: 'undetermined' }),
  start: (options: any = {}) => {
    try {
      if (recognitionInstance) {
        try { recognitionInstance.abort(); } catch {}
        recognitionInstance = null;
      }
      const rec = getRecognition();
      if (!rec) {
        setTimeout(() => emit('error', { error: 'not-allowed', message: 'Speech recognition unavailable' }), 0);
        return;
      }
      rec.lang = options.lang || 'en-US';
      rec.interimResults = options.interimResults !== false;
      rec.maxAlternatives = options.maxAlternatives || 1;
      rec.continuous = options.continuous || false;

      rec.onstart = () => emit('start', {});
      rec.onend = () => { recognitionInstance = null; emit('end', {}); };
      rec.onerror = (e: any) => emit('error', { error: e?.error || 'unknown', message: e?.message });
      rec.onresult = (e: any) => {
        const last = e.results[e.results.length - 1];
        if (!last) return;
        const transcript = last[0]?.transcript || '';
        emit('result', {
          isFinal: last.isFinal,
          results: [{ transcript, confidence: last[0]?.confidence || 0 }],
        });
      };

      recognitionInstance = rec;
      rec.start();
    } catch (err: any) {
      setTimeout(() => emit('error', { error: 'unknown', message: err?.message || 'Failed' }), 0);
    }
  },
  stop: () => {
    if (recognitionInstance) {
      try { recognitionInstance.stop(); } catch {}
      recognitionInstance = null;
    }
  },
  abort: () => {
    if (recognitionInstance) {
      try { recognitionInstance.abort(); } catch {}
      recognitionInstance = null;
    }
  },
};

export const useSpeechRecognitionEvent = (event: string, handler: EventHandler) => {
  if (typeof window === 'undefined') return;
  // Register handler (module-scope, cleaned up on next mount)
  if (!listeners[event]) listeners[event] = [];
  const arr = listeners[event];
  if (!arr.includes(handler)) arr.push(handler);
  // Return cleanup (React will call on unmount if used inside useEffect)
  return () => {
    const idx = arr.indexOf(handler);
    if (idx >= 0) arr.splice(idx, 1);
  };
};
