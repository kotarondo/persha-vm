/*
 Copyright (c) 2015-2017, Kotaro Endo.
 All rights reserved.
 
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:
 
 1. Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
 
 2. Redistributions in binary form must reproduce the above
    copyright notice, this list of conditions and the following
    disclaimer in the documentation and/or other materials provided
    with the distribution.
 
 3. Neither the name of the copyright holder nor the names of its
    contributors may be used to endorse or promote products derived
    from this software without specific prior written permission.
 
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var filenames = ["helper.js", "type_constants.js", "import.js", "export.js", "opaque.js", "snapshot.js", "unicode.js", "regexp_compiler.js", "compiler.js", "builtinArray.js", "builtinBoolean.js", "builtinBuffer.js", "builtinDate.js", "builtinError.js", "builtinFunction.js", "builtinGlobal.js", "builtinJSON.js", "builtinMath.js", "builtinNumber.js", "builtinObject.js", "builtinRegExp.js", "builtinString.js", "conversion.js", "expression.js", "function.js", "statement.js", "program.js", "parser.js", "intrinsic.js", "execution.js", "types.js", "realm.js"];

var prefix = "_pershavm";
var map = Object.create(null);
var index = 100;

function registerName(name) {
    if (/\W/.test(name) || map[name]) {
        var err = new Error("NG: invalid name:" + name);
        debugger;
        throw err;
    }
    map[name] = prefix + (index++);
}

var codes = [];
var functions = [];
var constants = [];
var variables = [];

for (var filename of filenames) {
    var text = fs.readFileSync(path.join(__dirname, "src", filename)).toString();
    var split = text.split(/\b|(?=\n)/);
    split.forEach(function(e, i) {
        if (e !== '\n') return;
        var head = split[i + 1];
        var name = split[i + 3];
        if (head === 'function') {
            functions.push(name);
            registerName(name);
            return;
        }
        if (head === 'const') {
            constants.push(name);
            registerName(name);
            return;
        }
        if (head === 'var') {
            variables.push(name);
            registerName(name);
            return;
        }
    });
    codes.push({
        filename: filename,
        text: text,
        split: split,
    });
}

for (var code of codes) {
    code.split.forEach(function(e, i, a) {
        var n = map[e];
        if (n) {
            a[i] = n;
        }
    });
    var text = code.split.join('');
    vm.runInThisContext(text, {
        filename: code.filename,
        displayErrors: true,
    });
}

var context = {};
for (var name of functions) {
    context[name] = vm.runInThisContext(map[name]);
}
for (var name of constants) {
    context[name] = vm.runInThisContext(map[name]);
}

function VM() {
    var realm;
    var customFunctions = Object.create(null);

    this.initialize = function() {
        context.setCustomFunctions(null);
        context.setRealm(null);
        context.initializeRealm();
        realm = context.getRealm();
    }

    this.setCustomFunction = function(name, func) {
        customFunctions[name] = func;
    }

    this.writeSnapshot = function(stream) {
        context.setCustomFunctions(customFunctions);
        context.setRealm(realm);
        context.writeSnapshot(stream);
    }

    this.readSnapshot = function(stream) {
        context.setCustomFunctions(customFunctions);
        context.setRealm(null);
        context.readSnapshot(stream);
        realm = context.getRealm();
    }

    this.evaluateProgram = function(text, filename) {
        context.setCustomFunctions(customFunctions);
        context.setRealm(realm);
        return context.evaluateProgram(text, filename);
    }

    this.callSystemHandler = function(name) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.applySystemHandler(name, args);
    }

    this.applySystemHandler = function(name, args) {
        context.setCustomFunctions(customFunctions);
        context.setRealm(realm);
        var args = context.importArguments(args);
        return context.applySystemHandler(name, args);
    }

}

VM.ExternalObject = context.ExternalObject;

module.exports = VM;