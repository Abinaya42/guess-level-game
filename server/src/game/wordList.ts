const WORDS = [
  'APPLE', 'BANANA', 'MANGO', 'ORANGE',
  'TIGER', 'LION', 'ELEPHANT', 'MONKEY',
  'COMPUTER', 'KEYBOARD', 'MOBILE', 'LAPTOP',
  'CRICKET', 'FOOTBALL', 'TENNIS', 'HOCKEY',
  'SCHOOL', 'HOSPITAL', 'GARDEN', 'MARKET',
  'RAINBOW', 'MOUNTAIN', 'RIVER', 'OCEAN',
  'AIRPLANE', 'BICYCLE', 'TRAIN', 'ROCKET',
  'GUITAR', 'PIANO', 'CAMERA', 'TELEVISION'
];

export function getRandomWords(count: number): string[] {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function normalizeGuess(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, '');
}

export function maskWord(word: string, revealedIndices: number[]): string {
  return word
    .split('')
    .map((char, index) => {
      if (char === ' ' || revealedIndices.includes(index)) {
        return char;
      }
      return '_';
    })
    .join('');
}

export function getRevealIndices(
  word: string,
  count: number,
  alreadyRevealed: number[]
): number[] {
  const available = word
    .split('')
    .map((char, index) => index)
    .filter(index =>
      word[index] !== ' ' && !alreadyRevealed.includes(index)
    );

  const selected = available
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  return [...alreadyRevealed, ...selected];
}