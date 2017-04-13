// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

require('./harness')
process.chdir("v8bench")

var vm = new VM()
vm.initialize()
vm.setCustomFunction("print", console.log)
vm.evaluateProgram("print=new OpaqueFunction('print')")


function load(f) {
    vm.evaluateProgram(fs.readFileSync(f).toString(), f)
}

load('base.js')

load('richards.js')
load('deltablue.js')
load('crypto.js')
load('raytrace.js')
load('earley-boyer.js')
load('regexp.js')
load('splay.js')
load('navier-stokes.js')

load("run.js")

test_success()
