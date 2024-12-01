import { v4 as uuidv4 } from 'uuid';

export type SessionId = string;

export function generateSessionId(): SessionId {
  return uuidv4();
}
