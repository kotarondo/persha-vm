// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

'use strict'

process.chdir(__dirname)

global.fs = require('fs')
global.VM = require('../index.js')
global.ExternalObject = VM.ExternalObject

var exit_code = 1

process.on('beforeExit', function() {
    if (exit_code) {
        console.log("NG: unexpectedly exits")
        process.exit(exit_code)
    }
})

global.test_success = function() {
    exit_code = 0
    console.log("OK")
}

global.assert = function(expr, msg) {
    if (!expr) {
        var err = new Error("NG: assert failed:" + msg)
        debugger
        throw err
    }
}

global.assert_equals = function(act, exp) {
    assert(act === exp, "actual: " + act + " expected: " + exp)
}
