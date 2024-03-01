export const CHARACTERS_PER_TOKEN = 3;

export default interface Message {
  content: string;
  role: 'user' | 'system';
}
