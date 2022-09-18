import cliProgress from 'cli-progress';
import yargs from 'yargs';
import readline from 'readline';

import Context from './context';
import undoFilter from './undoFilter';
import filter from './filter';
import reset from './reset';
import print from './print';
import home from './home';
import assert from 'assert';
import navigate from './navigate';

export default class UI {
  context: Context;
  rl?: readline.Interface;

  constructor(public appmapDir: string, public codeObjectId: string) {
    this.context = new Context(appmapDir, codeObjectId);
  }

  async start() {
    await this.search();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.rl.on('close', function () {
      yargs.exit(0, new Error());
    });

    this.home();
  }

  getCommand() {
    assert(this.rl, 'readline is not initialized');
    console.log();
    this.rl.question(
      'Command (h)ome, (p)rint, (f)ilter, (u)ndo filter, (r)eset filters, (n)avigate, (q)uit: ',
      (command) => {
        // eslint-disable-next-line default-case
        switch (command) {
          case 'h':
            this.home();
            break;
          case 'p':
            this.print();
            break;
          case 'f':
            this.filter();
            break;
          case 'u':
            this.undoFilter();
            break;
          case 'n':
            this.navigate();
            break;
          case 's':
            this.save();
            break;
          case 'r':
            this.reset();
            break;
          case 'q':
            assert(this.rl, 'readline is not initialized');
            this.rl.close();
            break;
          default:
            this.getCommand();
        }
      }
    );
  }

  home() {
    assert(this.context.stats);
    home(this.context, this.getCommand.bind(this));
  }

  filter() {
    filter(this.rl, this.context, this.home.bind(this));
  }

  async undoFilter() {
    await undoFilter(this.context, this.home.bind(this));
  }

  async reset() {
    await reset(this.context, this.home.bind(this));
  }

  print() {
    assert(this.context.stats);
    print(this.context.stats, this.rl, this.getCommand.bind(this), this.home.bind(this));
  }

  save() {
    this.context.save();
    console.log(`Saved code object id ${this.context.codeObjectId}`);
    this.home();
  }

  async navigate() {
    assert(this.rl);
    return navigate(this.rl, this.context, this.search.bind(this), this.home.bind(this));
  }

  async search() {
    const performSearch = async () => {
      console.warn('Finding matching AppMaps');
      let progress = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
      this.context.addListener('start', (count) => progress.start(count, 0));
      this.context.addListener('increment', progress.increment.bind(progress));
      this.context.addListener('collate', () => console.warn('Collating results...'));
      this.context.addListener('stop', (count) => progress.stop());

      await this.context.findCodeObjects();

      if (!this.context.codeObjectMatches) {
        console.warn(`Code object '${this.context.codeObjectId}' not found`);
        return this.navigate();
      }

      console.warn('Finding matching Events');

      await this.context.buildStats();
    };

    try {
      await performSearch();
    } finally {
      this.context.removeAllListeners();
    }
  }
}
