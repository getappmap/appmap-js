import reportJson from './reportJson';
import { AppMapListItem, get } from '.';

export default class Mapset {
  constructor(public id: number) {}

  listAppMaps(): Promise<AppMapListItem[]> {
    const requestPath = 'api/appmaps';
    return get(requestPath).then((response) =>
      reportJson<AppMapListItem[]>(response)
    );
  }
}
