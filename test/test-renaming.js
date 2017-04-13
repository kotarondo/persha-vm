// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

var global_names = Object.getOwnPropertyNames(global)
var global_names = global_names.concat("fs", "VM", "ExternalObject", "test_success", "assert", "assert_equals");

require('./harness')

Object.getOwnPropertyNames(global).forEach(function(e) {
    assert(e.indexOf("_pershavm") === 0 || global_names.indexOf(e) >= 0, e)
})

var vm1 = new VM()
vm1.initialize()
var value = vm1.evaluateProgram("test=1")
assert_equals(value, 1)

Object.getOwnPropertyNames(global).forEach(function(e) {
    assert(e.indexOf("_pershavm") === 0 || global_names.indexOf(e) >= 0, e)
})

var vm2 = new VM()
vm2.initialize()
try {
    vm2.evaluateProgram("test")
    assert(false, "must throw ReferenceError")
} catch (err) {
    assert(err instanceof ReferenceError)
}

Object.getOwnPropertyNames(global).forEach(function(e) {
    assert(e.indexOf("_pershavm") === 0 || global_names.indexOf(e) >= 0, e)
})

var value = vm1.evaluateProgram("++test")
assert_equals(value, 2)

Object.getOwnPropertyNames(global).forEach(function(e) {
    assert(e.indexOf("_pershavm") === 0 || global_names.indexOf(e) >= 0, e)
})

test_success()
