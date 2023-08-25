export async function expectToFail(promise: Promise<any>): Promise<Error> {
    let result: any;
    try {
        result = await promise;
    } catch (error) {
        return error;
    }

    throw new Error(`Expected promise to fail but it resolved with "${result}"`);
}
