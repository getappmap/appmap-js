import { ChangeReport } from '../compare/ChangeReport';

export default interface Reporter {
  generateReport(changeReport: ChangeReport, baseDir: string): Promise<string>;
}
