// Copyright (c) 2018, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

require('./harness')

var vm = new VM()
vm.initialize()
vm.setCustomFunction('echo', function(x) { return x })
vm.evaluateProgram(`setSystemProperty("stepsLimit", 100000);for(var i=0;i<10;i++);`);


function test_limit(code, limit) {
    try {
        vm.evaluateProgram(`setSystemProperty("stepsLimit", ${limit||100000});\n${code}`);
        assert(false);
    } catch (err) {
        assert(err instanceof RangeError);
        assert(err.message === "steps overflow");
    }
}

test_limit(`void function(){for(;;);}()`);
test_limit(`void function(){for(;;)continue;}()`);
test_limit(`void function(){for(var i;;);}()`);
test_limit(`void function(){while(1);}()`);
test_limit(`void function(){do;while(1);}()`);
test_limit(`void function f(){f()}()`, 1000);

test_success()
