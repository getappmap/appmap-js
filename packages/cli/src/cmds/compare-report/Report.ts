import { ChangeReport } from '../compare/ChangeReport';

export default interface Report {
  generateReport(changeReport: ChangeReport, baseDir: string): Promise<string> | string;
}
