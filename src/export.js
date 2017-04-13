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

function create_exported_object(Class, arg1, arg2) {
    switch (Class) {
        case 'Object':
            return new Object();
        case 'Array':
            return new Array();
        case 'Number':
            return new Number(arg1);
        case 'String':
            return new String(arg1);
        case 'Boolean':
            return new Boolean(arg1);
        case 'Date':
            return new Date(arg1);
        case 'RegExp':
            return new RegExp(arg1, arg2);
        case 'Buffer':
            return Buffer.from(arg1);
        case 'Error':
            switch (arg1) {
                case 'TypeError':
                    return new TypeError(arg2);
                case 'ReferenceError':
                    return new ReferenceError(arg2);
                case 'RangeError':
                    return new RangeError(arg2);
                case 'SyntaxError':
                    return new SyntaxError(arg2);
                case 'URIError':
                    return new URIError(arg2);
                case 'EvalError':
                    return new EvalError(arg2);
                case 'Error':
                    return new Error(arg2);
            }
            var err = new Error(arg2);
            Object.defineProperty(err, "name", {
                value: arg1,
                writable: true,
                enumerable: false,
                configurable: true,
            });
            return err;
        case 'ObjectPrototype':
            return Object.prototype;
        case 'ArrayPrototype':
            return Array.prototype;
        case 'FunctionPrototype':
            return Function.prototype;
        case 'StringPrototype':
            return String.prototype;
        case 'BooleanPrototype':
            return Boolean.prototype;
        case 'NumberPrototype':
            return Number.prototype;
        case 'DatePrototype':
            return Date.prototype;
        case 'RegExpPrototype':
            return RegExp.prototype;
        case 'ErrorPrototype':
            return Error.prototype;
        case 'EvalErrorPrototype':
            return EvalError.prototype;
        case 'RangeErrorPrototype':
            return RangeError.prototype;
        case 'ReferenceErrorPrototype':
            return ReferenceError.prototype;
        case 'SyntaxErrorPrototype':
            return SyntaxError.prototype;
        case 'TypeErrorPrototype':
            return TypeError.prototype;
        case 'URIErrorPrototype':
            return URIError.prototype;
        case 'OpaqueObject':
            var obj = new Object();
            Object.defineProperty(obj, "opaque", {
                value: arg1,
                writable: false,
                enumerable: false,
                configurable: true,
            });
            return obj;
    }
    assert(false, Class);
}

function initializeDefaultExport() {
    realm.Object_prototype.exported = create_exported_object('ObjectPrototype');
    realm.Array_prototype.exported = create_exported_object('ArrayPrototype');
    realm.Function_prototype.exported = create_exported_object('FunctionPrototype');
    realm.String_prototype.exported = create_exported_object('StringPrototype');
    realm.Boolean_prototype.exported = create_exported_object('BooleanPrototype');
    realm.Number_prototype.exported = create_exported_object('NumberPrototype');
    realm.Date_prototype.exported = create_exported_object('DatePrototype');
    realm.RegExp_prototype.exported = create_exported_object('RegExpPrototype');
    realm.Error_prototype.exported = create_exported_object('ErrorPrototype');
    realm.EvalError_prototype.exported = create_exported_object('EvalErrorPrototype');
    realm.RangeError_prototype.exported = create_exported_object('RangeErrorPrototype');
    realm.ReferenceError_prototype.exported = create_exported_object('ReferenceErrorPrototype');
    realm.SyntaxError_prototype.exported = create_exported_object('SyntaxErrorPrototype');
    realm.TypeError_prototype.exported = create_exported_object('TypeErrorPrototype');
    realm.URIError_prototype.exported = create_exported_object('URIErrorPrototype');
}

function exportArguments(argumentsList) {
    var args = [];
    for (var i = 0; i < argumentsList.length; i++) {
        args[i] = exportValue(argumentsList[i]);
    }
    return args;
}

function exportValue(A) {
    if (isPrimitiveValue(A)) {
        return A;
    }
    if (A.exported) {
        return A.exported;
    }
    switch (A.Class) {
        case 'Number':
        case 'String':
        case 'Boolean':
        case 'Date':
            A.exported = create_exported_object(A.Class, A.PrimitiveValue);
            return A.exported;
        case 'Buffer':
            return create_exported_object('Buffer', A.wrappedBuffer); // copy the buffer
        case 'RegExp':
            return exportRegExp(A);
        case 'Error':
            return exportError(A);
        case 'Array':
            var obj = create_exported_object('Array');
            A.exported = new Proxy(obj, new ExportHandler(A));
            return A.exported;
        default:
            if (A.ClassID === CLASSID_OpaqueObject) {
                A.exported = exportOpaqueObject(A);
                return A.exported;
            }
            var obj = create_exported_object('Object');
            A.exported = new Proxy(obj, new ExportHandler(A));
            return A.exported;
    }
}

function exportOpaqueObject(A) {
    if (A.wrapped) {
        var obj = create_exported_object('OpaqueObject', A.opaque);
        return new Proxy(obj, new ExportHandler(A));
    }
    return A.opaque;
}

function exportRegExp(A) {
    var source = safe_get_primitive_value(A, 'source');
    var global = safe_get_primitive_value(A, 'global');
    var ignoreCase = safe_get_primitive_value(A, 'ignoreCase');
    var multiline = safe_get_primitive_value(A, 'multiline');
    var obj = create_exported_object('RegExp', source, (global ? "g" : "") + (ignoreCase ? "i" : "") + (multiline ? "m" : ""));
    obj.lastIndex = safe_get_primitive_value(A, 'lastIndex');
    return obj;
}

function exportError(A) {
    var name = safe_get_primitive_value(A, 'name');
    var msg = safe_get_primitive_value(A, 'message');
    var stackTrace = A.stackTrace;
    if (name === undefined) {
        var name = "Error";
    } else {
        var name = String(name);
    }
    if (msg === undefined) {
        var msg = "";
    } else {
        var msg = String(msg);
    }
    var err = create_exported_object('Error', name, msg);
    var A = [];
    if (name === "") A[0] = msg;
    else if (msg === "") A[0] = name;
    else A[0] = name + ": " + msg;
    var info = {};
    for (var i = 0; i < stackTrace.length; i++) {
        var code = stackTrace[i].code;
        var pos = stackTrace[i].pos;
        Parser.locateDebugInfo(code, pos, info);
        var finfo = info.filename + ":" + info.lineNumber + ":" + info.columnNumber;
        A[i + 1] = finfo;
        if (info.functionName) {
            A[i + 1] = info.functionName + " (" + finfo + ")";
        }
    }
    err.stack = A.join("\n    at ");
    return err;
}

function ExportHandler(A) {
    this.A = A;
}

ExportHandler.prototype = {
    getPrototypeOf: function(target) {
        return exportValue(this.A.Prototype);
    },
    setPrototypeOf: function(target, V) {
        return false;
    },
    preventExtensions: function(target) {
        return false;
    },
    getOwnPropertyDescriptor: function(target, P) {
        var Desc = this.A.properties[P];
        var targetDesc = Object.getOwnPropertyDescriptor(target, P);
        if (Desc === undefined) return targetDesc;
        if (targetDesc !== undefined && targetDesc.configurable === false) {
            if (targetDesc.writable === false) return targetDesc;
            var obj = {
                writable: true,
                enumerable: targetDesc.enumerable,
                configurable: false,
            };
        } else {
            var obj = {
                writable: false,
                enumerable: Desc.Enumerable,
                configurable: true,
            };
        }
        if (IsDataDescriptor(Desc) === true) {
            assert(Desc.Value !== absent, Desc);
            obj.value = exportValue(Desc.Value);
        } else {
            assert(IsAccessorDescriptor(Desc), Desc);
            obj.value = undefined;
        }
        return obj;
    },
    defineProperty: function(target) {
        return false;
    },
    has: function(target, P) {
        var Desc = this.getOwnPropertyDescriptor(target, P);
        if (Desc === undefined) {
            var proto = this.getPrototypeOf(target);
            if (proto === null) return false;
            return Reflect.has(proto, P);
        }
        return true;
    },
    get: function(target, P) {
        var Desc = this.getOwnPropertyDescriptor(target, P);
        if (Desc === undefined) {
            var proto = this.getPrototypeOf(target);
            if (proto === null) return undefined;
            return Reflect.get(proto, P);
        }
        return Desc.value;
    },
    set: function(target, P, V) {
        return false;
    },
    deleteProperty: function(target) {
        return false;
    },
    ownKeys: function(target) {
        return Object.getOwnPropertyNames(this.A.properties);
    },
    apply: function(target) {
        assert(false);
    },
    construct: function(target) {
        assert(false);
    },
};

function safe_get_property(O, P) {
    var prop = O.properties[P];
    if (prop !== undefined) return prop;
    var proto = O.Prototype;
    if (proto === null) return undefined;
    return safe_get_property(proto, P);
}

function safe_get_primitive_value(O, P) {
    var prop = safe_get_property(O, P);
    if (prop === undefined) return undefined;
    if (prop.Value === absent) return undefined;
    if (isPrimitiveValue(prop.Value)) {
        return prop.Value;
    }
    return undefined;
}

function evaluateProgram(text, filename) {
    assert(typeof text === "string");
    assert(!filename || typeof filename === "string");
    try {
        var prog = Parser.readCode("global", "", text, false, [], filename);
    } catch (e) {
        if (e instanceof Parser.SyntaxError) {
            throw create_exported_object('Error', 'SyntaxError', e.message);
        }
        if (e instanceof Parser.ReferenceError) {
            throw create_exported_object('Error', 'ReferenceError', e.message);
        }
        throw e;
    }
    var savedLexicalEnvironment = LexicalEnvironment;
    var savedVariableEnvironment = VariableEnvironment;
    var savedThisBinding = ThisBinding;
    enterExecutionContextForGlobalCode(prog);
    try {
        var result = prog.evaluate();
    } finally {
        exitExecutionContext();
        LexicalEnvironment = savedLexicalEnvironment;
        VariableEnvironment = savedVariableEnvironment;
        ThisBinding = savedThisBinding;
    }
    if (result.type === "normal" && result.value === empty) return undefined;
    if (result.type === "normal") return exportValue(result.value);
    assert(result.type === "throw", result);
    throw exportValue(result.value);
}

function applySystemHandler(name, argumentsList) {
    assert(typeof name === "string");
    var F = realm.systemHandlers[name];
    if (IsCallable(F) === false) return;
    try {
        var result = F.Call(null, argumentsList);
    } catch (e) {
        if (isInternalError(e)) throw e;
        throw exportValue(e);
    }
    return exportValue(result);
}
