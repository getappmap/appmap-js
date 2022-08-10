import { MatchResult, Rule, RuleLogic } from '../types';
import parseRuleDescription from './lib/parseRuleDescription';
import { Event, EventNavigator, ParameterObject } from '@appland/models';

export enum Labels {
  SignatureVerify = 'jwt.signature.verify',
  JwtDecode = 'jwt.decode',
}

interface Jwt {
  header: string;
  payload: string;
  signature: string;
}

// Attempt to identify and return a JWT from an array of parameters
function findJwt(parameters?: Readonly<Array<ParameterObject>>): Jwt | undefined {
  if (!parameters) return;

  for (const param of parameters) {
    const tokens = param.value.split('.');
    if (tokens.length !== 3) return;
    const [header, payload, signature] = tokens;
    return { header, payload, signature };
  }
}

// Check if `obj` matches the JWT by value or by reference (receiverId)
function matchJwt(obj: ParameterObject, jwt?: Jwt, receiverId?: number): boolean {
  const byValue = jwt !== undefined && obj.value.startsWith(`${jwt.header}.${jwt.payload}`);
  const byReference = receiverId !== undefined && receiverId === obj.object_id;
  return byValue || byReference;
}

class JwtUnverifiedSignatureLogic implements RuleLogic {
  matcher(event: Event): MatchResult[] | undefined {
    if (event.labels.has(Labels.SignatureVerify)) {
      // This method is marked both as decode and signature verify. It is compliant.
      return;
    }

    let verified = false;
    let receiverId: number | undefined;
    const jwt = findJwt(event.parameters);
    const matches = new Array<MatchResult>();

    // Don't track the receiver if it's static. We'll find references of the decoded JWT passed by
    // function parameter instead.
    if (!event.isStatic) {
      receiverId = event.receiver?.object_id;
    }

    for (const { event: child } of new EventNavigator(event).following()) {
      if (!child.labels.has(Labels.SignatureVerify)) {
        continue;
      }

      const matchesReceiver = receiverId !== undefined && receiverId === child.receiver?.object_id;
      const matchesParameter = child.parameters?.find((param) => matchJwt(param, jwt, receiverId));
      if (matchesReceiver || matchesParameter) {
        verified = true;
        break;
      }
    }

    if (!verified) {
      matches.push({
        event,
        message: 'JWT signature is not validated',
      });
    }

    return matches;
  }

  where(event: Event): boolean {
    return event.labels.has('jwt.decode');
  }
}

class JwtUnverifiedSignature implements Rule {
  public readonly id = 'jwt-unverified-signature';
  public readonly title = 'Unverified signature';
  public readonly impactDomain = 'Security';
  public readonly enumerateScope = true;
  public readonly description = parseRuleDescription('jwtUnverifiedSignature');
  public readonly url =
    'https://appland.com/docs/analysis/rules-reference.html#jwt-unverified-signature';

  build(): RuleLogic {
    return new JwtUnverifiedSignatureLogic();
  }
}

export default new JwtUnverifiedSignature();
