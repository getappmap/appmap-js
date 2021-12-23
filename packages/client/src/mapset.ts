import reportJson from './reportJson';
import { App, AppMapListItem, get } from '.';

export default class Mapset {
  constructor(public app: App, public id: number) {}

  listAppMaps(): Promise<AppMapListItem[]> {
    const requestPath = `api/mapsets?app=${this.app.fqname}&mapset=${this.id}`;
    return get(requestPath).then((response) =>
      reportJson<AppMapListItem[]>(response)
    );
  }
}
