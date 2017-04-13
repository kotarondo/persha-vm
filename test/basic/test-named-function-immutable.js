// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

var results = [];
var expected = [];

results.push(1 !== function n() {
    n = 1;
    return n
}());
expected.push(true);

try {
    var r = function n() {
        'use strict';
        n = 1;
        return n
    }();
} catch (e) {
    var r = e instanceof TypeError;
}
results.push(r);
expected.push(true);

[results, expected, "DONE"];
