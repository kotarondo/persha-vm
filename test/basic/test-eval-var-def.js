// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

var results = [];
var expected = [];

var x1 = "a";
var x2 = "b";
var x3 = "c";
var x4 = "d";

void

function() {
    var x1 = 1;
    eval("var x2=2;");
    var x3 = 3;
    eval("var x4=4;");

    results.push(delete x1);
    expected.push(false);
    results.push(x1);
    expected.push(1);

    results.push(delete x2);
    expected.push(true);
    results.push(x2);
    expected.push("b");

    results.push(eval("delete x3"));
    expected.push(false);
    results.push(x3);
    expected.push(3);

    results.push(eval("delete x4"));
    expected.push(true);
    results.push(x4);
    expected.push("d");
}();

results.push(x1);
expected.push("a");
results.push(x2);
expected.push("b");
results.push(x3);
expected.push("c");
results.push(x4);
expected.push("d");

[results, expected, "DONE"];
