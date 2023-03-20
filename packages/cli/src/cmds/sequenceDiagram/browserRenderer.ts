import assert from 'assert';
import { verbose } from '../../utils';

interface Page {
  screenshot(options: { path: string; fullPage: boolean }): unknown;
  waitForSelector(selector: string): unknown;
  on(event: string, handler: (msg: any) => void): unknown;
  close(): unknown;
  goto(path: string): unknown;
}

interface Browser {
  close(): unknown;
  newPage(): Promise<Page>;
}

export default class BrowserRenderer {
  private _browser?: Browser;

  constructor(public showBrowser = false) {
    this.showBrowser = showBrowser;
    this._browser = undefined;
  }

  async screenshot(url: string, outputPath: string) {
    await this.initialize();
    assert(this._browser);

    const page = await this._browser.newPage();
    if (verbose()) page.on('console', (msg) => console.log('CONSOLE: ', msg.text()));

    if (verbose()) console.warn(`Rendering ${url} to ${outputPath}`);

    await page.goto(url);
    await page.waitForSelector('.sequence-diagram');
    await page.screenshot({ path: outputPath, fullPage: true });
  }

  async close() {
    if (this._browser) {
      await this._browser.close();
      this._browser = undefined;
    }
  }

  private async initialize() {
    if (this._browser) return this._browser;

    const puppeteer = require('puppeteer');

    if (verbose()) console.warn(`Preparing browser for PNG rendering`);
    this._browser = await puppeteer.launch({ timeout: 120 * 1000, headless: !this.showBrowser });
  }
}
