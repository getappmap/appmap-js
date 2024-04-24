// This file exists primarily to be imported statically by analyze.ts, so that 'yarn pkg'
// can traverse all the dependencies.
import { parentPort } from 'worker_threads';
if (parentPort) import('./analyzeWorker');
