/*
 * password-generator
 * Copyright(c) 2011-2015 Bermi Ferrer <bermi@bermilabs.com>
 * MIT Licensed
 * 
 * @modified by Michael Ebert
 */
import crypto from 'crypto';

const consonant = /[bcdfghjklmnpqrstvwxyz]$/i;
//const letter = /[a-z]$/i;
const vowel = /[aeiou]$/i;


export function generatePassword(length, memorable, pattern, prefix) {
  let char = '';
  let n;
  let i;
  const validChars = [];

  if (length === null || typeof(length) === 'undefined') {
    length = 10;
  }

  if (memorable === null || typeof(memorable) === 'undefined') {
    memorable = true;
  }

  if (pattern === null || typeof(pattern) === 'undefined') {
    pattern = /\w/;
  }

  if (prefix === null || typeof(prefix) === 'undefined') {
    prefix = '';
  }

  // Non memorable passwords will pick characters from a pre-generated
  // list of characters
  if (!memorable) {
    for (i = 33; i < 126; i += 1) {
      char = String.fromCharCode(i);
      if (char.match(pattern)) {
        validChars.push(char);
      }
    }

    if (!validChars.length) {
      throw new Error(`${'Could not find characters that match the ' +
          'password pattern '}${ pattern }. Patterns must match individual ` +
          `characters, not the password as a whole.`);
    }
  }


  while (prefix.length < length) {
    if (memorable) {
      if (prefix.match(consonant)) {
        pattern = vowel;
      } else {
        pattern = consonant;
      }
      n = rand(33, 126);
      char = String.fromCharCode(n);
    } else {
      char = validChars[rand(0, validChars.length)];
    }

    if (memorable) {
      char = char.toLowerCase();
    }
    if (char.match(pattern)) {
      prefix = `${ prefix }${char}`;
    }
  }
  return prefix;
}

function rand(min, max) {
  let key;
  let value;
  const arr = new Uint8Array(max);

  // Initialize array with random values
  const bytes = crypto.randomBytes(arr.length);
  arr.set(bytes);

  for (key in arr) {
    if (arr.hasOwnProperty(key)) {
      value = arr[key];
      if (value > min && value < max) {
        return value;
      }
    }
  }
  return rand(min, max);
}
