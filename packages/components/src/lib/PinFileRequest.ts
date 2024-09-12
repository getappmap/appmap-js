export class PinFileRequest {
  name: string; // the name of the file being pinned
  uri?: string; // if available, a URI for the file
  content?: string; // if the URI isn't available, the content for the file

  constructor(arg: PinFileRequest) {
    this.name = arg.name;
    this.uri = arg.uri;
    this.content = arg.content;
  }
}
