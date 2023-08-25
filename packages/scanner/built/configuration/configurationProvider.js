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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.parseConfigFile = exports.loadConfig = exports.loadRule = void 0;
const ajv_1 = __importDefault(require("ajv"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const fs_1 = require("fs");
const check_1 = __importDefault(require("../check"));
const util_1 = require("../rules/lib/util");
const matchEvent_1 = require("../rules/lib/matchEvent");
const parseRuleDescription_1 = __importDefault(require("../rules/lib/parseRuleDescription"));
const options_json_1 = __importDefault(require("./schema/options.json"));
const match_pattern_config_json_1 = __importDefault(require("./schema/match-pattern-config.json"));
const url_1 = require("url");
const util_2 = require("util");
const path_1 = require("path");
const ajv = new ajv_1.default();
ajv.addSchema(match_pattern_config_json_1.default);
function loadFromFile(ruleName) {
    return () => __awaiter(this, void 0, void 0, function* () {
        let ruleSpec;
        try {
            ruleSpec = yield Promise.resolve().then(() => __importStar(require(`../rules/${ruleName}`)));
        }
        catch (e) {
            return;
        }
        return ruleSpec.default;
    });
}
function loadFromDir(ruleName) {
    return () => __awaiter(this, void 0, void 0, function* () {
        let metadata;
        let rule;
        let options;
        try {
            metadata = (yield Promise.resolve().then(() => __importStar(require(`../rules/${ruleName}/metadata`)))).default;
        }
        catch (e) {
            return;
        }
        try {
            rule = (yield Promise.resolve().then(() => __importStar(require(`../rules/${ruleName}/rule`)))).default;
        }
        catch (_a) {
            console.warn(`Rule ${ruleName} has no rule.js or rule.ts file, or the file doesn't have a default export`);
            return;
        }
        if ((0, util_1.verbose)())
            console.log(`Loaded rule ${ruleName}: ${rule}`);
        try {
            options = (yield Promise.resolve().then(() => __importStar(require(`../rules/${ruleName}/options`)))).default;
            if ((0, util_1.verbose)())
                console.log(`Loaded rule ${ruleName} options: ${options}`);
        }
        catch (_b) {
            // This is OK
        }
        const description = (0, parseRuleDescription_1.default)(ruleName);
        const references = Object.keys(metadata.references || {}).reduce((memo, key) => {
            memo[key] = new url_1.URL(metadata.references[key]);
            return memo;
        }, {});
        return {
            id: (0, util_1.dasherize)(ruleName),
            title: metadata.title,
            description,
            url: `https://appland.com/docs/analysis/rules-reference.html#${(0, util_1.dasherize)(ruleName)}`,
            labels: metadata.labels || [],
            scope: metadata.scope,
            enumerateScope: metadata.enumerateScope,
            impactDomain: metadata.impactDomain,
            references,
            Options: options,
            build: rule,
        };
    });
}
function buildBuiltinCheck(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const rule = yield loadRule(config.rule);
        if ((0, util_1.verbose)()) {
            console.log(`Loaded rule: ${rule}`);
        }
        let options;
        if (rule.Options) {
            options = new rule.Options();
        }
        else {
            options = {};
        }
        if (config.properties) {
            Object.keys(config.properties).forEach((name) => {
                const value = config.properties[name];
                options[name] = value;
            });
        }
        const check = new check_1.default(rule, options);
        if (config.scope) {
            check.scope = config.scope;
        }
        if (config.id) {
            check.id = (0, util_1.dasherize)(config.id);
        }
        check.includeScope = (0, matchEvent_1.buildFilters)((config.include || []).filter((item) => item.scope).map((item) => item.scope));
        check.excludeScope = (0, matchEvent_1.buildFilters)((config.exclude || []).filter((item) => item.scope).map((item) => item.scope));
        check.includeEvent = (0, matchEvent_1.buildFilters)((config.include || []).filter((item) => item.event).map((item) => item.event));
        check.excludeEvent = (0, matchEvent_1.buildFilters)((config.exclude || []).filter((item) => item.event).map((item) => item.event));
        if ((0, util_1.verbose)()) {
            console.log(`Loaded check: ${check}`);
        }
        return check;
    });
}
const validate = (validator, data, context) => {
    const valid = validator(data);
    if (!valid) {
        throw new Error(validator
            .errors.map((err) => {
            let instance = err.instancePath;
            if (!instance || instance === '') {
                instance = context;
            }
            return `${instance} ${err.message} (${err.schemaPath})`;
        })
            .join(', '));
    }
};
function loadRule(ruleName) {
    return __awaiter(this, void 0, void 0, function* () {
        const ruleId = (0, util_1.dasherize)(ruleName);
        const rules = yield Promise.all([
            loadFromDir(ruleId),
            loadFromFile(ruleId),
            loadFromDir((0, util_1.camelize)(ruleId)),
            loadFromFile((0, util_1.camelize)(ruleId)),
        ].map((loader) => __awaiter(this, void 0, void 0, function* () {
            return yield loader();
        })));
        const rule = rules.find((rule) => rule);
        if (!rule)
            throw new Error(`Rule ${ruleName} not found`);
        return rule;
    });
}
exports.loadRule = loadRule;
function hasDefinition(key) {
    return key in options_json_1.default.definitions;
}
function loadConfig(config) {
    return __awaiter(this, void 0, void 0, function* () {
        config.checks
            .filter((check) => check.properties)
            .forEach((check) => {
            const ruleId = check.rule;
            const schemaKey = [(0, util_1.capitalize)(ruleId), 'Options'].join('.');
            if ((0, util_1.verbose)()) {
                console.warn(schemaKey);
            }
            if (!hasDefinition(schemaKey)) {
                return;
            }
            const propertiesSchema = options_json_1.default.definitions[schemaKey];
            if ((0, util_1.verbose)()) {
                console.warn(propertiesSchema);
                console.warn(check.properties);
            }
            validate(ajv.compile(propertiesSchema), check.properties || {}, `${ruleId} properties`);
        });
        return Promise.all(config.checks.map((c) => __awaiter(this, void 0, void 0, function* () { return buildBuiltinCheck(c); })));
    });
}
exports.loadConfig = loadConfig;
function parseConfigFile(configPath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield (0, util_2.promisify)(fs_1.exists)(configPath))) {
            configPath = (0, path_1.join)(__dirname, '../sampleConfig/default.yml');
        }
        console.log(`Using scanner configuration file ${configPath}`);
        const timestampMs = (yield fs_1.promises.stat(configPath)).mtimeMs;
        const yamlConfig = yield fs_1.promises.readFile(configPath, 'utf-8');
        const config = js_yaml_1.default.load(yamlConfig, {
            filename: configPath,
        });
        return Object.assign(Object.assign({}, config), { timestampMs });
    });
}
exports.parseConfigFile = parseConfigFile;
