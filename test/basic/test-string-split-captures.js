// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

var results = [];
var expected = [];

results.push("abc".split(/b/));
expected.push(['a', 'c']);
results.push("abc".split(/(b)/));
expected.push(['a', 'b', 'c']);
results.push("abc".split(/b|(b)/));
expected.push(['a', undefined, 'c']);
results.push("abc".split(/x|(b)|(x)/));
expected.push(['a', 'b', undefined, 'c']);

[results, expected, "DONE"];
