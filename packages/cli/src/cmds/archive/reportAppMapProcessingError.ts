import FileTooLargeError from '../../fingerprint/fileTooLargeError';

export default function reportAppMapProcessingError(jobName: string): (error: any) => void {
  return (error: any) => {
    if (error instanceof FileTooLargeError) {
      process.stderr.write(
        `${jobName}: skipped large AppMap ${error.path} (${error.bytes / 1024}kb})\n`
      );
    } else {
      process.stderr.write(`${jobName}: ${error}\n`);
    }
  };
}
