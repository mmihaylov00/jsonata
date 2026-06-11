/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: JSONata
 *   This project is licensed under the MIT License, see LICENSE
 */

"use strict";

var chai = require("chai");
var expect = chai.expect;
var runner = require("./performance/run-performance-suite");

describe("Performance runner options", () => {
    it("parses averaged run counts", function() {
        expect(runner.parseArgs(["--runs", "5"]).runs).to.equal(5);
        expect(runner.parseArgs(["--runs=10"]).runs).to.equal(10);
        expect(function() {
            runner.parseArgs(["--runs", "0"]);
        }).to.throw("--runs must be a positive integer");
    });

    it("averages benchmark results across repeated runs", function() {
        var first = [{
            source: "targeted",
            label: "targeted/example/0",
            name: "example",
            group: "target",
            mode: "evaluate",
            compileMs: 2,
            evalMs: 8,
            compileMeanMs: 1,
            evalMeanMs: 4
        }];
        var second = [{
            source: "targeted",
            label: "targeted/example/0",
            name: "example",
            group: "target",
            mode: "evaluate",
            compileMs: 6,
            evalMs: 12,
            compileMeanMs: 3,
            evalMeanMs: 6
        }];

        var result = runner.averageRunResults([first, second], {iterations: 2});

        expect(result).to.have.length(1);
        expect(result[0]).to.deep.include({
            label: "targeted/example/0",
            compileMs: 4,
            evalMs: 10,
            compileMeanMs: 2,
            evalMeanMs: 5,
            runs: 2
        });
        expect(result[0].compileStdDevMs).to.equal(2);
        expect(result[0].evalStdDevMs).to.equal(2);
    });
});
