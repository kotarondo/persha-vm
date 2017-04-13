// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

var results = [];
var expected = [];

for (var c = 0; c < 3; c++) {
    continue;
}

results.push(c);
expected.push(3);

[results, expected, "DONE"];
