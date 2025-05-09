import { InvocationStrategy } from '../../cmds/navie/invokeTests';

export const DEFAULT_INVOCATION_STRATEGY = InvocationStrategy.SHELL;

export default function getInvocationStrategy(): InvocationStrategy {
  const invocationStrategy = process.env.NAVIE_INVOCATION_STRATEGY;
  if (invocationStrategy === InvocationStrategy.SHELL) {
    return InvocationStrategy.SHELL;
  } else if (invocationStrategy === InvocationStrategy.RPC) {
    return InvocationStrategy.RPC;
  } else {
    return DEFAULT_INVOCATION_STRATEGY;
  }
}
