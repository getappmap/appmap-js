import { MatchResult, Rule, RuleLogic } from '../types';
import parseRuleDescription from './lib/parseRuleDescription';
import { Event } from '@appland/models';
import { URL } from 'url';

export enum Labels {
  JwtEncode = 'jwt.encode',
}

type JwtHeader = {
  alg: string;
};

function getHeader(jwt: string): JwtHeader | undefined {
  try {
    const [header] = jwt.split('.');
    const decodedHeader = Buffer.from(header, 'base64').toString('utf-8');
    return JSON.parse(decodedHeader);
  } catch {
    // the JWT is malformed
    return undefined;
  }
}

class JwtAlgoritmNoneLogic implements RuleLogic {
  matcher(event: Event): MatchResult[] | undefined {
    if (!event.returnValue) return;

    const matches = new Array<MatchResult>();
    const { value: jwt } = event.returnValue;
    const header = getHeader(jwt);
    if (header?.alg === 'none') {
      matches.push({ event, message: 'Encoded JWT using the `none` algorithm' });
    }
    return matches;
  }

  where(event: Event): boolean {
    return event.labels.has(Labels.JwtEncode);
  }
}

class JwtAlgoritmNone implements Rule {
  public readonly id = 'jwt-algorithm-none';
  public readonly title = "JWT 'none' algorithm";
  public readonly impactDomain = 'Security';
  public readonly enumerateScope = true;
  public readonly description = parseRuleDescription('jwtAlgorithmNone');
  public readonly url = 'https://appland.com/docs/analysis/rules-reference.html#jwt-algorithm-none';
  public readonly labels = [Labels.JwtEncode];
  public readonly references = {
    'CWE-345': new URL('https://cwe.mitre.org/data/definitions/345.html'),
    'A02:2021': new URL('https://owasp.org/Top10/A02_2021-Cryptographic_Failures'),
    'RFC 7519': new URL('https://www.rfc-editor.org/rfc/rfc7519'),
  };

  build(): RuleLogic {
    return new JwtAlgoritmNoneLogic();
  }
}

export default new JwtAlgoritmNone();
