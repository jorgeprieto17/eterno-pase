/**
 * ============================================================================
 * ETERNO PASE — SINTETIZADOR DE AUDIO HTML5 PARA DEMOS EN VIVO
 * ============================================================================
 * Genera un archivo WAV polifónico en memoria (Blob URL) y lo conecta al
 * elemento <audio id="ep-audio-player" loop> nativo de HTML5 cuando el demo
 * no utiliza un enlace MP3 externo. Garantiza reproducción fluida sin errores
 * de CORS ni enlaces externos caídos.
 * ============================================================================
 */

(function (global) {
  'use strict';

  const EternoPase = (global.EternoPase = global.EternoPase || {});
  const blobCache = {};

  const NOTE_FREQS = {
    C4: 261.63,
    D4: 293.66,
    Eb4: 311.13,
    E4: 329.63,
    F4: 349.23,
    Fs4: 369.99,
    G4: 392.0,
    A4: 440.0,
    Bb4: 466.16,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    Eb5: 622.25,
    E5: 659.25,
    F5: 698.46,
    Fs5: 739.99,
    G5: 783.99,
    A5: 880.0,
    Bb5: 932.33,
    C6: 1046.5,
    G3: 196.0,
    A3: 220.0,
    B3: 246.94,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    C3: 130.81
  };

  /**
   * Secuencias melódicas de 16 pasos (loop perfecto de ~12-16s) por temática
   */
  const COMPOSITIONS = {
    boda: {
      stepDuration: 0.75,
      harmony: 'warm',
      notes: [
        ['G3', 'B4', 'D5'],
        ['D4', 'G5'],
        ['B3', 'Fs5'],
        ['D4', 'D5'],
        ['E3', 'G4', 'B4'],
        ['B3', 'E5'],
        ['G4', 'D5'],
        ['B4', 'B4'],
        ['C3', 'E4', 'G4'],
        ['G3', 'C5'],
        ['E4', 'E5'],
        ['G4', 'D5'],
        ['D3', 'Fs4', 'A4'],
        ['A3', 'D5'],
        ['Fs4', 'A4'],
        ['D4', 'G4']
      ]
    },
    xv: {
      stepDuration: 0.65,
      harmony: 'glam',
      notes: [
        ['D3', 'A4', 'F5'],
        ['A3', 'D5'],
        ['F4', 'A5'],
        ['A4', 'G5'],
        ['Bb4', 'D5', 'F5'],
        ['F4', 'Bb5'],
        ['D5', 'A5'],
        ['F5', 'G5'],
        ['C4', 'G4', 'E5'],
        ['G4', 'C5'],
        ['E5', 'G5'],
        ['C5', 'E5'],
        ['A3', 'E4', 'D5'],
        ['E4', 'C5'],
        ['A4', 'E5'],
        ['E4', 'A4']
      ]
    },
    cumpleanos: {
      stepDuration: 0.5,
      harmony: 'musicbox',
      notes: [
        ['C4', 'C5', 'E5'],
        ['G4', 'G5'],
        ['E4', 'E5'],
        ['G4', 'C5'],
        ['F4', 'A5'],
        ['C5', 'F5'],
        ['A4', 'E5'],
        ['C5', 'D5'],
        ['G4', 'E5'],
        ['D5', 'C5'],
        ['B4', 'D5'],
        ['G4', 'G5'],
        ['C4', 'E5', 'G5'],
        ['G4', 'C6'],
        ['E5', 'G5'],
        ['C5', 'E5']
      ]
    }
  };

  function encodeWavHeader(sampleRate, numSamples) {
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    function writeString(offset, str) {
      for (let i = 0; i < str.length; i += 1) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM
    view.setUint16(20, 1, true); // Linear PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    return { buffer, view };
  }

  function buildTrackUrl(presetName) {
    const key = COMPOSITIONS[presetName] ? presetName : 'boda';
    if (blobCache[key]) {
      return blobCache[key];
    }

    const comp = COMPOSITIONS[key];
    const sampleRate = 22050;
    const totalSeconds = comp.notes.length * comp.stepDuration;
    const totalSamples = Math.floor(sampleRate * totalSeconds);
    const { buffer, view } = encodeWavHeader(sampleRate, totalSamples);
    const mix = new Float32Array(totalSamples);

    comp.notes.forEach((chord, idx) => {
      const startSample = Math.floor(idx * comp.stepDuration * sampleRate);
      const decayLength = Math.floor(comp.stepDuration * 1.65 * sampleRate);

      chord.forEach((noteName, voiceIndex) => {
        const freq = NOTE_FREQS[noteName];
        if (!freq) return;

        const attackSamples = Math.floor(0.025 * sampleRate);
        const voiceGain = voiceIndex === 0 ? 0.22 : 0.16;

        for (let s = 0; s < decayLength; s += 1) {
          const targetIdx = (startSample + s) % totalSamples;
          const t = s / sampleRate;
          const attack = s < attackSamples ? s / attackSamples : 1;
          const decay = Math.exp(-3.2 * (s / decayLength));

          let wave = Math.sin(2 * Math.PI * freq * t);
          if (comp.harmony === 'warm') {
            wave += 0.28 * Math.sin(2 * Math.PI * (freq * 2) * t) * Math.exp(-5 * t);
          } else if (comp.harmony === 'glam') {
            wave += 0.35 * Math.sin(2 * Math.PI * (freq * 2) * t) * Math.exp(-4 * t);
            wave += 0.12 * Math.sin(2 * Math.PI * (freq * 3) * t) * Math.exp(-6 * t);
          } else {
            // Celesta / Music Box timbre
            wave += 0.42 * Math.sin(2 * Math.PI * (freq * 2) * t) * Math.exp(-7 * t);
          }

          mix[targetIdx] += wave * attack * decay * voiceGain;
        }
      });
    });

    // Normalizar suave para evitar clipping y asegurar cruce suave en el loop
    let peak = 0.01;
    for (let i = 0; i < totalSamples; i += 1) {
      const abs = Math.abs(mix[i]);
      if (abs > peak) peak = abs;
    }

    const scale = peak > 0.82 ? 0.82 / peak : 1;
    const fadeSamples = Math.floor(0.04 * sampleRate);

    for (let i = 0; i < totalSamples; i += 1) {
      let sample = mix[i] * scale;
      if (i < fadeSamples) {
        sample *= i / fadeSamples;
      } else if (i > totalSamples - fadeSamples) {
        sample *= (totalSamples - i) / fadeSamples;
      }
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, Math.floor(clamped * 32767), true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    blobCache[key] = url;
    return url;
  }

  EternoPase.AudioSynth = {
    getTrackUrl: buildTrackUrl
  };
})(window);
