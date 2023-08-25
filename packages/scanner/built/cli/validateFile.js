"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const errors_1 = require("../errors");
function default_1(kind, path) {
    return __awaiter(this, void 0, void 0, function* () {
        if (path === '.')
            return;
        try {
            yield (0, promises_1.access)(path, fs_1.constants.R_OK);
        }
        catch (_a) {
            throw new errors_1.ValidationError(`AppMap ${kind} ${chalk_1.default.red(path)} does not exist, or is not readable.`);
        }
    });
}
exports.default = default_1;
