/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: JSONata
 *   This project is licensed under the MIT License, see LICENSE
 *
 * The files in this directory are tests that aren't really portable
 * to other implementations for various reasons but they are included
 * in order to achieve 100% coverage for this implementation.
 */

"use strict";

var jsonata = require("../src/jsonata");
var datetime = require("../src/datetime");
var functions = require("../src/functions");
var utils = require("../src/utils");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

async function countLookups(key, callback) {
    var original = functions.lookup;
    var count = 0;
    functions.lookup = function(input, lookupKey) {
        if(lookupKey === key) {
            count++;
        }
        return original.apply(this, arguments);
    };
    try {
        var result = await callback(function() {
            return count;
        });
        return {count: count, result: result};
    } finally {
        functions.lookup = original;
    }
}

function hasSymbolDescription(object, description) {
    return Object.getOwnPropertySymbols(object).some(function(symbol) {
        return symbol.description === description;
    });
}

var testdata1 = {
    "foo": {
        "bar": 42,
        "blah": [{"baz": {"fud": "hello"}}, {"baz": {"fud": "world"}}, {"bazz": "gotcha"}],
        "blah.baz": "here"
    }, "bar": 98
};

var testdata2 = {
    Account: {
        "Account Name": "Firefly",
        Order: [
            {
                OrderID: "order103",
                Product: [
                    {
                        "Product Name": "Bowler Hat",
                        ProductID: 858383,
                        SKU: "0406654608",
                        Description: {
                            Colour: "Purple",
                            Width: 300,
                            Height: 200,
                            Depth: 210,
                            Weight: 0.75
                        },
                        Price: 34.45,
                        Quantity: 2
                    },
                    {
                        "Product Name": "Trilby hat",
                        ProductID: 858236,
                        SKU: "0406634348",
                        Description: {
                            Colour: "Orange",
                            Width: 300,
                            Height: 200,
                            Depth: 210,
                            Weight: 0.6
                        },
                        Price: 21.67,
                        Quantity: 1
                    }
                ]
            },
            {
                OrderID: "order104",
                Product: [
                    {
                        "Product Name": "Bowler Hat",
                        ProductID: 858383,
                        SKU: "040657863",
                        Description: {
                            Colour: "Purple",
                            Width: 300,
                            Height: 200,
                            Depth: 210,
                            Weight: 0.75
                        },
                        Price: 34.45,
                        Quantity: 4
                    },
                    {
                        ProductID: 345664,
                        SKU: "0406654603",
                        "Product Name": "Cloak",
                        Description: {
                            Colour: "Black",
                            Width: 30,
                            Height: 20,
                            Depth: 210,
                            Weight: 2.0
                        },
                        Price: 107.99,
                        Quantity: 1
                    }
                ]
            }
        ]
    }
};

describe("Functions with side-effects", () => {
    describe("Evaluator - function: millis", function() {
        describe("$millis() returns milliseconds since the epoch", function() {
            it("should return result object", function() {
                var expr = jsonata("$millis()");
                // 27 Sep 2016, first commit to JSONata
                expect(expr.evaluate(testdata2)).to.eventually.be.above(
                    1474934400
                );
            });
        });

        describe("$millis() always returns same value within an expression", function() {
            it("should return result object", function() {
                var expr = jsonata(
                    '{"now": $millis(), "delay": $sum([1..10000]), "later": $millis()}.(now = later)'
                );
                expect(expr.evaluate(testdata2)).to.eventually.equal(true);
            });
        });

        describe("$millis() returns different timestamp for subsequent evaluate() calls", function() {
            it("should return result object", async function() {
                var expr = jsonata("($sum([1..10000]); $millis())");
                var result = await expr.evaluate(testdata2);
                await new Promise(resolve => setTimeout(resolve, 1));
                var result2 = await expr.evaluate(testdata2);
                expect(result).to.not.equal(result2);
            });
        });
    });

    describe("$now() returns timestamp", function() {
        it("should return result object", function() {
            var expr = jsonata("$now()");
            var result = expr.evaluate(testdata2);
            // follows this pattern - "2017-05-09T10:10:16.918Z"
            expect(result).to.eventually.match(
                /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/
            );
        });
    });

    describe("$now() returns timestamp with defined format", function() {
        it("should return result object", function() {
            var expr = jsonata("$now('[h]:[M01][P] [z]')");
            var result = expr.evaluate(testdata2);
            // follows this pattern - "10:23am GMT+00:00"
            expect(result).to.eventually.match(/^\d?\d:\d\d[ap]m GMT\+00:00$/);
        });
    });

    describe("$now() returns timestamp with defined format and timezone", function() {
        it("should return result object", function() {
            var expr = jsonata("$now('[h]:[M01][P] [z]', '-0500')");
            var result = expr.evaluate(testdata2);
            // follows this pattern - "10:23am GMT-05:00"
            expect(result).to.eventually.match(/^\d?\d:\d\d[ap]m GMT-05:00$/);
        });
    });

    describe("$now() always returns same value within an expression", function() {
        it("should return result object", async function() {
            var expr = jsonata('{"now": $now(), "delay": $sum([1..10000]), "later": $now()}.(now = later)');
            var result = await expr.evaluate(testdata2);
            var expected = true;
            expect(result).to.deep.equal(expected);
        });
    });

    describe("$now() returns different timestamp for subsequent evaluate() calls", function() {
        it("should return result object", async function() {
            var expr = jsonata("($sum([1..100000]); $now())");
            var result = await expr.evaluate(testdata2);
            await new Promise(resolve => setTimeout(resolve, 1));
            var result2 = await expr.evaluate(testdata2);
            expect(result).to.not.equal(result2);
        });
    });

    describe("$millis() returns milliseconds since the epoch", function() {
        it("should return result object", function() {
            var expr = jsonata("$millis()");
            // 27 Sep 2016, first commit to JSONata
            expect(expr.evaluate(testdata2)).to.eventually.be.above(1474934400);
        });
    });

    describe("Evaluator - functions: random", function() {
        describe('random number")', function() {
            it("should return result object", async function() {
                var expr = jsonata("$random()");
                var result = await expr.evaluate();
                var expected = result >= 0 && result < 1;
                expect(expected).to.equal(true);
            });
        });

        describe('consequetive random numbers should be different")', function() {
            it("should return result object", function() {
                var expr = jsonata("$random() = $random()");
                var expected = false;
                expect(expr.evaluate()).to.eventually.deep.equal(expected);
            });
        });
    });
});

describe("Tests that rely on JavaScript-style object traversal", () => {
    // A JSON object is an unordered list of key-value pairs.
    // When traversing an object, the entries may be returned
    // in a non-deterministic order (depending on the language).
    // The following tests assume a traversal order which works
    // in JavaScript but may not apply to other languages.
    // See https://github.com/jsonata-js/jsonata/issues/179.
    describe('foo.*[0]', function () {
        it('should return result object', async function () {
            var expr = jsonata("foo.*[0]");
            var result = await expr.evaluate(testdata1);
            var expected = 42;
            expect(result).to.deep.equal(expected);
        });
    });

    describe('**[2]', function () {
        it('should return result object', async function () {
            var expr = jsonata("**[2]");
            var result = await expr.evaluate(testdata2);
            var expected = "Firefly";
            expect(result).to.deep.equal(expected);
        });
    });
});

describe("Tests that use the $clone() function", () => {
    // $clone() allows jsonata-js to play nicely with Node-RED.
    // It's not part of the JSONata standard.
    // See https://github.com/jsonata-js/jsonata/issues/207.
    describe('clone undefined', function () {
        it('should return undefined', async function () {
            var expr = jsonata('$clone(foo)');
            var result = await expr.evaluate(testdata2);
            var expected = undefined;
            expect(result).to.deep.equal(expected);
        });
    });

    describe('clone empty object', function () {
        it('should return empty object', async function () {
            var expr = jsonata('$clone({})');
            var result = await expr.evaluate(testdata2);
            var expected = {};
            expect(result).to.deep.equal(expected);
        });
    });

    describe('clone object', function () {
        it('should return same object', async function () {
            var expr = jsonata('$clone({"a": 1})');
            var result = await expr.evaluate(testdata2);
            var expected = {"a": 1};
            expect(result).to.deep.equal(expected);
        });
    });

    describe("transform expression with overridden $clone function", function() {
        it("should return result object", async function() {
            var expr = jsonata('Account ~> |Order|{"Product":"blah"},nomatch|');
            var count = 0;
            expr.registerFunction("clone", function(arg) {
                count++;
                return JSON.parse(JSON.stringify(arg));
            });
            var result = await expr.evaluate(testdata2);
            var expected = {
                "Account Name": "Firefly",
                Order: [
                    {
                        OrderID: "order103",
                        Product: "blah"
                    },
                    {
                        OrderID: "order104",
                        Product: "blah"
                    }
                ]
            };
            expect(result).to.deep.equal(expected);
            expect(count).to.equal(1);
        });
    });

    describe('transform expression with overridden $clone value', function () {
        it('should throw error', async function () {
            var expr = jsonata('( $clone := 5; $ ~> |Account.Order.Product|{"blah":"foo"}| )');
            expect(
                expr.evaluate(testdata2)
            ).to.eventually.be.rejected.to.deep.contain({ code: "T2013" });
        });
    });
});

describe("Tests that bind Javascript functions", () => {
    // These involve binding of functions
    describe("Override implementation of $now()", function() {
        it("should return result object", async function() {
            var expr = jsonata("$now()");
            expr.registerFunction("now", function() {
                return "time for tea";
            });
            var result = await expr.evaluate(testdata2);
            expect(result).to.equal("time for tea");
        });
    });

    // Issue #261. Previously we would attempt to assign to the read-only `message` property,
    // causing an unrelated `TypeError` to be thrown instead
    describe("function throws a `DOMException` with a read-only `message` property", function() {
        /**
         * `DOMException` is not available in our testing environment. Additionally, we can't
         * just import the `domexception` module since it doesn't work on Node.js v4, which
         * we still support. So, here's a fake skeleton implementation which has the relevant
         * qualities we need to reproduce the bug, most importantly a read-only `message`
         * property
         * @param {string} message - Error message
         * @constructor
         */
        function DOMException (message) {
            Object.defineProperty(this, "message", {
                get() {
                    return message;
                },
                enumerable: true,
                configurable: true
            });
        }

        Object.setPrototypeOf(DOMException.prototype, Error.prototype);

        it("rethrows correctly", function() {
            var expr = jsonata("$throwDomEx()");
            expr.registerFunction("throwDomEx", function() {
                throw new DOMException('Here is my message');
            });
            expect(expr.evaluate({}))
                .to.eventually.be.rejectedWith(DOMException)
                .to.deep.contain({
                    message: "Here is my message",
                    position: 12,
                    token: "throwDomEx",
                });
        });
    });

    describe("map a user-defined Javascript function with signature", function() {
        it("should return result object", async function() {
            var expr = jsonata("$map([1,4,9,16], $squareroot)");
            expr.registerFunction(
                "squareroot",
                function(num) {
                    return Math.sqrt(num);
                },
                "<n:n>"
            );
            var result = await expr.evaluate(testdata2);
            var expected = [1, 2, 3, 4];
            expect(result).to.deep.equal(expected);
        });
    });
    describe("map a user-defined Javascript function with undefined signature", function() {
        it("should return result object", async function() {
            var expr = jsonata("$map([1,4,9,16], $squareroot)");
            expr.registerFunction("squareroot", function(num) {
                return Math.sqrt(num);
            });
            var result = await expr.evaluate(testdata2);
            var expected = [1, 2, 3, 4];
            expect(result).to.deep.equal(expected);
        });
    });

    describe("map a user-defined Javascript function", function() {
        it("should return result object", async function() {
            var expr = jsonata("$map([1,4,9,16], $squareroot)");
            expr.assign("squareroot", function(num) {
                return Math.sqrt(num);
            });
            var result = await expr.evaluate(testdata2);
            var expected = [1, 2, 3, 4];
            expect(result).to.deep.equal(expected);
        });
    });

    describe("$filter with a user-defined Javascript function", function() {
        it("should return result object", async function() {
            var expr = jsonata("$filter([1,4,9,16], $even)");
            expr.assign("even", function(num) {
                return num % 2 === 0;
            });
            var result = await expr.evaluate(testdata2);
            var expected = [4, 16];
            expect(result).to.deep.equal(expected);
        });
    });

    describe("$sift with a user-defined Javascript function", function() {
        it("should return result object", async function() {
            var expr = jsonata("$sift({'one': 1, 'four': 4, 'nine': 9, 'sixteen': 16}, $even)");
            expr.assign("even", function(num) {
                return num % 2 === 0;
            });
            var result = await expr.evaluate(testdata2);
            var expected = {'four': 4, 'sixteen': 16};
            expect(result).to.deep.equal(expected);
        });
    });

    describe("$each with a user-defined Javascript function", function() {
        it("should return result object", async function() {
            var expr = jsonata("$each({'one': 1, 'four': 4, 'nine': 9, 'sixteen': 16}, $squareroot)");
            expr.assign("squareroot", function(num) {
                return Math.sqrt(num);
            });
            var result = await expr.evaluate(testdata2);
            var expected = [1, 2, 3, 4];
            expect(result).to.deep.equal(expected);
        });
    });

    describe("Partially apply user-defined Javascript function", function() {
        it("should return result object", async function() {
            var expr = jsonata(
                "(" +
                    "  $firstn := $substr(?, 0, ?);" +
                    "  $first5 := $firstn(?, 5);" +
                    '  $first5("Hello World")' +
                    ")"
            );
            expr.assign("substr", function(str, start, len) {
                return str.substr(start, len);
            });
            var result = await expr.evaluate(testdata2);
            var expected = "Hello";
            expect(result).to.deep.equal(expected);
        });
    });

    describe("User defined matchers", function() {
        var repeatingLetters = function(char, repeat) {
            // custom matcher to match `repeat` contiguous occurrences of `char`
            var chars = char.repeat(repeat);
            var match = function(str, offset) {
                var pos = str.indexOf(chars, (offset || 0));
                if (pos === -1) {
                    return;
                } else {
                    return {
                        match: chars,
                        start: pos,
                        end: pos + chars.length,
                        groups: [],
                        next: function () {
                            return match(str, pos + chars.length);
                        }
                    };
                }
            };
            return match;
        };

        it("should match using a custom matcher", async function() {
            var expr = jsonata("$match('LLANFAIRPWLLGWYNGYLLGOGERYCHWYRNDROBWLLLLANTYSILIOGOGOGOCH', $repeatingLetters('L', 2))");
            expr.registerFunction("repeatingLetters", repeatingLetters);
            var result = await expr.evaluate();
            var expected = [
                {"match": "LL", "index": 0, "groups": []},
                {"match": "LL", "index": 10, "groups": []},
                {"match": "LL", "index": 18, "groups": []},
                {"match": "LL", "index": 37, "groups": []},
                {"match": "LL", "index": 39, "groups": []}
            ];
            expect(result).to.deep.equal(expected);
        });

        it("should split using a custom matcher", async function() {
            var expr = jsonata("$split('LLANFAIRPWLLGWYNGYLLGOGERYCHWYRNDROBWLLLLANTYSILIOGOGOGOCH', $repeatingLetters('L', 2))");
            expr.registerFunction("repeatingLetters", repeatingLetters);
            var result = await expr.evaluate();
            var expected = ["","ANFAIRPW","GWYNGY","GOGERYCHWYRNDROBW","","ANTYSILIOGOGOGOCH"];
            expect(result).to.deep.equal(expected);
        });

        it("should replace using a custom matcher", async function() {
            var expr = jsonata("$replace('LLANFAIRPWLLGWYNGYLLGOGERYCHWYRNDROBWLLLLANTYSILIOGOGOGOCH', $repeatingLetters('L', 2), 'Ỻ')");
            expr.registerFunction("repeatingLetters", repeatingLetters);
            var result = await expr.evaluate();
            var expected = "ỺANFAIRPWỺGWYNGYỺGOGERYCHWYRNDROBWỺỺANTYSILIOGOGOGOCH";
            expect(result).to.deep.equal(expected);
        });

        it("should test inclusion using a custom matcher", async function() {
            var expr = jsonata("$contains('LLANFAIRPWLLGWYNGYLLGOGERYCHWYRNDROBWLLLLANTYSILIOGOGOGOCH', $repeatingLetters('L', 4))");
            expr.registerFunction("repeatingLetters", repeatingLetters);
            var result = await expr.evaluate();
            var expected = true;
            expect(result).to.deep.equal(expected);
        });

    });

    describe('User defined higher-order functions', () => {
        var myfunc = async (arr, fn) => 2 * (await fn(arr));

        var startsWith = function(str) {
            // returns a function that returns true if its argument starts with the string `str`
            return (arg) => {
                return arg.startsWith(str);
            };
        };

        it('should be able to invoke a built-in function passed as an argument', async () => {
            var expr = jsonata("$myfunc([1,2,3], $sum)");
            expr.registerFunction('myfunc', myfunc);
            var result = await expr.evaluate();
            var expected = 12;
            expect(result).to.deep.equal(expected);
        });

        it('should be able to invoke a lambda function passed as an argument', async () => {
            var expr = jsonata("$myfunc([1,2,3], λ($arr) { $arr[1] + $arr[2] })");
            expr.registerFunction('myfunc', myfunc);
            var result = await expr.evaluate();
            var expected = 10;
            expect(result).to.deep.equal(expected);
        });

        it('should be able to invoke a user-defined function passed as an argument', async () => {
            var expr = jsonata("$myfunc([1,2,3], $myfunc2)");
            expr.registerFunction('myfunc', myfunc);
            expr.registerFunction('myfunc2', (arr) => {
                return 2 * arr[1];
            });
            var result = await expr.evaluate();
            var expected = 8;
            expect(result).to.deep.equal(expected);
        });

        it('should be able to return a function from a user-defined function', async () => {
            var expr = jsonata(`
            (
              $startsWithHello := $startsWith("Hello");
              [$startsWithHello("Hello, Bob"), $startsWithHello("Goodbye, Bill")]
            )`);
            expr.registerFunction('startsWith', startsWith);
            var result = await expr.evaluate();
            var expected = [true, false];
            expect(result).to.deep.equal(expected);
        });
    });

    describe('User defined generator function', () => {
        var myAddFunc = function*(val) {
            yield val + 10;
        };

        var myArrayFunc = function *() {
            yield [1,2,3];
        };

        var myObjectFunc = function* () {
            yield {
                downloads: [
                    {
                        downloads: 1,
                        day: "2016-09-01",
                    },
                    {
                        downloads: 2,
                        day: "2016-09-02",
                    },
                    {
                        downloads: 3,
                        day: "2016-09-03",
                    },
                    {
                        downloads: 1453,
                        day: "2017-03-10",
                    },
                    {
                        downloads: 1194,
                        day: "2017-03-11",
                    },
                    {
                        downloads: 988,
                        day: "2017-03-12",
                    },
                ],
            };
        };

        it('should be able to invoke a generator function returning a simple value', async () => {
            var expr = jsonata("$myAddFunc(1)");
            expr.registerFunction('myAddFunc', myAddFunc);

            var result = await expr.evaluate();

            expect(result).to.equal(11);
        });

        it('should be able to invoke a generator function and map over its return array value', async () => {
            var expr = jsonata("$myArrayFunc().{\"foo\": \"bar\"}");
            expr.registerFunction('myArrayFunc', myArrayFunc);

            var result = await expr.evaluate();

            expect(result).to.deep.equal([
                {
                    "foo": "bar"
                },
                {
                    "foo": "bar"
                },
                {
                    "foo": "bar"
                }
            ]);
        });

        it('should be able to invoke a generator function and map over its return object value', async () => {
            var expr = jsonata("$myObjectFunc().downloads{ $substring(day, 0, 7): $sum(downloads) }");
            expr.registerFunction('myObjectFunc', myObjectFunc);

            var result = await expr.evaluate();

            expect(result).to.deep.equal({ '2016-09': 6, '2017-03': 3635 });
        });
    });

    describe('User defined higher-order generator functions', () => {
        var myfunc = function*(arr, fn) {
            const val = yield* fn(arr);
            return 2 * val;
        };

        // FIXME:
        it('a higher-order generator function will not work', async () => {
            var expr = jsonata("$myfunc([1,2,3], $sum)");
            expr.registerFunction('myfunc', myfunc);
            try {
                await expr.evaluate();
            } catch (e) {
                expect(e.message).to.equal("yield* (intermediate value)(intermediate value) is not iterable");
            }
        });
    });
});

describe("Tests that are specific to a Javascript runtime", () => {
    // Javascript specific
    describe('/ab/ ("ab")', function() {
        it("should return result object", async function() {
            var expr = jsonata('/ab/ ("ab")');
            var result = await expr.evaluate();
            var expected = { match: "ab", start: 0, end: 2, groups: [] };
            expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
        });
    });

    describe("/ab/ ()", function() {
        it("should return result object", async function() {
            var expr = jsonata("/ab/ ()");
            var result = await expr.evaluate();
            var expected = undefined;
            expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
        });
    });

    describe('/ab+/ ("ababbabbcc")', function() {
        it("should return result object", async function() {
            var expr = jsonata('/ab+/ ("ababbabbcc")');
            var result = await expr.evaluate();
            var expected = { match: "ab", start: 0, end: 2, groups: [] };
            expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
        });
    });

    describe('/a(b+)/ ("ababbabbcc")', function() {
        it("should return result object", async function() {
            var expr = jsonata('/a(b+)/ ("ababbabbcc")');
            var result = await expr.evaluate();
            var expected = { match: "ab", start: 0, end: 2, groups: ["b"] };
            expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
        });
    });

    describe('/a(b+)/ ("ababbabbcc").next()', function() {
        it("should return result object", async function() {
            var expr = jsonata('/a(b+)/ ("ababbabbcc").next()');
            var result = await expr.evaluate();
            var expected = { match: "abb", start: 2, end: 5, groups: ["bb"] };
            expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
        });
    });

    describe('/a(b+)/ ("ababbabbcc").next().next()', function() {
        it("should return result object", async function() {
            var expr = jsonata('/a(b+)/ ("ababbabbcc").next().next()');
            var result = await expr.evaluate();
            var expected = { match: "abb", start: 5, end: 8, groups: ["bb"] };
            expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
        });
    });

    describe('/a(b+)/ ("ababbabbcc").next().next().next()', function() {
        it("should return result object", async function() {
            var expr = jsonata('/a(b+)/ ("ababbabbcc").next().next().next()');
            var result = await expr.evaluate();
            var expected = undefined;
            expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
        });
    });

    describe('/a(b+)/i ("Ababbabbcc")', function() {
        it("should return result object", async function() {
            var expr = jsonata('/a(b+)/i ("Ababbabbcc")');
            var result = await expr.evaluate();
            var expected = { match: "Ab", start: 0, end: 2, groups: ["b"] };
            expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
        });
    });

    describe("empty regex", function() {
        it("should throw error", function() {
            expect(function() {
                var expr = jsonata("//");
                expr.evaluate();
            })
                .to.throw()
                .to.deep.contain({ position: 1, code: "S0301" });
        });
    });

    describe("empty regex", function() {
        it("should throw error", function() {
            expect(function() {
                var expr = jsonata("/");
                expr.evaluate();
            })
                .to.throw()
                .to.deep.contain({ position: 1, code: "S0302" });
        });
    });

    describe("empty regex: Escaped termination", function() {
        it("should throw error", function() {
            expect(function() {
                var expr = jsonata("/\\/");
                expr.evaluate();
            })
                .to.throw()
                .to.deep.contain({ position: 3, code: "S0302" });
        });
    });

    describe("empty regex: Escaped termination", function() {
        it("should throw error", function() {
            expect(function() {
                var expr = jsonata("/\\\\\\/");
                expr.evaluate();
            })
                .to.throw()
                .to.deep.contain({ position: 5, code: "S0302" });
        });
    });

    describe("Functions - $match", function() {
        describe('$match("test escape \\\\", /\\\\/)', function() {
            it("should find \\", async function() {
                var expr = jsonata('$match("test escape \\\\", /\\\\/)');
                var result = await expr.evaluate();
                var expected = { match: "\\", index: 12, groups: []};
                expect(result).to.deep.equal(expected);
            });
        });

        describe('$match("ababbabbcc",/ab/)', function() {
            it("should return result object", async function() {
                var expr = jsonata('$match("ababbabbcc",/ab/)');
                var result = await expr.evaluate();
                var expected = [
                    { match: "ab", index: 0, groups: [] },
                    {
                        match: "ab",
                        index: 2,
                        groups: []
                    },
                    { match: "ab", index: 5, groups: [] }
                ];
                expect(result).to.deep.equal(expected);
            });
        });

        describe('$match("ababbabbcc",/a(b+)/)', function() {
            it("should return result object", async function() {
                var expr = jsonata('$match("ababbabbcc",/a(b+)/)');
                var result = await expr.evaluate();
                var expected = [
                    { match: "ab", index: 0, groups: ["b"] },
                    {
                        match: "abb",
                        index: 2,
                        groups: ["bb"]
                    },
                    { match: "abb", index: 5, groups: ["bb"] }
                ];
                expect(result).to.deep.equal(expected);
            });
        });

        describe('$match("ababbabbcc",/a(b+)/, 1)', function() {
            it("should return result object", async function() {
                var expr = jsonata('$match("ababbabbcc",/a(b+)/, 1)');
                var result = await expr.evaluate();
                var expected = { match: "ab", index: 0, groups: ["b"] };
                expect(result).to.deep.equal(expected);
            });
        });

        describe('$match("ababbabbcc",/a(b+)/, 0)', function() {
            it("should return result object", async function() {
                var expr = jsonata('$match("ababbabbcc",/a(b+)/, 0)');
                var result = await expr.evaluate();
                var expected = undefined;
                expect(result).to.deep.equal(expected);
            });
        });

        describe("$match(nothing,/a(xb+)/)", function() {
            it("should return result object", async function() {
                var expr = jsonata("$match(nothing,/a(xb+)/)");
                var result = await expr.evaluate();
                var expected = undefined;
                expect(result).to.deep.equal(expected);
            });
        });

        describe('$match("ababbabbcc",/a(xb+)/)', function() {
            it("should return result object", async function() {
                var expr = jsonata('$match("ababbabbcc",/a(xb+)/)');
                var result = await expr.evaluate();
                var expected = undefined;
                expect(result).to.deep.equal(expected);
            });
        });

        describe('$match("a, b, c, d", /ab/, -3)', function() {
            it("should throw error", function() {
                var expr = jsonata('$match("a, b, c, d", /ab/, -3)');
                expect(
                    expr.evaluate()
                ).to.eventually.be.rejected.to.deep.contain({
                    position: 7,
                    code: "D3040",
                    token: "match",
                    index: 3,
                    value: -3,
                });
            });
        });

        describe('$match("a, b, c, d", /ab/, null)', function() {
            it("should throw error", function() {
                var expr = jsonata('$match("a, b, c, d", /ab/, null)');
                expect(
                    expr.evaluate()
                ).to.eventually.be.rejected.to.deep.contain({
                    position: 7,
                    code: "T0410",
                    token: "match",
                    index: 3,
                    value: null,
                });
            });
        });

        describe('$match("a, b, c, d", /ab/, "2")', function() {
            it("should throw error", function() {
                var expr = jsonata('$match("a, b, c, d", /ab/, "2")');
                expect(
                    expr.evaluate()
                ).to.eventually.be.rejected.to.deep.contain({
                    position: 7,
                    code: "T0410",
                    token: "match",
                    index: 3,
                    value: "2",
                });
            });
        });

        describe('$match("a, b, c, d", "ab")', function() {
            it("should throw error", function() {
                var expr = jsonata('$match("a, b, c, d", "ab")');
                expect(
                    expr.evaluate()
                ).to.eventually.be.rejected.to.deep.contain({
                    position: 7,
                    code: "T0410",
                    token: "match",
                    index: 2,
                    value: "ab",
                });
            });
        });

        describe('$match("a, b, c, d", true)', function() {
            it("should throw error", function() {
                var expr = jsonata('$match("a, b, c, d", true)');
                expect(
                    expr.evaluate()
                ).to.eventually.be.rejected.to.deep.contain({
                    position: 7,
                    code: "T0410",
                    token: "match",
                    index: 2,
                    value: true,
                });
            });
        });

        describe("$match(12345, 3)", function() {
            it("should throw error", function() {
                var expr = jsonata("$match(12345, 3)");
                expect(
                    expr.evaluate()
                ).to.eventually.be.rejected.to.deep.contain({
                    position: 7,
                    code: "T0410",
                    token: "match",
                    index: 1,
                    value: 12345,
                });
            });
        });

        describe("$match(12345)", function() {
            it("should throw error", function() {
                var expr = jsonata("$match(12345)");
                expect(
                    expr.evaluate()
                ).to.eventually.be.rejected.to.deep.contain({
                    position: 7,
                    code: "T0410",
                    token: "match",
                    index: 1,
                });
            });
        });
    });

    describe("Expressions that attempt to access the object prototype", function() {
        const data = {"foo": {"bar": "baz"}};
        it("should ignore __proto__", async function() {
            const expr = jsonata('foo.__proto__');
            const result = await expr.evaluate(data);
            expect(result).to.deep.equal(undefined);
        });

        it("should throw an error trying to invoke toString()", async function() {
            const expr = jsonata('foo.toString()');
            expect(
                expr.evaluate(data)
            ).to.eventually.be.rejected.to.deep.contain({
                position: 13,
                code: "T1006",
            });
        });
    });

    describe("Expressions that attempt to pollute the object prototype", function() {
        it("should ignore __proto__", async function() {
            const expr = jsonata('{} ~> | __proto__ | {"is_admin": true} |');
            const result = await expr.evaluate();
            expect(result).to.deep.equal({});
        });
        it("should throw an error with __lookupGetter__", async function() {
            const expr = jsonata('{} ~> | __lookupGetter__("__proto__")() | {"is_admin": true} |');
            expect(
                expr.evaluate()
            ).to.eventually.be.rejected.to.deep.contain({
                position: 25,
                code: "T1006",
            });
        });
        it("should ignore constructor", async function() {
            const expr = jsonata('{} ~> | constructor | {"is_admin": true} |');
            const result = await expr.evaluate();
            expect(result).to.deep.equal({});
        });
    });
});

describe("Test that yield platform specific results", () => {
    // Platform specific
    describe("$sqrt(10) * $sqrt(10)", function() {
        it("should return result object", async function() {
            var expr = jsonata("$sqrt(10) * $sqrt(10)");
            var result = await expr.evaluate();
            var expected = 10;
            expect(result).to.be.closeTo(expected, 1e-13);
        });
    });
});

describe("Tests that include infinite recursion", () => {
    describe("stack overflow - infinite recursive function - non-tail call", function() {
        it("should throw error", function() {
            const options = {
                'timeout': 1000,
                'stack': 300
            }
            const expr = jsonata("($inf := function($n){$n+$inf($n-1)};  $inf(5))", options);
            expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
                token: "inf",
                position: 30,
                code: "D1011",
            });
        });
    });

    describe("stack overflow - infinite recursive function - tail call", function() {
        this.timeout(5000);
        it("should throw error", function() {
            const options = {
                'timeout': 1000,
                'stack': 500
            }
            const expr = jsonata("( $inf := function(){$inf()}; $inf())", options);
            expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
                token: "inf",
                code: "D1012",
            });
        });
    });

    describe("stack overflow - infinite recursive function - tail call (no stack guardrail)", function() {
        this.timeout(5000);
        it("should throw error", function() {
            const options = {
                'timeout': 1000
            }
            const expr = jsonata("( $inf := function(){$inf()}; $inf())", options);
            expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
                token: "inf",
                code: "D1012",
            });
        });
    });

    describe("guardrails on Ackermann function", function() {
        this.timeout(5000);
        const ackermann = (m, n) => `
        (
            $ack := function($m, $n) {
                $m = 0 ? $n + 1 :
                $n = 0 ? $ack($m - 1, 1) :
                $ack($m - 1, $ack($m, $n - 1))
            };

            $ack(${m}, ${n})
        )`;

        it("should complete for small parameters", async function() {
            const options = {
                'timeout': 1000,
                'stack': 500
            }
            const expr = jsonata(ackermann(3, 4), options);
            const result = await expr.evaluate();
            expect(result).to.equal(125);
        });

        it("larger inputs cause stack overflow", function() {
            const options = {
                'stack': 500
            }
            const expr = jsonata(ackermann(4, 4), options);
            expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
                token: "ack",
                code: "D1011",
            });
        });

        it("larger inputs cause stack overflow", function() {
            const options = {
                'stack': 500
            }
            const expr = jsonata(ackermann(4, 4), options);
            expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
                token: "ack",
                code: "D1011",
            });
        });
    });

    describe("guardrails on sequence length", function() {
        it("prevents large ranges", function() {
            const options = {
                'sequence': 1000
            }
            const expr = jsonata('[0..1001]', options);
            expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
                code: "D2015",
            });
        });

        it("prevents large intermediate sequences", function() {
            const options = {
                'sequence': 1000
            }
            const expr = jsonata('[0..100].([0..100]) ~> count()', options);
            expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
                code: "D2015",
            });
        });

        it("prevents appending large sequences", function() {
            const options = {
                'sequence': 1000
            }
            const expr = jsonata('$append([0..600], [0..600]) ~> $count()', options);
            expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
                code: "D2015",
            });
        });
    });
});

describe("Tests invalid object creation", () => {
    it("prevents creating an object mimicking a lambda", () => {
        const expr = jsonata('($lambda = {"_jsonata_lambda": true}; $lambda())');
        expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
                code: "D1013",
            });
    })
    it("prevents creating an object mimicking a function", () => {
        const expr = jsonata('($fn = {"_jsonata_function": true}; $fn())');
        expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
                code: "D1013",
            });
    })
})

describe("Tests that use internal frame push callbacks", () => {
    describe("frame push callback bound to expression", function()  {
        it("calls callback when new frame created", function(done) {
            var expr = jsonata("( )");
            expr.assign(Symbol.for('jsonata.__createFrame_push'), function(parentEnv, newEnv) {
                expect(parentEnv).to.not.equal(newEnv);
                expect(parentEnv).to.include.keys(['lookup', 'bind']);
                expect(newEnv).to.include.keys(['lookup', 'bind']);
                done();
            });
            expr.evaluate();
        });
    });
});

describe("Tests performance caches", () => {
    it("evicts cached number format pictures", async function() {
        var result;
        for(var ii = 0; ii <= 100; ii++) {
            var picture = "p".repeat(ii + 1) + "000";
            var expr = jsonata("$formatNumber(1, '" + picture + "')");
            result = await expr.evaluate();
        }
        expect(result).to.equal("p".repeat(101) + "001");
    });

    it("evicts cached date-time pictures", async function() {
        var result;
        for(var ii = 0; ii <= 100; ii++) {
            var suffix = "x".repeat(ii + 1);
            var picture = "[Y0001]-[M01]-[D01] " + suffix;
            var expr = jsonata("$fromMillis(0, '" + picture + "')");
            result = await expr.evaluate();
        }
        expect(result).to.equal("1970-01-01 " + "x".repeat(101));
    });
});

describe("Tests execution memoization", () => {
    var memoInput = {
        items: [
            {label: "label_0", text: "text_0", row: 0, value: 5},
            {label: "label_1", text: "text_1", row: 1, value: 4},
            {label: "label_2", text: "text_2", row: 2, value: 3},
            {label: "label_3", text: "text_3", row: 3, value: 2},
            {label: "label_4", text: "text_4", row: 4, value: 1}
        ]
    };

    it("memoizes repeated pure root paths inside a mapping", async function() {
        var expr = jsonata('items.{"count": $count($$.items[text != "" and text != "foo"].row)}');
        var measured = await countLookups("items", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result.map(function(item) {
            return item.count;
        })).to.deep.equal([5, 5, 5, 5, 5]);
        expect(measured.count).to.be.at.most(2);
    });

    it("memoizes root prefixes before local index suffixes", async function() {
        var expr = jsonata('items#$i.{"label": $$.items[$i].label}');
        var measured = await countLookups("items", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result.map(function(item) {
            return item.label;
        })).to.deep.equal(["label_0", "label_1", "label_2", "label_3", "label_4"]);
        expect(measured.count).to.be.at.most(2);
    });

    it("marks focus-independent numeric filter suffixes as optimizable", function() {
        var expr = jsonata('items#$i.{"label": $$.items[$i].label}');
        var ast = expr.ast();
        var predicate = ast.steps[1].lhs[0][1].steps[1].stages[0].expr;
        expect(hasSymbolDescription(predicate, "jsonata.indexedFilter")).to.equal(true);
    });

    it("does not mark focus-dependent filter suffixes as optimizable", function() {
        var expr = jsonata('items#$i.{"label": $$.items[row = $i].label}');
        var ast = expr.ast();
        var predicate = ast.steps[1].lhs[0][1].steps[1].stages[0].expr;
        expect(hasSymbolDescription(predicate, "jsonata.indexedFilter")).to.equal(false);
    });

    it("preserves computed numeric filter suffixes", async function() {
        var expr = jsonata('items#$i.{"label": $$.items[$i + 1].label}');
        var result = await expr.evaluate(memoInput);
        expect(result).to.deep.equal([
            {label: "label_1"},
            {label: "label_2"},
            {label: "label_3"},
            {label: "label_4"},
            {}
        ]);
    });

    it("preserves numeric array filter suffixes", async function() {
        var expr = jsonata('items#$i.{"labels": $$.items[[$i, $i + 1]].label}');
        var result = await expr.evaluate(memoInput);
        expect(result).to.deep.equal([
            {labels: ["label_0", "label_1"]},
            {labels: ["label_1", "label_2"]},
            {labels: ["label_2", "label_3"]},
            {labels: ["label_3", "label_4"]},
            {labels: "label_4"}
        ]);
    });

    it("does not evaluate indexed filter suffixes for empty input", async function() {
        var expr = jsonata('[][$i]');
        var result = await expr.evaluate();
        expect(result).to.equal(undefined);
    });

    it("preserves boolean semantics for nonnumeric indexed filter variables", async function() {
        var expr = jsonata('($selector := "all"; items.{"labels": $$.items[$selector].label})');
        var result = await expr.evaluate(memoInput);
        expect(result.map(function(item) {
            return item.labels;
        })).to.deep.equal([
            ["label_0", "label_1", "label_2", "label_3", "label_4"],
            ["label_0", "label_1", "label_2", "label_3", "label_4"],
            ["label_0", "label_1", "label_2", "label_3", "label_4"],
            ["label_0", "label_1", "label_2", "label_3", "label_4"],
            ["label_0", "label_1", "label_2", "label_3", "label_4"]
        ]);
    });

    it("preserves falsey semantics for nonnumeric indexed filter variables", async function() {
        var expr = jsonata('($selector := ""; items.{"labels": $$.items[$selector].label})');
        var result = await expr.evaluate(memoInput);
        expect(result.map(function(item) {
            return Object.keys(item).length;
        })).to.deep.equal([0, 0, 0, 0, 0]);
    });

    it("disables indexed filter optimization when evaluator callbacks are registered", async function() {
        var expr = jsonata('items#$i.{"label": $$.items[$i].label}');
        var predicateEvaluations = 0;
        expr.assign(Symbol.for('jsonata.__evaluate_entry'), function(expr) {
            if(expr.type === "variable" && expr.value === "i") {
                predicateEvaluations++;
            }
        });
        var result = await expr.evaluate(memoInput);
        expect(result).to.deep.equal([
            {label: "label_0"},
            {label: "label_1"},
            {label: "label_2"},
            {label: "label_3"},
            {label: "label_4"}
        ]);
        expect(predicateEvaluations).to.equal(25);
    });

    it("memoizes deterministic filtered root prefixes before local index suffixes", async function() {
        var expr = jsonata('items#$i.{"text": $$.items[text != ""][$i].text}');
        var measured = await countLookups("items", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result.map(function(item) {
            return item.text;
        })).to.deep.equal(["text_0", "text_1", "text_2", "text_3", "text_4"]);
        expect(measured.count).to.be.at.most(2);
    });

    it("memoizes root prefixes before unsafe wildcard suffixes", async function() {
        var expr = jsonata('items.{"values": $$.items.*}');
        var measured = await countLookups("items", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result[0].values.slice(0, 4)).to.deep.equal(["label_0", "text_0", 0, 5]);
        expect(measured.count).to.be.at.most(2);
    });

    it("reuses cached raw array root path values", async function() {
        var expr = jsonata('items.{"all": $$.items}');
        var measured = await countLookups("items", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result[0].all.length).to.equal(memoInput.items.length);
        expect(measured.count).to.be.at.most(2);
    });

    it("reuses cached undefined root path prefixes", async function() {
        var expr = jsonata('items.{"missing": $$.missing.foo}');
        var measured = await countLookups("missing", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result.map(function(item) {
            return Object.keys(item).length;
        })).to.deep.equal([0, 0, 0, 0, 0]);
        expect(measured.count).to.be.at.most(1);
    });

    it("returns early when a local suffix stage empties a cached root prefix", async function() {
        var expr = jsonata('items#$i.{"none": $$.items[$i > 100].label}');
        var measured = await countLookups("items", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result.map(function(item) {
            return Object.keys(item).length;
        })).to.deep.equal([0, 0, 0, 0, 0]);
        expect(measured.count).to.be.at.most(2);
    });

    it("stops suffix evaluation when a later step is empty", async function() {
        var expr = jsonata('items#$i.{"none": $$.items[$i].missing}');
        var measured = await countLookups("items", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result.map(function(item) {
            return Object.keys(item).length;
        })).to.deep.equal([0, 0, 0, 0, 0]);
        expect(measured.count).to.be.at.most(2);
    });

    it("does not memoize predicates that call registered functions", async function() {
        var predicateCalls = 0;
        var expr = jsonata('items.{"count": $count($$.items[$accept(text)].row)}');
        expr.registerFunction("accept", function() {
            predicateCalls++;
            return true;
        });
        var result = await expr.evaluate(memoInput);
        expect(result.map(function(item) {
            return item.count;
        })).to.deep.equal([5, 5, 5, 5, 5]);
        expect(predicateCalls).to.equal(25);
    });

    it("does not treat grouped sort terms as pure", function() {
        var expr = jsonata('items^(<items{label: value})');
        return expect(expr.evaluate(memoInput)).to.eventually.be.rejected.to.deep.contain({
            code: "T2008"
        });
    });

    it("does not memoize filter predicates with wildcard path steps", async function() {
        var input = {
            items: [
                {text: {value: "x"}, row: 0},
                {text: {value: "y"}, row: 1}
            ]
        };
        var expr = jsonata('items.{"x": $$.items[text.* = "x"].row}');
        var result = await expr.evaluate(input);
        expect(result.map(function(item) {
            return item.x;
        })).to.deep.equal([0, 0]);
    });

    it("memoizes filter predicates with pure staged relative paths", async function() {
        var input = {
            items: [
                {text: [{value: "x"}], row: 0},
                {text: [{value: "y"}], row: 1}
            ]
        };
        var expr = jsonata('items.{"x": $$.items[text[value = "x"].value = "x"].row}');
        var result = await expr.evaluate(input);
        expect(result.map(function(item) {
            return item.x;
        })).to.deep.equal([0, 0]);
    });

    it("marks deterministic field paths for fast evaluation", function() {
        var expr = jsonata('items[text != "" and value > 2].row');
        expect(hasSymbolDescription(expr.ast(), "jsonata.fastPath")).to.equal(true);
    });

    it("fast-evaluates pure field paths without generic lookup dispatch", async function() {
        var expr = jsonata('items[text != "" and value > 2].row');
        var measured = await countLookups("text", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result).to.deep.equal([0, 1, 2]);
        expect(measured.count).to.equal(0);
    });

    it("fast-evaluates literal index filters without generic lookup dispatch", async function() {
        var expr = jsonata('items[[0, 2]].label');
        var measured = await countLookups("label", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result).to.deep.equal(["label_0", "label_2"]);
        expect(measured.count).to.equal(0);
    });

    it("uses normal path evaluation when internal callbacks are registered", async function() {
        var expr = jsonata('items[text != "" and value > 2].row');
        var entries = 0;
        expr.assign(Symbol.for('jsonata.__evaluate_entry'), function(expr) {
            if(expr.type === "name" && expr.value === "text") {
                entries++;
            }
        });
        var measured = await countLookups("text", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result).to.deep.equal([0, 1, 2]);
        expect(measured.count).to.equal(5);
        expect(entries).to.equal(5);
    });

    it("uses normal memoized path prefix evaluation when stack guardrails are active", async function() {
        var expr = jsonata('items.{"count": $count($$.items[text != ""].row)}', {stack: 100});
        var measured = await countLookups("text", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result.map(function(item) {
            return item.count;
        })).to.deep.equal([5, 5, 5, 5, 5]);
        expect(measured.count).to.equal(5);
    });

    it("uses normal partial memoized path prefix evaluation when stack guardrails are active", async function() {
        var expr = jsonata('items.{"count": $count($$.items[text != ""][$accept(text)].row)}', {stack: 100});
        expr.registerFunction("accept", function() {
            return true;
        });
        var result = await expr.evaluate(memoInput);
        expect(result.map(function(item) {
            return item.count;
        })).to.deep.equal([5, 5, 5, 5, 5]);
    });

    it("stops normal memoized path prefix evaluation when stack guardrail fallback is empty", async function() {
        var expr = jsonata('items.{"missing": $$.missing.foo}', {stack: 100});
        var result = await expr.evaluate(memoInput);
        expect(result.map(function(item) {
            return Object.keys(item).length;
        })).to.deep.equal([0, 0, 0, 0, 0]);
    });

    it("fast-evaluates nested literal index arrays", async function() {
        var expr = jsonata('items[[[0, 2]]].label');
        var result = await expr.evaluate(memoInput);
        expect(result).to.deep.equal(["label_0", "label_2"]);
    });

    it("fast-evaluates boolean or predicates", async function() {
        var expr = jsonata('items[value = 1 or value = 5].label');
        var result = await expr.evaluate(memoInput);
        expect(result).to.deep.equal(["label_0", "label_4"]);
    });

    it("fast-evaluates less-than predicates", async function() {
        var expr = jsonata('items[value < 3 and value <= 2].label');
        var result = await expr.evaluate(memoInput);
        expect(result).to.deep.equal(["label_3", "label_4"]);
    });

    it("decorates errors from fast path predicates", async function() {
        var expr = jsonata('items[text > value].label');
        await expect(expr.evaluate(memoInput)).to.eventually.be.rejected.to.deep.contain({
            code: "T2009",
            token: ">"
        });
    });

    it("fast-evaluates array values selected by literal indexes", async function() {
        var expr = jsonata('items[0]');
        var result = await expr.evaluate({items: [[1, 2], [3, 4]]});
        expect(result).to.deep.equal([1, 2]);
    });

    it("fast-evaluates array-valued path comparisons", async function() {
        var expr = jsonata('items[tags = ["x", "y"]].label');
        var result = await expr.evaluate({
            items: [
                {tags: ["x", "y"], label: "xy"},
                {tags: ["x"], label: "x"},
                {tags: ["z", "y"], label: "zy"}
            ]
        });
        expect(result).to.equal("xy");
    });

    it("fast-evaluates multi-value path predicates", async function() {
        var expr = jsonata('items[tags.value].label');
        var result = await expr.evaluate({
            items: [
                {tags: [{value: "x"}, {value: "y"}], label: "multi"},
                {tags: [], label: "empty"}
            ]
        });
        expect(result).to.equal("multi");
    });

    it("preserves internal sequence arrays during fast path lookup", async function() {
        var sequence = [{value: "x"}];
        sequence.cons = true;
        var expr = jsonata('items.value');
        var result = await expr.evaluate({items: [sequence]});
        expect(result).to.equal(undefined);
    });

    it("fast-evaluates numeric predicate results", async function() {
        var expr = jsonata('items[value].label');
        var result = await expr.evaluate({
            items: [
                {value: 0, label: "first"},
                {value: -1, label: "second"}
            ]
        });
        expect(result).to.deep.equal(["first", "second"]);
    });

    it("skips undefined entries in fast-evaluated literal index arrays", async function() {
        var expr = jsonata('items[[missing, 0]].label');
        var result = await expr.evaluate(memoInput);
        expect(result).to.equal("label_0");
    });

    it("does not memoize filter predicates with local-variable stages", async function() {
        var input = {
            items: [
                {text: ["x"], row: 0},
                {text: ["y", "x"], row: 1}
            ]
        };
        var expr = jsonata('items#$i.{"x": $$.items[text[$i] = "x"].row}');
        var result = await expr.evaluate(input);
        expect(result.map(function(item) {
            return item.x;
        })).to.deep.equal([0, 1]);
    });

    it("disables root-path memoization when evaluator callbacks are registered", async function() {
        var expr = jsonata('items.{"count": $count($$.items[text != ""].row)}');
        var entries = 0;
        expr.assign(Symbol.for('jsonata.__evaluate_entry'), function() {
            entries++;
        });
        var measured = await countLookups("items", function() {
            return expr.evaluate(memoInput);
        });
        expect(entries).to.be.greaterThan(0);
        expect(measured.count).to.equal(6);
    });

    it("precomputes pure sort keys once per input item", async function() {
        var expr = jsonata('items^(<value)');
        var measured = await countLookups("value", function() {
            return expr.evaluate(memoInput);
        });
        expect(measured.result.map(function(item) {
            return item.value;
        })).to.deep.equal([1, 2, 3, 4, 5]);
        expect(measured.count).to.be.at.most(memoInput.items.length);
    });

    it("does not precompute impure sort keys", async function() {
        var keyCalls = 0;
        var expr = jsonata('items^(<$key(value))');
        expr.registerFunction("key", function(value) {
            keyCalls++;
            return value;
        });
        var result = await expr.evaluate(memoInput);
        expect(result.map(function(item) {
            return item.value;
        })).to.deep.equal([1, 2, 3, 4, 5]);
        expect(keyCalls).to.be.greaterThan(memoInput.items.length);
    });
});

describe("Tests optimized helper branches", () => {
    it("detects non-array values in string array checks", function() {
        expect(utils.isArrayOfStrings("not an array")).to.equal(false);
    });

    it("passes JSONata lambdas directly to native higher-order functions", async function() {
        var originalApply = Function.prototype.apply;
        var wrappedLambdaApplyCalls = 0;
        var result;
        try {
            Function.prototype.apply = function(self, args) {
                if(Object.prototype.hasOwnProperty.call(this, "arity")) {
                    wrappedLambdaApplyCalls++;
                }
                return originalApply.call(this, self, args);
            };
            var expr = jsonata('$filter([1, 2, 3, 4], function($v){$v % 2 = 0})');
            result = await expr.evaluate();
        } finally {
            Function.prototype.apply = originalApply;
        }
        expect(result).to.deep.equal([2, 4]);
        expect(wrappedLambdaApplyCalls).to.equal(0);
    });

    it("uses direct callback hooks in native higher-order functions", async function() {
        var directCallbackSymbol = Symbol.for('jsonata.__direct_callback');
        var focus = {
            createSequence: function() {
                var result = [];
                result.sequence = true;
                return result;
            }
        };
        var filterCalls = [];
        var filterCallback = {
            arity: 3,
            invoke: function(value, index, array) {
                filterCalls.push([value, index, array.length]);
                return value > 1;
            },
            apply: function() {
                throw new Error("direct callback hook was not used");
            }
        };
        filterCallback[directCallbackSymbol] = true;
        var filterResult = await functions.filter.call(focus, [1, 2, 3], filterCallback);
        expect(filterResult).to.deep.equal([2, 3]);
        expect(filterCalls).to.deep.equal([[1, 0, 3], [2, 1, 3], [3, 2, 3]]);

        var reduceCalls = [];
        var reduceCallback = {
            arity: 4,
            invoke: function(accumulator, value, index, array) {
                reduceCalls.push([accumulator, value, index, array.length]);
                return accumulator + value;
            },
            apply: function() {
                throw new Error("direct reduce callback hook was not used");
            }
        };
        reduceCallback[directCallbackSymbol] = true;
        var reduceResult = await functions.foldLeft([1, 2, 3], reduceCallback, 0);
        expect(reduceResult).to.equal(6);
        expect(reduceCalls).to.deep.equal([[0, 1, 0, 3], [1, 2, 1, 3], [3, 3, 2, 3]]);
    });

    it("passes optional arguments to native JavaScript higher-order callbacks", async function() {
        var expr = jsonata('$map([10, 20], $callback)');
        expr.assign("callback", function(value, index, array) {
            return value + index + array[0];
        });
        var result = await expr.evaluate();
        expect(result).to.deep.equal([20, 31]);
    });

    it("does not treat JavaScript callback invoke properties as internal hooks", async function() {
        var expr = jsonata('$map([1, 2], $callback)');
        var callback = function(value) {
            return value + 1;
        };
        callback.invoke = function() {
            throw new Error("public invoke property should not be used");
        };
        expr.assign("callback", callback);
        var result = await expr.evaluate();
        expect(result).to.deep.equal([2, 3]);
    });

    it("fast-evaluates simple comparison callbacks", async function() {
        var expr = jsonata('$filter([1, 2, 3], function($v){$v > 1})');
        var result = await expr.evaluate();
        expect(result).to.deep.equal([2, 3]);
    });

    it("fast-evaluates remaining simple binary callback operators", async function() {
        var expr = jsonata('[$map([4], function($v){$v - 1}), $map([4], function($v){$v * 2}), $map([4], function($v){$v / 2}), $filter([1], function($v){$v != 2}), $filter([1], function($v){$v < 2}), $filter([1], function($v){$v <= 1}), $filter([2], function($v){$v >= 2})]');
        var result = await expr.evaluate();
        expect(result).to.deep.equal([3, 8, 2, 1, 1, 1, 2]);
    });

    it("preserves zero-argument map callback semantics", async function() {
        var expr = jsonata('$map([1, 2], function(){1})');
        var result = await expr.evaluate();
        expect(result).to.deep.equal([1, 1]);
    });

    it("falls back for unsupported fast callback operators", async function() {
        var expr = jsonata('$map(["a"], function($v){$v & "b"})');
        var result = await expr.evaluate();
        expect(result).to.deep.equal("ab");
    });

    it("preserves four-argument reduce callback semantics", async function() {
        var expr = jsonata('$reduce([1, 2, 3], function($a, $v, $i, $arr){$a + $arr[$i]}, 0)');
        var result = await expr.evaluate();
        expect(result).to.equal(6);
    });

    it("decorates errors from fast-evaluated callbacks", async function() {
        var expr = jsonata('$map(["x"], function($v){$v + 1})');
        await expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
            code: "T2001",
            token: "+"
        });
    });

    it("validates signed lambdas passed to native higher-order functions", async function() {
        var expr = jsonata('$map([1, 2], function($v)<n:n>{$v + 1})');
        var result = await expr.evaluate();
        expect(result).to.deep.equal([2, 3]);

        expr = jsonata('$map(["x"], function($v)<n:n>{$v})');
        await expect(expr.evaluate()).to.eventually.be.rejected.to.deep.contain({
            code: "T0410"
        });
    });

    it("uses normal lambda evaluation when internal callbacks are registered", async function() {
        var expr = jsonata('$filter([1, 2, 3], function($v){$v > 1})');
        var entries = 0;
        var frames = 0;
        expr.assign(Symbol.for('jsonata.__evaluate_entry'), function() {
            entries++;
        });
        expr.assign(Symbol.for('jsonata.__createFrame_push'), function() {
            frames++;
        });
        var result = await expr.evaluate();
        expect(result).to.deep.equal([2, 3]);
        expect(entries).to.be.greaterThan(0);
        expect(frames).to.be.greaterThan(0);
    });

    it("ignores inherited keys when casting an object to boolean", async function() {
        var input = Object.create({inherited: true});
        var expr = jsonata("$boolean($)");
        var result = await expr.evaluate(input);
        expect(result).to.equal(false);
    });

    it("enforces sequence limits while accumulating grouped values", function() {
        var expr = jsonata('arr{"a": $}', {sequence: 2});
        expect(expr.evaluate({arr: [1, 2, 3]})).to.eventually.be.rejected.to.deep.contain({
            code: "D2015"
        });
    });

    it("accumulates grouped values within sequence limits", async function() {
        var expr = jsonata('arr{"a": $}', {sequence: 3});
        var result = await expr.evaluate({arr: [1, 2, 3]});
        expect(result).to.deep.equal({a: [1, 2, 3]});
    });

    it("accumulates grouped array values", async function() {
        var expr = jsonata('arr{"a": $}');
        var result = await expr.evaluate({arr: [[1], [2], [3]]});
        expect(result).to.deep.equal({a: [1, 2, 3]});
    });

    it("fast-formats the common grouped decimal picture", function() {
        expect(functions.formatNumber(1234.5, "#,##0.00")).to.equal("1,234.50");
        expect(functions.formatNumber(123456.7, "#,##0.00")).to.equal("123,456.70");
        expect(functions.formatNumber(-1234.5, "#,##0.00")).to.equal("-1,234.50");
        expect(functions.formatNumber(-0.004, "#,##0.00")).to.equal("0.00");
        expect(functions.formatNumber(1e21, "#,##0.00")).to.equal(functions.formatNumber(1e21, "#,##0.00", {}));
    });

    it("fast-formats the exact ISO date-time picture", async function() {
        var picture = "[Y0001]-[M01]-[D01]T[H01]:[m01]:[s01].[f001][Z01:01t]";
        expect(datetime.toMillis("2020-01-02T03:04:05.006Z", picture)).to.equal(undefined);
        expect(datetime.fromMillis(1577934245006, picture)).to.equal("2020-01-02T03:04:05.006Z");
        var expr = jsonata("[$fromMillis(1577934245006, picture)]");
        var result = await expr.evaluate({}, {picture: picture});
        expect(result).to.deep.equal(["2020-01-02T03:04:05.006Z"]);
    });

    it("sorts without recursive slice allocations", async function() {
        var originalSlice = Array.prototype.slice;
        var sliceCalls = 0;
        try {
            Array.prototype.slice = function() {
                sliceCalls++;
                return originalSlice.apply(this, arguments);
            };
            var result = await functions.sort([5, 3, 4, 1, 2]);
            expect(result).to.deep.equal([1, 2, 3, 4, 5]);
        } finally {
            Array.prototype.slice = originalSlice;
        }
        expect(sliceCalls).to.equal(0);
    });
});
