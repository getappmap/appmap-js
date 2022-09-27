import { createHash } from 'crypto';

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
    const hash = createHash('sha256');
    this.hashEntries.forEach((row) => hash.update(row.join('=')));
    return hash.digest('hex');
  }

  static buildHash(algorithmName, properties) {
    const hash = new HashBuilder(algorithmName);

    Object.keys(properties)
      .sort()
      .forEach((key) => hash.addProperty(key, properties[key]));

    return hash;
  }
}
