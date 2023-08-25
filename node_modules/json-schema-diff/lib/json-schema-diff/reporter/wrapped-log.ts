export class WrappedLog {
    public info(message: string) {
        console.log(message);
    }

    public error(error: Error | string): void {
        console.error(error);
    }
}
