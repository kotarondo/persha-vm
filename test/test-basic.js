// Copyright (c) 2017, Kotaro Endo.
// All rights reserved.
// License: "BSD-3-Clause"

require('./harness')
process.chdir("basic")
var filenames = fs.readdirSync(".")

var succ = 0
var fail = 0

while (filenames.length) {
    var filename = filenames.pop()
    if (!/^test.*\.js$/.test(filename)) continue
    console.log(filename)
    var source = fs.readFileSync(filename).toString()
    var vm = new VM()
    vm.initialize()
    try {
        var value = vm.evaluateProgram(source, filename)
        if (value && value[2] === "DONE" && JSON.stringify(value[0]) === JSON.stringify(value[1])) {
            succ++;
        }
    } catch (err) {
        console.log(err)
        fail++;
    }
}

assert(!fail)
test_success()
