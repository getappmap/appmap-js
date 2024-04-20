import { boolean } from 'yargs';
import quotePath from '../../../src/lib/quotePath';

describe(quotePath, () => {
  test.each<[[path: string, force?: boolean], string]>([
    [['/tmp/appmap/map1.json'], '/tmp/appmap/map1.json'],
    [['/tmp/appmap/map1.json', true], '"/tmp/appmap/map1.json"'],
    [['/tmp/app\nmap.json'], '"/tmp/app\\nmap.json"'],
    [['/tmp/appmap.json\n'], '"/tmp/appmap.json\\n"'],
    [['/tmp/app\0map.json'], '"/tmp/app\\0map.json"'],
    [['/tmp/app"map.json'], '"/tmp/app\\"map.json"'],
    [['/tmp/app\\map.json'], '/tmp/app\\map.json'],
    [['/tmp/app\\map.json', true], '"/tmp/app\\\\map.json"'],
    [['/tmp/ap"p\nmap\0/ma\\p1.json'], '"/tmp/ap\\"p\\nmap\\0/ma\\\\p1.json"'],
    [['/tmp/ap"p\nmap\0/ma\\p1.json', true], '"/tmp/ap\\"p\\nmap\\0/ma\\\\p1.json"'],
  ])('with %o', (args, expected) => expect(quotePath(...args)).toEqual(expected));
});
