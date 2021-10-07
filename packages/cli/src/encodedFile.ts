import buffer, { TranscodeEncoding } from 'buffer';
import fs from 'fs';

export default class EncodedFile {
  private buf: Buffer;
  private encoding?: TranscodeEncoding;
  private bom0?: number;
  private bom1?: number;

  constructor(readonly path: fs.PathLike) {
    const {buf, bom0, bom1, encoding} = EncodedFile.read(path);
    this.buf = buf;
    this.bom0 = bom0;
    this.bom1 = bom1;
    this.encoding = encoding;
  }

  toString(): string {
    let ret;
    if (this.encoding) {
      // slice(1) to get rid of the BOM.
      ret = this.buf.toString(this.encoding).slice(1);
    } else {
      ret = this.buf.toString();
    }

    return ret;
  }

  // Encode the given string with our encoding and write it to path
  // @param {string} str the string to write
  // @param {PathLike} [path] the path to write the string to, defaults to this.path
  write(str: string, path?: fs.PathLike) {
    let buf = Buffer.from(str, this.encoding);

    if (this.bom0) {
      buf = Buffer.concat([Uint8Array.from([this.bom0, this.bom1!]), buf]);
    }

    fs.writeFileSync(path ? path : this.path, buf);
  }

  static read(path: fs.PathLike): {
    buf: Buffer,
    bom0: number | undefined,
    bom1: number | undefined,
    encoding: TranscodeEncoding | undefined
  } {
    const buf = fs.readFileSync(path);
    let bom0: number | undefined = buf.readUInt8(0);
    let bom1: number | undefined = buf.readUInt8(1);
    let encoding: TranscodeEncoding | undefined;
    if (bom0 === 0xff && bom1 === 0xfe) {
      encoding = 'utf16le';
    } else if (bom0 < 0x80) {
      // None of the files we care about can start with anything other than a
      // 7-bit ASCII character
      bom0 = bom1 = undefined;
    } else {
      throw new Error(
        `Unknown encoding for ${path}, ${bom0.toString(
          16
        )} ${bom1.toString(16)}`
      );
    }
    return {
      buf,
      bom0,
      bom1,
      encoding
    };
  }
}
