"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GraphEdge_1 = __importDefault(require("../algorithms/dataStructures/graph/GraphEdge"));
const GraphVertex_1 = __importDefault(require("../algorithms/dataStructures/graph/GraphVertex"));
const Graph_1 = __importDefault(require("../algorithms/dataStructures/graph/Graph"));
const detect_cycle_1 = __importDefault(require("../algorithms/graph/detect-cycle"));
const path_1 = require("path");
const util_1 = require("./lib/util");
const matchPattern_1 = require("./lib/matchPattern");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
class Cycle {
    constructor(packages, events) {
        this.packages = packages;
        this.events = events;
    }
}
function ignorePackage(event, ignoredPackages) {
    const myPackage = event.codeObject.packageOf;
    return (myPackage === '' ||
        ignoredPackages.some((filter) => filter(myPackage)) ||
        !event.codeObject.location ||
        (0, path_1.isAbsolute)(event.codeObject.location));
}
function detectCycles(root, ignoredPackages) {
    const graph = new Graph_1.default(true);
    const vertices = new Map();
    const edges = new Set();
    const vertexEvents = new Map();
    const makeVertex = (pkg, event) => {
        let result = vertices.get(pkg);
        if (!result) {
            result = new GraphVertex_1.default(pkg);
            vertices.set(pkg, result);
            vertexEvents.set(pkg, [event]);
        }
        else {
            vertexEvents.get(pkg).push(event);
        }
        return result;
    };
    const collectEvent = (event, parentEvent, parentPackage) => {
        let myPackage = event.codeObject.packageOf;
        if (ignorePackage(event, ignoredPackages)) {
            myPackage = null;
        }
        if (myPackage) {
            const vertex = makeVertex(myPackage, event);
            if (parentPackage && parentPackage !== myPackage) {
                const edge = new GraphEdge_1.default(vertices.get(parentPackage), vertex);
                if (!edges.has(edge.getKey())) {
                    if ((0, util_1.verbose)()) {
                        console.warn(`New edge: ${parentPackage}/${parentEvent} -> ${myPackage}/${event}`);
                    }
                    edges.add(edge.getKey());
                    graph.addEdge(edge);
                }
            }
            parentPackage = myPackage;
        }
        event.children.forEach((child) => collectEvent(child, event, parentPackage));
    };
    if (root.codeObject.packageOf !== '') {
        makeVertex(root.codeObject.packageOf, root);
    }
    collectEvent(root, null, null);
    return (0, detect_cycle_1.default)(graph).map((cycle) => {
        return new Cycle(cycle.map((vertex) => vertex.getKey()), vertexEvents);
    });
}
/**
 * Given a list of package names which occur in a cycle,
 * search the event tree to find a list of specific events whose sequence and package names match the cycle.

 * @returns Sequence of events whose package names match the cyclePath.
 */
const searchForCycle = (cycle, ignoredPackages) => {
    const traverseEvent = (event, recordEvent, cyclePath, cyclePathIndex = 0, path = []) => {
        if (recordEvent) {
            if ((0, util_1.verbose)()) {
                console.warn(`${Array(path.length).fill('').join('  ')}push: ${event}`);
            }
            path.push(event);
        }
        else {
            if ((0, util_1.verbose)()) {
                console.warn(`${Array(path.length).fill('').join('  ')}traverse: ${event}`);
            }
        }
        if (cyclePathIndex === cyclePath.length - 1) {
            if ((0, util_1.verbose)()) {
                console.warn(`${Array(path.length).fill('').join('  ')}result: ${path}`);
            }
            return [...path];
        }
        const myPackage = event.codeObject.packageOf;
        if ((0, util_1.verbose)()) {
            console.warn(event.children.map((child) => child.codeObject.fqid));
        }
        // Traverse children of ignored or same package
        let result = event.children
            .filter((child) => child.codeObject.packageOf === myPackage || ignorePackage(child, ignoredPackages))
            .map((child) => traverseEvent(child, false, cyclePath, cyclePathIndex, path))
            .filter(Boolean);
        // Traverse children of the next package in the graph
        if (result.length === 0) {
            result = event.children
                .filter((child) => child.codeObject.packageOf !== myPackage &&
                !ignorePackage(child, ignoredPackages) &&
                cyclePath[cyclePathIndex + 1] === child.codeObject.packageOf)
                .map((child) => traverseEvent(child, true, cyclePath, cyclePathIndex + 1, path))
                .filter((path) => path);
        }
        if (result.length > 0) {
            return result[0];
        }
        else {
            if (recordEvent) {
                if ((0, util_1.verbose)()) {
                    console.warn(`${Array(path.length - 1)
                        .fill('')
                        .join('  ')}pop`);
                }
                path.pop();
            }
            else {
                if ((0, util_1.verbose)()) {
                    console.warn(`${Array(path.length - 1)
                        .fill('')
                        .join('  ')}untraverse`);
                }
            }
            return null;
        }
    };
    // Look for a cycle starting at each package name. For each package name, consider the
    // events that have that package.
    for (let i = 0; i < cycle.packages.length; i++) {
        const packageName = cycle.packages[i];
        const startEvents = cycle.events.get(packageName);
        const cyclePath = [];
        for (let k = 0; k < cycle.packages.length; k++) {
            cyclePath[k] = cycle.packages[(i + k) % cycle.packages.length];
        }
        cyclePath.push(packageName);
        if ((0, util_1.verbose)()) {
            console.warn(`Searching for event path for cycle ${cyclePath}`);
        }
        for (let j = 0; j < startEvents.length; j++) {
            const startEvent = startEvents[j];
            const path = traverseEvent(startEvent, true, cyclePath);
            if (path) {
                return path;
            }
        }
    }
    return null;
};
class Options {
    constructor() {
        this.ignoredPackages = [];
        this.depth = 4;
    }
}
function build(options) {
    const ignoredPackages = (0, matchPattern_1.buildFilters)(options.ignoredPackages);
    function matcher(event) {
        return detectCycles(event, ignoredPackages)
            .filter((cycle) => cycle.packages.length + 1 >= options.depth)
            .map((cycle) => searchForCycle(cycle, ignoredPackages))
            .filter((path) => path)
            .map((path) => {
            path = path;
            return {
                event: path[0],
                message: [
                    'Cycle in package dependency graph',
                    path.map((event) => event.codeObject.packageOf).join(' -> '),
                ].join(': '),
                participatingEvents: Object.fromEntries(path.map((event, index) => [`path[${index}]`, event])),
            };
        });
    }
    return {
        matcher,
    };
}
const RULE = {
    id: 'circular-dependency',
    title: 'Circular package dependency',
    Options,
    impactDomain: 'Maintainability',
    references: {
        'CWE-1047': new url_1.URL('https://cwe.mitre.org/data/definitions/1047.html'),
    },
    enumerateScope: false,
    description: (0, parseRuleDescription_1.default)('circularDependency'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#circular-dependency',
    build,
};
exports.default = RULE;
