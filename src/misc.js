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

var customFunctions;

function setCustomFunctions(cf) {
    customFunctions = cf;
}

function OpaqueFunction_Call(thisValue, argumentsList) {
    return OpaqueFunction_Construct(argumentsList);
}

function OpaqueFunction_Construct(argumentsList) {
    var name = ToString(argumentsList[0]);
    var serializer = ToPrimitive(argumentsList[1]);
    var wrapped = ToBoolean(argumentsList[2]);
    var F = VMObject(CLASSID_OpaqueFunction);
    F.Prototype = realm.Function_prototype;
    F.Extensible = true;
    var proto = Object_Construct([]);
    define(proto, "constructor", F);
    define(proto, "serializer", serializer);
    defineWritable(F, "prototype", proto);
    defineFinal(F, "name", name);
    defineWritable(F, "wrapped", wrapped);
    return F;
}

function OpaqueFunction_ClassCall(thisValue, argumentsList) {
    var F = this;
    var name = ToString(F.Get("name"));
    var f = customFunctions[name];
    var V = exportValue(thisValue);
    var args = exportArguments(argumentsList);
    if (!f) {
        return deterministicValue(undefined, "missingOpaqueCall", name, V, args);
    }
    try {
        var result = f.apply(V, args);
    } catch (e) {
        throw importValue(e);
    }
    return importValue(result);
}

function OpaqueFunction_ClassConstruct(argumentsList) {
    var F = this;
    var obj = VMObject(CLASSID_OpaqueObject);
    obj.Extensible = true;
    obj.wrapped = ToBoolean(F.Get("wrapped"));
    obj.opaque = create_exported_object('Object');
    var proto = F.Get("prototype");
    if (typeof(proto) === "object" && proto !== null) {
        obj.Prototype = proto;
    } else {
        obj.Prototype = realm.Object_prototype;
    }
    var result = F.Call(obj, argumentsList);
    if (typeof(result) === 'object' && result !== null) return result;
    return obj;
}

function saveEntireContext() {
    return {
        realm,
        customFunctions,
        LexicalEnvironment,
        VariableEnvironment,
        ThisBinding,
        runningFunction,
        runningCode,
        runningSourcePos,
        outerExecutionContext,
        stackDepth,
    };
    realm = undefined;
    customFunctions = undefined;
    LexicalEnvironment = undefined;
    VariableEnvironment = undefined;
    ThisBinding = undefined;
    runningFunction = undefined;
    runningCode = undefined;
    runningSourcePos = undefined;
    stackDepth = 0;
}

function restoreEntireContext(ctx) {
    realm = ctx.realm;
    customFunctions = ctx.customFunctions;
    LexicalEnvironment = ctx.LexicalEnvironment;
    VariableEnvironment = ctx.VariableEnvironment;
    ThisBinding = ctx.ThisBinding;
    runningFunction = ctx.runningFunction;
    runningCode = ctx.runningCode;
    runningSourcePos = ctx.runningSourcePos;
    stackDepth = ctx.stackDepth;
}

function deterministicValue(value) {
    var handler = customFunctions.deterministicHandler;
    if (!handler) return value;
    try {
        var result = handler.apply(null, arguments);
    } catch (e) {
        throw importValue(e);
    }
    return importValue(result);
}

function callEvaluateProgram(text, filename) {
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
