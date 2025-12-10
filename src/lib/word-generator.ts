export const adjectives = [
  'Happy', 'Lucky', 'Sunny', 'Cosmic', 'Magic', 'Super', 'Mega', 'Hyper', 'Ultra', 'Power',
  'Red', 'Blue', 'Green', 'Gold', 'Silver', 'Neon', 'Cyber', 'Turbo', 'Rapid', 'Swift',
  'Brave', 'Calm', 'Cool', 'Wild', 'Wise', 'Epic', 'Rare', 'Bold', 'Bright', 'Sharp'
];

export const nouns = [
  'Tiger', 'Dragon', 'Eagle', 'Lion', 'Wolf', 'Bear', 'Hawk', 'Fox', 'Panda', 'Koala',
  'Star', 'Moon', 'Sun', 'Comet', 'Planet', 'Rocket', 'Ship', 'Jet', 'Bike', 'Car',
  'Ninja', 'Wizard', 'Knight', 'King', 'Queen', 'Ace', 'Hero', 'Legend', 'Ghost', 'Spirit'
];

export function generateRoomId(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000); // 0-999
  return `${adj}-${noun}-${num}`;
}
