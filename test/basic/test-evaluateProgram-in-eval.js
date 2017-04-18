// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

var results = [];
var expected = [];

var r = function(x) { return eval("evaluateProgram('var x=1'); x") }(0);

results.push(r);
expected.push(0);

[results, expected, "DONE"];
