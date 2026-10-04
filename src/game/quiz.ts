// Musikquiz: sangene i playlisten følger brættet – kategori for kategori, oppefra og ned.

/** Sangens nummer (1-baseret) i playlisten for felt (cat, row), givet antal felter pr. kategori. */
export function songNumber(answerCounts: number[], cat: number, row: number): number {
  return answerCounts.slice(0, cat).reduce((a, b) => a + b, 0) + row + 1;
}

export const cellKey = (cat: number, row: number) => `${cat}-${row}`;
