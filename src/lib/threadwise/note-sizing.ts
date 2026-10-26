export const NOTE_DEFAULT_HEIGHT = 260;
export const NOTE_MIN_HEIGHT = 180;
export const NOTE_MAX_HEIGHT = 1200;
export function resizedNoteHeight(startHeight: number, screenDelta: number, zoom: number) {
  return Math.round(Math.min(NOTE_MAX_HEIGHT,Math.max(NOTE_MIN_HEIGHT,startHeight+screenDelta/Math.max(0.1,zoom))));
}