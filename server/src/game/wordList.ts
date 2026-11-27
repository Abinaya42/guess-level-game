const WORDS = [
  // Fruits
  'APPLE', 'BANANA', 'MANGO', 'ORANGE', 'GRAPES', 'PINEAPPLE', 'WATERMELON', 'STRAWBERRY', 'PAPAYA', 'CHERRY',
  // Vehicles (Bus, Van, etc.)
  'BUS', 'VAN', 'CAR', 'TRUCK', 'AIRPLANE', 'BICYCLE', 'TRAIN', 'ROCKET', 'BOAT', 'HELICOPTER',
  // Buildings (House, etc.)
  'HOUSE', 'SCHOOL', 'HOSPITAL', 'GARDEN', 'MARKET', 'CASTLE', 'BRIDGE',
  // Animals
  'TIGER', 'LION', 'ELEPHANT', 'MONKEY', 'DOG', 'CAT', 'FISH', 'BIRD',
  // Tech & Sports
  'COMPUTER', 'KEYBOARD', 'MOBILE', 'LAPTOP',
  'CRICKET', 'FOOTBALL', 'TENNIS', 'HOCKEY',
  // Nature & Music
  'RAINBOW', 'MOUNTAIN', 'RIVER', 'OCEAN', 'SUN', 'TREE', 'FLOWER',
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
  return text.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
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