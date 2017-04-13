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

// ECMAScript 5.1: 15.11 Error Objects

function Error_Call(thisValue, argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.Error_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function Error_Construct(argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.Error_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function Error_prototype_toString(thisValue, argumentsList) {
    var O = thisValue;
    if (Type(O) !== TYPE_Object) throw VMTypeError();
    var name = O.Get("name");
    if (name === undefined) {
        var name = "Error";
    } else {
        var name = ToString(name);
    }
    var msg = O.Get("message");
    if (msg === undefined) {
        var msg = "";
    } else {
        var msg = ToString(msg);
    }
    if (msg === undefined) {
        var msg = "";
    } else {
        var msg = ToString(msg);
    }
    if (name === "") return msg;
    if (msg === "") return name;
    return name + ": " + msg;
}

function EvalError_Call(thisValue, argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.EvalError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function EvalError_Construct(argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.EvalError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function RangeError_Call(thisValue, argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.RangeError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function RangeError_Construct(argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.RangeError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function ReferenceError_Call(thisValue, argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.ReferenceError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function ReferenceError_Construct(argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.ReferenceError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function SyntaxError_Call(thisValue, argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.SyntaxError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function SyntaxError_Construct(argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.SyntaxError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function TypeError_Call(thisValue, argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.TypeError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function TypeError_Construct(argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.TypeError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function URIError_Call(thisValue, argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.URIError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function URIError_Construct(argumentsList) {
    var message = argumentsList[0];
    var obj = VMObject(CLASSID_Error);
    obj.Prototype = realm.URIError_prototype;
    obj.Extensible = true;
    obj.stackTrace = getStackTrace();
    if (message !== undefined) {
        define(obj, "message", ToString(message));
    }
    return obj;
}

function VMRangeError(message) {
    return RangeError_Construct([message]);
}

function VMReferenceError(message) {
    return ReferenceError_Construct([message]);
}

function VMSyntaxError(message) {
    return SyntaxError_Construct([message]);
}

function VMTypeError(message) {
    return TypeError_Construct([message]);
}

function VMURIError(message) {
    return URIError_Construct([message]);
}

function get_Error_prototype_stack(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Error") throw VMTypeError();
    var stackTrace = thisValue.stackTrace;
    var A = [];
    var info = {};
    A[0] = Error_prototype_toString(thisValue, []);
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
    return A.join("\n    at ");
}

function Error_prototype_getStackTraceEntry(thisValue, argumentsList) {
    var index = ToUint32(argumentsList[0]);
    var stackTrace = thisValue.stackTrace;
    if (stackTrace[index] === undefined) {
        return undefined;
    }
    var info = {};
    var func = stackTrace[index].func;
    var code = stackTrace[index].code;
    var pos = stackTrace[index].pos;
    Parser.locateDebugInfo(code, pos, info);
    var obj = Object_Construct([]);
    obj.Put("functionObject", func);
    obj.Put("functionName", info.functionName);
    obj.Put("filename", info.filename);
    obj.Put("lineNumber", info.lineNumber);
    obj.Put("columnNumber", info.columnNumber);
    return obj;
}
