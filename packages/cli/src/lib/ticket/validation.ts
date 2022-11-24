import isEmail from 'validator/lib/isEmail';
import isLength from 'validator/lib/isLength';
import trim from 'validator/lib/trim';

export function isValidName(name: string): boolean {
  // Ask for the name to have at least 2 characters, to keep the user from  just repeatedly hitting
  // 'n'.
  return isLength(trim(name), { min: 2 });
}

export function isValidEmail(email: string): boolean {
  return isEmail(email);
}
