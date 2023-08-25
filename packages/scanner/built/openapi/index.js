"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.breakingChanges = void 0;
const fs_1 = require("fs");
const openapi_diff_1 = __importDefault(require("openapi-diff"));
const util_1 = require("../rules/lib/util");
__exportStar(require("@appland/openapi"), exports);
const breakingChanges = (schemaHead, schemaBase) => __awaiter(void 0, void 0, void 0, function* () {
    if ((0, util_1.verbose)()) {
        (0, fs_1.writeFileSync)('openapi_head.json', JSON.stringify(schemaHead, null, 2));
        (0, fs_1.writeFileSync)('openapi_base.json', JSON.stringify(schemaBase, null, 2));
    }
    const result = yield openapi_diff_1.default.diffSpecs({
        sourceSpec: {
            content: JSON.stringify(schemaHead),
            location: 'openapi_head.json',
            format: 'openapi3',
        },
        destinationSpec: {
            content: JSON.stringify(schemaBase),
            location: 'openapi_base.json',
            format: 'openapi3',
        },
    });
    if (result.breakingDifferencesFound) {
        return result.breakingDifferences;
    }
    return [];
});
exports.breakingChanges = breakingChanges;
