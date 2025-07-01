import { uniqueNamesGenerator, Config, adjectives, colors, animals } from 'unique-names-generator';

const config: Config = {
  dictionaries: [adjectives, colors, animals],
  separator: '-',
  length: 3,
};

export function generateRoomId(): string {
  return uniqueNamesGenerator(config).toLowerCase();
}

export function isValidRoomId(roomId: string): boolean {
  // Room IDs should be lowercase, contain only letters and hyphens
  // and be in the format: word-word-word
  const pattern = /^[a-z]+-[a-z]+-[a-z]+$/;
  return pattern.test(roomId);
} 