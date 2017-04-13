// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

require('./harness')

var vm = new VM()
vm.initialize()
vm.evaluateProgram("setSystemHandler('echo', function(x){return x})")

var x0 = vm.callSystemHandler('echo', undefined)
var x1 = vm.callSystemHandler('echo', null)
var x2 = vm.callSystemHandler('echo', 123456789)
var x3 = vm.callSystemHandler('echo', '123456789a')
var x4 = vm.callSystemHandler('echo', [0, 1])
var x5 = vm.callSystemHandler('echo', { a: 0, b: 1 })
var x6 = vm.callSystemHandler('echo', new Number(100))
var x7 = vm.callSystemHandler('echo', new String('abc'))
var x8 = vm.callSystemHandler('echo', new Boolean(false))
var x9 = vm.callSystemHandler('echo', new Date(0))
var x10 = vm.callSystemHandler('echo', new RegExp('abc+', 'gmi'))
var x11 = vm.callSystemHandler('echo', new Buffer('abc'))
var x12 = vm.callSystemHandler('echo', [true, false])
var x13 = vm.callSystemHandler('echo', function(a, b, c) {})
var x14 = vm.callSystemHandler('echo', new Error('abc'))
var x15 = vm.callSystemHandler('echo', new TypeError('abc1'))
var x16 = vm.callSystemHandler('echo', new ReferenceError('abc2'))
var x17 = vm.callSystemHandler('echo', new RangeError('abc3'))
var x18 = vm.callSystemHandler('echo', new SyntaxError('abc4'))
var x19 = vm.callSystemHandler('echo', new URIError('abc5'))
var x20 = vm.callSystemHandler('echo', new EvalError('abc6'))
var x21 = vm.callSystemHandler('echo', [{ a: 1, b: { c: 3 } }, , [, 7], ])

assert(typeof x0 === 'undefined')
assert(typeof x1 === 'object')
assert(typeof x2 === 'number')
assert(typeof x3 === 'string')
assert(x4 instanceof Array)
assert(x5 instanceof Object)
assert(x6 instanceof Number)
assert(x7 instanceof String)
assert(x8 instanceof Boolean)
assert(x9 instanceof Date)
assert(x10 instanceof RegExp)
assert(x11 instanceof Buffer)
assert(typeof x12[0] === 'boolean')
assert(typeof x12[1] === 'boolean')
assert(x14 instanceof Error)
assert(x15 instanceof TypeError)
assert(x16 instanceof ReferenceError)
assert(x17 instanceof RangeError)
assert(x18 instanceof SyntaxError)
assert(x19 instanceof URIError)
assert(x20 instanceof EvalError)

assert_equals(x0, undefined)
assert_equals(x1, null)
assert_equals(x2, 123456789)
assert_equals(x3, '123456789a')
assert_equals(x4.toString(), '0,1')
assert_equals(x5.toString(), '[object Object]')
assert_equals(JSON.stringify(x5), '{"a":0,"b":1}')
assert_equals(x6.toString(), '100')
assert_equals(x7.toString(), 'abc')
assert_equals(x8.toString(), 'false')
assert_equals(x9.toString(), new Date(0).toString())
assert(x10.toString().match(/\/abc\+\/[gmi]{3,3}/))
assert_equals(x11.toString(), 'abc')
assert_equals(x12.toString(), 'true,false')
assert_equals(x14.toString(), 'Error: abc')
assert_equals(x15.toString(), 'TypeError: abc1')
assert_equals(x16.toString(), 'ReferenceError: abc2')
assert_equals(x17.toString(), 'RangeError: abc3')
assert_equals(x18.toString(), 'SyntaxError: abc4')
assert_equals(x19.toString(), 'URIError: abc5')
assert_equals(x20.toString(), 'EvalError: abc6')
assert_equals(JSON.stringify(x21), '[{"a":1,"b":{"c":3}},null,[null,7]]')

test_success()