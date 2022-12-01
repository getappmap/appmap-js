import sha256 from 'crypto-js/sha256.js';

export default class HashBuilder {
  constructor(algorithmVersion) {
    this.hashEntries = [['algorithmVersion', algorithmVersion]];
  }

  addProperty(key, value) {
    this.hashEntries.push([key, value]);
  }

  get canonicalString() {
    return this.hashEntries.map((row) => row.join('=')).join('\n');
  }

  digest() {
    return sha256(this.hashEntries.map((r) => r.join('=')).join('')).toString();
  }

  static buildHash(algorithmName, properties) {
    const hash = new HashBuilder(algorithmName);

    Object.keys(properties)
      .sort()
      .forEach((key) => hash.addProperty(key, properties[key]));

    return hash;
  }
}
