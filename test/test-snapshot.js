// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

require('./harness')

function stream() {
    this.buffer = []
    this.index = 0
}

stream.prototype.readInt =
    stream.prototype.readString =
    stream.prototype.readBuffer =
    stream.prototype.readNumber = function() {
        return this.buffer[this.index++]
    }

stream.prototype.writeInt =
    stream.prototype.writeString =
    stream.prototype.writeBuffer =
    stream.prototype.writeNumber = function(x) {
        this.buffer.push(x)
    }

var vm1 = new VM()
setupCustomFunction(vm1);
vm1.initialize()
vm1.evaluateProgram("x0=undefined")
vm1.evaluateProgram("x1=null")
vm1.evaluateProgram("x2=123456789")
vm1.evaluateProgram("x3='123456789a'")
vm1.evaluateProgram("x4=[0,1]")
vm1.evaluateProgram("x5={a:0, b:1}")
vm1.evaluateProgram("x6=new Number(100)")
vm1.evaluateProgram("x7=new String('abc')")
vm1.evaluateProgram("x8=new Boolean(false)")
vm1.evaluateProgram("x9=new Date(0)")
vm1.evaluateProgram("x10=new RegExp('abc+','gmi')")
vm1.evaluateProgram("x11=new Buffer('abc')")
vm1.evaluateProgram("x12=[true, false]")
vm1.evaluateProgram("function x13(a,b,c){};x13")
vm1.evaluateProgram("x14=new Error('abc')", "filename")
vm1.evaluateProgram("x15=new TypeError('abc1')", "filename1")
vm1.evaluateProgram("x16=new ReferenceError('abc2')", "filename2")
vm1.evaluateProgram("x17=new RangeError('abc3')", "filename3")
vm1.evaluateProgram("x18=new SyntaxError('abc4')", "filename4")
vm1.evaluateProgram("x19=new URIError('abc5')", "filename5")
vm1.evaluateProgram("x20=new EvalError('abc6')", "filename6")
vm1.evaluateProgram("x21=[{a:1,b:{c:3}},,[,7],];x21.length=4;Object.freeze(x21);x21")
vm1.evaluateProgram("x22=new OpaqueFunction('constructor', 'serializer')")
vm1.evaluateProgram("x23=new x22('abc', 5)")
vm1.evaluateProgram("setSystemHandler('test', function(){return 'abc'})")
check(vm1)

function setupCustomFunction(vm) {
    vm.setCustomFunction('constructor', function(a, b) {
        assert_equals(a, 'abc')
        assert_equals(b, 5)
        this.a = a
        this.b = b
    })
    vm.setCustomFunction('serializer', function(type, b) {
        if (type === 'serialize') {
            assert_equals(JSON.stringify(this), '{"a":"abc","b":5}')
            return new Buffer(JSON.stringify(this));
        } else {
            assert_equals(type, 'deserialize')
            assert_equals(b.toString(), '{"a":"abc","b":5}')
            var x = JSON.parse(b)
            for (var i in x) {
                this[i] = x[i]
            }
        }
    })
}

function check(vm) {
    assert(typeof vm.evaluateProgram("x0") === 'undefined')
    assert(typeof vm.evaluateProgram("x1") === 'object')
    assert(typeof vm.evaluateProgram("x2") === 'number')
    assert(typeof vm.evaluateProgram("x3") === 'string')
    assert(vm.evaluateProgram("x4") instanceof Array)
    assert(vm.evaluateProgram("x5") instanceof Object)
    assert(vm.evaluateProgram("x6") instanceof Number)
    assert(vm.evaluateProgram("x7") instanceof String)
    assert(vm.evaluateProgram("x8") instanceof Boolean)
    assert(vm.evaluateProgram("x9") instanceof Date)
    assert(vm.evaluateProgram("x10") instanceof RegExp)
    assert(vm.evaluateProgram("x11") instanceof Buffer)
    assert(typeof vm.evaluateProgram("x12")[0] === 'boolean')
    assert(typeof vm.evaluateProgram("x12")[1] === 'boolean')
    assert(vm.evaluateProgram("x13") instanceof Function)
    assert(vm.evaluateProgram("x14") instanceof Error)
    assert(vm.evaluateProgram("x15") instanceof TypeError)
    assert(vm.evaluateProgram("x16") instanceof ReferenceError)
    assert(vm.evaluateProgram("x17") instanceof RangeError)
    assert(vm.evaluateProgram("x18") instanceof SyntaxError)
    assert(vm.evaluateProgram("x19") instanceof URIError)
    assert(vm.evaluateProgram("x20") instanceof EvalError)
    assert(vm.evaluateProgram("getSystemHandler('test')") instanceof Function)

    assert(vm.evaluateProgram("x0") === vm.evaluateProgram("x0"))
    assert(vm.evaluateProgram("x1") === vm.evaluateProgram("x1"))
    assert(vm.evaluateProgram("x2") === vm.evaluateProgram("x2"))
    assert(vm.evaluateProgram("x3") === vm.evaluateProgram("x3"))
    assert(vm.evaluateProgram("x4") === vm.evaluateProgram("x4"))
    assert(vm.evaluateProgram("x5") === vm.evaluateProgram("x5"))
    assert(vm.evaluateProgram("x12") === vm.evaluateProgram("x12"))
    assert(vm.evaluateProgram("x13") === vm.evaluateProgram("x13"))
    assert(vm.evaluateProgram("x21") === vm.evaluateProgram("x21"))
    assert(vm.evaluateProgram("getSystemHandler('test')") === vm.evaluateProgram("getSystemHandler('test')"))

    assert_equals(vm.evaluateProgram("x0"), undefined)
    assert_equals(vm.evaluateProgram("x1"), null)
    assert_equals(vm.evaluateProgram("x2"), 123456789)
    assert_equals(vm.evaluateProgram("x3"), '123456789a')
    assert_equals(vm.evaluateProgram("x4").toString(), '0,1')
    assert_equals(vm.evaluateProgram("x5").toString(), '[object Object]')
    assert_equals(JSON.stringify(vm.evaluateProgram("x5")), '{"a":0,"b":1}')
    assert_equals(vm.evaluateProgram("x6").toString(), '100')
    assert_equals(vm.evaluateProgram("x7").toString(), 'abc')
    assert_equals(vm.evaluateProgram("x8").toString(), 'false')
    assert_equals(vm.evaluateProgram("x9").toString(), new Date(0).toString())
    assert(vm.evaluateProgram("x10").toString().match(/\/abc\+\/[gmi]{3,3}/))
    assert_equals(vm.evaluateProgram("x11").toString(), 'abc')
    assert_equals(vm.evaluateProgram("x12").toString(), 'true,false')
    assert_equals(vm.evaluateProgram("x14").toString(), 'Error: abc')
    assert_equals(vm.evaluateProgram("x15").toString(), 'TypeError: abc1')
    assert_equals(vm.evaluateProgram("x16").toString(), 'ReferenceError: abc2')
    assert_equals(vm.evaluateProgram("x17").toString(), 'RangeError: abc3')
    assert_equals(vm.evaluateProgram("x18").toString(), 'SyntaxError: abc4')
    assert_equals(vm.evaluateProgram("x19").toString(), 'URIError: abc5')
    assert_equals(vm.evaluateProgram("x20").toString(), 'EvalError: abc6')

    assert_equals(vm.evaluateProgram("x13").length, 3)
    try {
        vm.evaluateProgram("x13")()
        var err = null
    } catch (e) {
        var err = e
    }
    assert(err instanceof TypeError, err)

    assert_equals(vm.evaluateProgram("x14").stack, 'Error: abc\n    at filename:1:1')
    assert_equals(vm.evaluateProgram("x15").stack, 'TypeError: abc1\n    at filename1:1:1')
    assert_equals(vm.evaluateProgram("x16").stack, 'ReferenceError: abc2\n    at filename2:1:1')
    assert_equals(vm.evaluateProgram("x17").stack, 'RangeError: abc3\n    at filename3:1:1')
    assert_equals(vm.evaluateProgram("x18").stack, 'SyntaxError: abc4\n    at filename4:1:1')
    assert_equals(vm.evaluateProgram("x19").stack, 'URIError: abc5\n    at filename5:1:1')
    assert_equals(vm.evaluateProgram("x20").stack, 'EvalError: abc6\n    at filename6:1:1')

    assert_equals(JSON.stringify(vm.evaluateProgram("x21")), '[{"a":1,"b":{"c":3}},null,[null,7],null]')
    assert_equals(vm.evaluateProgram("x21").join(), '[object Object],,,7,')
    assert(!Object.isFrozen(vm.evaluateProgram("x21")))
    assert(!Object.isSealed(vm.evaluateProgram("x21")))
    assert_equals(Object.keys(vm.evaluateProgram("x21")).join(), '0,2')
    vm.evaluateProgram("x21")[5] = 5
    assert_equals(Object.keys(vm.evaluateProgram("x21")).join(), '0,2')

    assert_equals(vm.evaluateProgram("getSystemHandler('test')()"), 'abc')
}

var s = new stream()
vm1.writeSnapshot(s)
var vm2 = new VM()
setupCustomFunction(vm2);
vm2.readSnapshot(s)
check(vm2)

var s = new stream()
vm2.writeSnapshot(s)
var vm3 = new VM()
setupCustomFunction(vm3);
vm3.readSnapshot(s)
check(vm3)

test_success()
