/**
 * Report-only performance runner for JSONata.
 *
 * The file is intentionally inert when loaded by Mocha's broad test file glob.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var jsonata = require("../../src/jsonata");

var DEFAULT_WARMUP = 1;
var DEFAULT_ITERATIONS = 3;
var DEFAULT_TOP = 15;

/**
 * Read and parse a JSON file.
 * @param {string} filename - Absolute path to JSON file.
 * @returns {*} Parsed JSON value.
 */
function readJSON(filename) {
    return JSON.parse(fs.readFileSync(filename).toString());
}

/**
 * Return a duration in milliseconds since the supplied start time.
 * @param {bigint} start - High-resolution start time.
 * @returns {number} Duration in milliseconds.
 */
function elapsedMs(start) {
    return Number(process.hrtime.bigint() - start) / 1e6;
}

/**
 * Parse command-line options.
 * @param {string[]} argv - Process arguments after the script name.
 * @returns {{json: boolean, warmup: number, iterations: number, top: number}} Parsed options.
 */
function parseArgs(argv) {
    var options = {
        json: false,
        warmup: DEFAULT_WARMUP,
        iterations: DEFAULT_ITERATIONS,
        top: DEFAULT_TOP
    };

    for(var ii = 0; ii < argv.length; ii++) {
        var arg = argv[ii];
        if(arg === "--json") {
            options.json = true;
        } else if(arg === "--warmup") {
            options.warmup = Number(argv[++ii]);
        } else if(arg === "--iterations") {
            options.iterations = Number(argv[++ii]);
        } else if(arg === "--top") {
            options.top = Number(argv[++ii]);
        } else if(arg.indexOf("--warmup=") === 0) {
            options.warmup = Number(arg.substring("--warmup=".length));
        } else if(arg.indexOf("--iterations=") === 0) {
            options.iterations = Number(arg.substring("--iterations=".length));
        } else if(arg.indexOf("--top=") === 0) {
            options.top = Number(arg.substring("--top=".length));
        } else if(arg === "--help" || arg === "-h") {
            options.help = true;
        } else {
            throw new Error("Unknown option: " + arg);
        }
    }

    if(!Number.isInteger(options.warmup) || options.warmup < 0) {
        throw new Error("--warmup must be a non-negative integer");
    }
    if(!Number.isInteger(options.iterations) || options.iterations < 1) {
        throw new Error("--iterations must be a positive integer");
    }
    if(!Number.isInteger(options.top) || options.top < 1) {
        throw new Error("--top must be a positive integer");
    }

    return options;
}

/**
 * Print command usage.
 */
function printUsage() {
    console.log([
        "Usage: npm run perf -- [--json] [--warmup N] [--iterations N] [--top N]",
        "",
        "Runs report-only compile/evaluate benchmarks over the portable JSONata",
        "test-suite cases and targeted performance scenarios."
    ].join("\n"));
}

/**
 * Load named datasets from the portable test-suite directory.
 * @param {string} suiteRoot - Absolute path to test/test-suite.
 * @returns {Object} Dataset map.
 */
function loadDatasets(suiteRoot) {
    var datasets = {};
    var datasetsRoot = path.join(suiteRoot, "datasets");
    fs.readdirSync(datasetsRoot).filter(name => name.endsWith(".json")).forEach(name => {
        datasets[name.replace(".json", "")] = readJSON(path.join(datasetsRoot, name));
    });
    return datasets;
}

/**
 * Load successful portable suite cases.
 * @param {string} suiteRoot - Absolute path to test/test-suite.
 * @param {Object} datasets - Dataset map.
 * @returns {{cases: Array, skipped: Array}} Benchmark cases and skipped case summaries.
 */
function loadSuiteCases(suiteRoot, datasets) {
    var groupsRoot = path.join(suiteRoot, "groups");
    var cases = [];
    var skipped = [];

    fs.readdirSync(groupsRoot).filter(name => !name.endsWith(".json")).sort().forEach(group => {
        var groupRoot = path.join(groupsRoot, group);
        fs.readdirSync(groupRoot).filter(name => name.endsWith(".json")).sort().forEach(name => {
            var spec = readJSON(path.join(groupRoot, name));
            var specs = Array.isArray(spec) ? spec : [spec];
            specs.forEach((testcase, index) => {
                var label = group + "/" + name + "#" + index;
                if(testcase["expr-file"]) {
                    testcase.expr = fs.readFileSync(path.join(groupRoot, testcase["expr-file"])).toString();
                }
                if(testcase.timelimit || testcase.depth) {
                    skipped.push({label: label, reason: "guardrail"});
                    return;
                }
                if(!Object.prototype.hasOwnProperty.call(testcase, "result") &&
                        !Object.prototype.hasOwnProperty.call(testcase, "undefinedResult")) {
                    skipped.push({label: label, reason: "expected-error"});
                    return;
                }
                cases.push({
                    source: "suite",
                    label: label,
                    name: testcase.description || name,
                    group: group,
                    expr: testcase.expr,
                    input: resolveDataset(datasets, testcase),
                    bindings: testcase.bindings,
                    mode: "evaluate"
                });
            });
        });
    });

    return {
        cases: cases,
        skipped: skipped
    };
}

/**
 * Resolve a portable suite testcase dataset.
 * @param {Object} datasets - Dataset map.
 * @param {Object} testcase - Testcase spec.
 * @returns {*} Input document.
 */
function resolveDataset(datasets, testcase) {
    if(Object.prototype.hasOwnProperty.call(testcase, "data")) {
        return testcase.data;
    }
    if(testcase.dataset === null) {
        return undefined;
    }
    if(Object.prototype.hasOwnProperty.call(datasets, testcase.dataset)) {
        return datasets[testcase.dataset];
    }
    throw new Error("Unable to find dataset " + testcase.dataset);
}

/**
 * Load targeted benchmark cases.
 * @param {string} benchmarkFile - Absolute path to benchmarks.json.
 * @param {Object} datasets - Dataset map.
 * @returns {Array} Targeted benchmark cases.
 */
function loadTargetedCases(benchmarkFile, datasets) {
    return readJSON(benchmarkFile).map((spec, index) => {
        var input = Object.prototype.hasOwnProperty.call(spec, "generator") ?
            generateData(spec.generator) :
            resolveDataset(datasets, spec);
        return {
            source: "targeted",
            label: "targeted/" + spec.group + "/" + index,
            name: spec.name,
            group: spec.group,
            expr: spec.expr,
            input: input,
            bindings: spec.bindings,
            mode: spec.mode || "evaluate"
        };
    });
}

/**
 * Generate benchmark input data from a compact descriptor.
 * @param {Object} generator - Generator descriptor.
 * @returns {*} Input document.
 */
function generateData(generator) {
    switch(generator.type) {
        case "items":
            return generateItems(generator.size);
        case "numbers":
            return generateNumbers(generator.size);
        case "values":
            return generateValues(generator.size, generator.distinct);
        case "tree":
            return generateTreeDocument(generator.depth, generator.width);
        case "text":
            return generateText(generator.size);
        case "dates":
            return generateDates(generator.size);
    }
    throw new Error("Unknown data generator: " + generator.type);
}

/**
 * Generate item records.
 * @param {number} size - Number of items.
 * @returns {{items: Array}} Generated document.
 */
function generateItems(size) {
    var items = [];
    for(var ii = 0; ii < size; ii++) {
        items.push({
            row: ii,
            label: "label_" + ii,
            text: "text_" + ii,
            value: ii % 100,
            category: "category_" + (ii % 10),
            obsolete: true
        });
    }
    return {items: items};
}

/**
 * Generate descending numbers.
 * @param {number} size - Number of values.
 * @returns {{numbers: Array, values: Array}} Generated document.
 */
function generateNumbers(size) {
    var numbers = [];
    var values = [];
    for(var ii = 0; ii < size; ii++) {
        numbers.push(size - ii);
        values.push((ii + 1) * 1234.567 / 10);
    }
    return {
        numbers: numbers,
        values: values
    };
}

/**
 * Generate repeated primitive values.
 * @param {number} size - Number of values.
 * @param {number} distinct - Number of distinct values.
 * @returns {{values: Array}} Generated document.
 */
function generateValues(size, distinct) {
    var values = [];
    for(var ii = 0; ii < size; ii++) {
        values.push(ii % distinct);
    }
    return {values: values};
}

/**
 * Generate a nested object tree.
 * @param {number} depth - Tree depth.
 * @param {number} width - Branching factor.
 * @returns {{root: Object}} Generated document.
 */
function generateTreeDocument(depth, width) {
    var counter = 0;
    var build = function(level) {
        var node = {value: counter++};
        if(level > 0) {
            node.children = [];
            for(var ii = 0; ii < width; ii++) {
                node.children.push(build(level - 1));
            }
        }
        return node;
    };
    return {root: build(depth)};
}

/**
 * Generate comma-delimited text.
 * @param {number} size - Number of tokens.
 * @returns {{text: string}} Generated document.
 */
function generateText(size) {
    var parts = [];
    for(var ii = 0; ii < size; ii++) {
        parts.push("item" + ii);
    }
    return {text: parts.join(", ")};
}

/**
 * Generate timestamp records.
 * @param {number} size - Number of records.
 * @returns {{dates: Array}} Generated document.
 */
function generateDates(size) {
    var dates = [];
    var picture = "[Y0001]-[M01]-[D01]T[H01]:[m01]:[s01].[f001][Z01:01t]";
    var base = Date.UTC(2020, 0, 1, 0, 0, 0);
    for(var ii = 0; ii < size; ii++) {
        var millis = base + ii * 86400000;
        dates.push({
            millis: millis,
            picture: picture,
            timestamp: new Date(millis).toISOString()
        });
    }
    return {dates: dates};
}

/**
 * Run all benchmark cases.
 * @param {Array} cases - Benchmark cases.
 * @param {Object} options - Run options.
 * @returns {Promise<{results: Array, failures: Array}>} Results and failures.
 */
async function runCases(cases, options) {
    var results = [];
    var failures = [];

    for(var ii = 0; ii < cases.length; ii++) {
        var testcase = cases[ii];
        try {
            results.push(await runCase(testcase, options));
        } catch(err) {
            failures.push({
                label: testcase.label,
                group: testcase.group,
                source: testcase.source,
                message: err && err.message ? err.message : String(err)
            });
        }
    }

    return {
        results: results,
        failures: failures
    };
}

/**
 * Run one benchmark case.
 * @param {Object} testcase - Benchmark case.
 * @param {Object} options - Run options.
 * @returns {Promise<Object>} Benchmark result.
 */
async function runCase(testcase, options) {
    var compileMs = 0;
    var evalMs = 0;
    var expression;

    for(var warmup = 0; warmup < options.warmup; warmup++) {
        expression = jsonata(testcase.expr);
        if(testcase.mode !== "compile") {
            await expression.evaluate(testcase.input, testcase.bindings);
        }
    }

    for(var ii = 0; ii < options.iterations; ii++) {
        var compileStart = process.hrtime.bigint();
        expression = jsonata(testcase.expr);
        compileMs += elapsedMs(compileStart);
    }

    if(testcase.mode !== "compile") {
        expression = jsonata(testcase.expr);
        for(ii = 0; ii < options.iterations; ii++) {
            var evalStart = process.hrtime.bigint();
            await expression.evaluate(testcase.input, testcase.bindings);
            evalMs += elapsedMs(evalStart);
        }
    }

    return {
        source: testcase.source,
        label: testcase.label,
        name: testcase.name,
        group: testcase.group,
        mode: testcase.mode,
        compileMs: compileMs,
        evalMs: evalMs,
        compileMeanMs: compileMs / options.iterations,
        evalMeanMs: testcase.mode === "compile" ? 0 : evalMs / options.iterations
    };
}

/**
 * Summarize results by group.
 * @param {Array} results - Benchmark results.
 * @returns {Array} Group summaries.
 */
function summarizeGroups(results) {
    var groups = Object.create(null);
    results.forEach(result => {
        if(!groups[result.group]) {
            groups[result.group] = {
                group: result.group,
                source: result.source,
                cases: 0,
                compileMs: 0,
                evalMs: 0
            };
        }
        groups[result.group].cases++;
        groups[result.group].compileMs += result.compileMs;
        groups[result.group].evalMs += result.evalMs;
    });
    return Object.keys(groups).map(group => {
        var summary = groups[group];
        summary.compileMeanMs = summary.compileMs / summary.cases;
        summary.evalMeanMs = summary.evalMs / summary.cases;
        return summary;
    }).sort((lhs, rhs) => rhs.evalMs - lhs.evalMs);
}

/**
 * Build the full benchmark report.
 * @param {Object} options - Run options.
 * @returns {Promise<Object>} Report.
 */
async function buildReport(options) {
    var root = path.join(__dirname, "..", "..");
    var suiteRoot = path.join(root, "test", "test-suite");
    var datasets = loadDatasets(suiteRoot);
    var suite = loadSuiteCases(suiteRoot, datasets);
    var targeted = loadTargetedCases(path.join(__dirname, "benchmarks.json"), datasets);
    var allCases = suite.cases.concat(targeted);
    var run = await runCases(allCases, options);
    var groups = summarizeGroups(run.results);
    var slowestEval = run.results.filter(result => result.mode !== "compile").
        slice().sort((lhs, rhs) => rhs.evalMeanMs - lhs.evalMeanMs).slice(0, options.top);
    var slowestCompile = run.results.slice().
        sort((lhs, rhs) => rhs.compileMeanMs - lhs.compileMeanMs).slice(0, options.top);

    return {
        metadata: {
            node: process.version,
            platform: process.platform,
            arch: process.arch,
            warmup: options.warmup,
            iterations: options.iterations,
            generatedAt: new Date().toISOString()
        },
        totals: {
            cases: allCases.length,
            measured: run.results.length,
            skipped: suite.skipped.length,
            failures: run.failures.length
        },
        groups: groups,
        slowestEval: slowestEval,
        slowestCompile: slowestCompile,
        failures: run.failures,
        skipped: suite.skipped
    };
}

/**
 * Format milliseconds.
 * @param {number} value - Milliseconds.
 * @returns {string} Formatted value.
 */
function formatMs(value) {
    return value.toFixed(3).padStart(10);
}

/**
 * Print a text report.
 * @param {Object} report - Benchmark report.
 */
function printReport(report) {
    console.log("JSONata performance report");
    console.log("Node: " + report.metadata.node + "  platform: " + report.metadata.platform + "/" + report.metadata.arch);
    console.log("Warmup: " + report.metadata.warmup + "  iterations: " + report.metadata.iterations);
    console.log("Cases: " + report.totals.measured + " measured, " + report.totals.skipped + " skipped, " + report.totals.failures + " failures");
    console.log("");

    console.log("Top groups by total evaluate time");
    report.groups.slice(0, 25).forEach(group => {
        console.log(formatMs(group.evalMs) + " eval ms  " +
            formatMs(group.compileMs) + " compile ms  " +
            String(group.cases).padStart(4) + " cases  " + group.group);
    });
    console.log("");

    console.log("Slowest evaluate cases");
    report.slowestEval.forEach((result, index) => {
        console.log(String(index + 1).padStart(2) + " " +
            formatMs(result.evalMeanMs) + " mean ms  " + result.label + "  " + result.name);
    });
    console.log("");

    console.log("Slowest compile cases");
    report.slowestCompile.forEach((result, index) => {
        console.log(String(index + 1).padStart(2) + " " +
            formatMs(result.compileMeanMs) + " mean ms  " + result.label + "  " + result.name);
    });

    if(report.failures.length > 0) {
        console.log("");
        console.log("Failures");
        report.failures.forEach(failure => {
            console.log(failure.label + ": " + failure.message);
        });
    }
}

/**
 * Run the CLI.
 * @param {string[]} argv - Process arguments after script name.
 * @returns {Promise<void>}
 */
async function runCli(argv) {
    var options = parseArgs(argv);
    if(options.help) {
        printUsage();
        return;
    }
    var report = await buildReport(options);
    if(options.json) {
        console.log(JSON.stringify(report, null, 2));
    } else {
        printReport(report);
    }
    if(report.failures.length > 0) {
        process.exitCode = 1;
    }
}

if(require.main === module) {
    runCli(process.argv.slice(2)).catch(err => {
        console.error(err && err.stack ? err.stack : err);
        process.exitCode = 1;
    });
}

module.exports = {
    buildReport,
    generateData,
    loadSuiteCases,
    loadTargetedCases,
    parseArgs,
    runCases
};
