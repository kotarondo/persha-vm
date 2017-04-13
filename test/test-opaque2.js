// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

require('./harness')

var vm = new VM()
vm.initialize()

function Test(a, b) {
    this.a = a
    this.b = b
}

vm.setCustomFunction('Test', Test)
vm.evaluateProgram("var Test = new OpaqueFunction('Test')")

var x = vm.evaluateProgram("x = new Test(1, 'c')")
assert_equals(JSON.stringify(x), '{"a":1,"b":"c"}')

var xa = vm.evaluateProgram("x.a")
assert_equals(xa, undefined)

var xb = vm.evaluateProgram("x.b=2;x.b")
assert_equals(xb, 2)

var x2 = vm.evaluateProgram("x")
assert_equals(JSON.stringify(x2), '{"a":1,"b":"c"}')

function Test2(a, b) {
    var opaque = this.opaque
    opaque.a = a
    opaque.b = b
}

vm.setCustomFunction('Test2', Test2)
vm.evaluateProgram("var Test2 = new OpaqueFunction('Test2', '', true)")

var x = vm.evaluateProgram("x = new Test2(1, 'c')")
assert_equals(JSON.stringify(x), '{}')
assert_equals(JSON.stringify(x.opaque), '{"a":1,"b":"c"}')

var xa = vm.evaluateProgram("x.a")
assert_equals(xa, undefined)

var xb = vm.evaluateProgram("x.b=2;x.b")
assert_equals(xb, 2)

var x2 = vm.evaluateProgram("x")
assert_equals(JSON.stringify(x2), '{"b":2}')
assert_equals(JSON.stringify(x2.opaque), '{"a":1,"b":"c"}')

function apply(f, args) {
    return f.apply(this, args)
}

var res3

function test3(a, b) {
    res3 = [b, a]
    return res3
}

vm.evaluateProgram("setSystemHandler('register', function(name, f){this[name]=f})")
vm.callSystemHandler('register', 'test3', new ExternalObject(test3))
vm.setCustomFunction('apply', apply)
vm.evaluateProgram("var apply = new OpaqueFunction('apply')")
var x3 = vm.evaluateProgram("apply(test3, [3, 'c'])")
assert_equals(JSON.stringify(x3), '["c",3]')
assert_equals(JSON.stringify(res3), '["c",3]')

test_success()
