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

// ECMAScript 5.1: 15.3 Function Objects

function Function_Call(thisValue, argumentsList) {
    return Function_Construct(argumentsList);
}

function Function_Construct(argumentsList) {
    var argCount = argumentsList.length;
    var P = "";
    if (argCount === 0) {
        var body = "";
    } else if (argCount === 1) {
        var body = argumentsList[0];
    } else {
        var firstArg = argumentsList[0];
        var P = ToString(firstArg);
        var k = 2;
        while (k < argCount) {
            var nextArg = argumentsList[k - 1];
            var P = P + "," + ToString(nextArg);
            k++;
        }
        var body = argumentsList[k - 1];
    }
    var body = ToString(body);
    try {
        var code = Parser.readCode("function", P, body, false, [], "<anonymous>");
    } catch (e) {
        if (e instanceof Parser.SyntaxError) {
            throw VMSyntaxError(e.message);
        }
        if (e instanceof Parser.ReferenceError) {
            throw VMReferenceError(e.message);
        }
        throw e;
    }
    return CreateFunction(code, realm.theGlobalEnvironment);
}

function Function_prototype_toString(thisValue, argumentsList) {
    var func = thisValue;
    if (IsCallable(func) === false) throw VMTypeError();
    var name = func.Get("name") || "anonymous";
    while (func.TargetFunction) {
        func = func.TargetFunction;
    }
    if (func.Code) {
        var param = func.Code.parameters;
        var startPos = func.Code.startPos;
        var endPos = func.Code.endPos;
        var source = func.Code.sourceObject.source;
        var codeText = source.substring(startPos, endPos);
        return "function " + name + "(" + param + "){" + codeText + "}";
    }
    return "function " + name + "(){ native }";
}

function get_Function_prototype_name(thisValue, argumentsList) {
    var func = thisValue;
    if (IsCallable(func) === false) throw VMTypeError();
    while (func.TargetFunction) {
        func = func.TargetFunction;
    }
    if (func.Code) {
        var name = func.Code.functionName;
    }
    if (!name) {
        return "";
    }
    return name;
}

function Function_prototype_apply(thisValue, argumentsList) {

    var func = thisValue;
    var thisArg = argumentsList[0];
    var argArray = argumentsList[1];
    if (IsCallable(func) === false) throw VMTypeError();
    if (argArray === null || argArray === undefined) return func.Call(thisArg, []);
    if (typeof(argArray) !== 'object') throw VMTypeError();
    var len = argArray.Get("length");
    if (typeof(len) === "number") {
        var n = (len >>> 0);
    } else {
        var n = ToUint32(len);
    }
    var argList = [];
    var index = 0;
    while (index < n) {
        var nextArg = argArray.Get(index);
        argList.push(nextArg);
        index = index + 1;
    }
    return func.Call(thisArg, argList);
}

function Function_prototype_call(thisValue, argumentsList) {
    var func = thisValue;
    var thisArg = argumentsList[0];
    if (IsCallable(func) === false) throw VMTypeError();
    var argList = [];
    if (argumentsList.length > 1) {
        for (var i = 1; i < argumentsList.length; i++) {
            argList.push(argumentsList[i]);
        }
    }
    return func.Call(thisArg, argList);
}

function Function_prototype_bind(thisValue, argumentsList) {
    var thisArg = argumentsList[0];
    var Target = thisValue;
    if (IsCallable(Target) === false) throw VMTypeError();
    var A = [];
    for (var i = 1; i < argumentsList.length; i++) {
        A.push(argumentsList[i]);
    }
    var F = VMObject(CLASSID_BindFunction);
    F.TargetFunction = Target;
    F.BoundThis = thisArg;
    F.BoundArgs = A;
    F.Prototype = realm.Function_prototype;
    if (Target.Class === "Function") {
        var L = Target.Get("length") - A.length;
        defineFinal(F, "length", Math.max(0, L));
    } else {
        defineFinal(F, "length", 0);
    }
    F.Extensible = true;
    var thrower = realm.theThrowTypeError;
    F.DefineOwnProperty("caller", AccessorPropertyDescriptor(thrower, thrower, false, false), false);
    F.DefineOwnProperty("arguments", AccessorPropertyDescriptor(thrower, thrower, false, false), false);
    return F;
}

function BindFunction_ClassCall(thisValue, argumentsList) {
    var F = this;
    var ExtraArgs = argumentsList;
    var boundArgs = F.BoundArgs;
    var boundThis = F.BoundThis;
    var target = F.TargetFunction;
    var args = boundArgs.concat(ExtraArgs);
    return target.Call(boundThis, args);
}

function BindFunction_ClassConstruct(argumentsList) {
    var F = this;
    var ExtraArgs = argumentsList;
    var target = F.TargetFunction;
    if (target.Construct === undefined) throw VMTypeError();
    var boundArgs = F.BoundArgs;
    var args = boundArgs.concat(ExtraArgs);
    return target.Construct(args);
}

function BindFunction_HasInstance(V) {
    var F = this;
    var target = F.TargetFunction;
    if (target.HasInstance === undefined) throw VMTypeError();
    return target.HasInstance(V);
}

function Function_Get(P) {
    var F = this;
    var v = default_Get.call(F, P);
    if (P === "caller" && v && v.Class === "Function" && v.Code !== undefined && v.Code.strict) throw VMTypeError();
    return v;
}

function Function_HasInstance(V) {
    var F = this;
    if (typeof(V) !== 'object' || V === null) return false;
    var O = F.Get("prototype");
    if (typeof(O) !== 'object' || O === null) throw VMTypeError();
    while (true) {
        var V = V.Prototype;
        if (V === null) return false;
        if (O === V) return true;
    }
}
