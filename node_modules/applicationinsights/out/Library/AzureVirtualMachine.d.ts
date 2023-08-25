import Config = require("./Config");
export interface IVirtualMachineInfo {
    isVM?: boolean;
    id?: string;
    subscriptionId?: string;
    osType?: string;
}
export declare class AzureVirtualMachine {
    private static TAG;
    static getAzureComputeMetadata(config: Config, callback: (vm: IVirtualMachineInfo) => void): void;
}
