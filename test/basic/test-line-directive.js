// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

var results = [];
var expected = [];

try {
    eval("var var");
} catch (err) {
    results.push(err.stack.split('\n')[1]);
}
expected.push("    at test-line-directive.js:9:5");

results.push(new Error().stack.split('\n')[1]);
expected.push("    at test-line-directive.js:15:1");

//#line 100  "testfile.js"
results.push(new Error().stack.split('\n')[1]);
expected.push("    at testfile.js:100:1");

//#line 200  "testfile  .js"
try {
    eval("var var");
} catch (err) {
    results.push(err.stack.split('\n')[1]);
}
expected.push("    at testfile  .js:201:5");

//#line 20 this is not a file name
try {
    eval("var var");
} catch (err) {
    results.push(err.stack.split('\n')[1]);
}
expected.push("    at testfile  .js:21:5");

/* */ //#line 1000 this is not a line directive
results.push(new Error().stack.split('\n')[1]);
expected.push("    at testfile  .js:28:1");

try {
    eval('//#line 100 "eval-test"\nvar var');
} catch (err) {
    results.push(err.stack.split('\n')[0]);
}
expected.push("SyntaxError: eval-test:100:5");

[results, expected, "DONE"];
