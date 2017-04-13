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

// ECMAScript 5.1: 13 Function Definition

function FunctionDeclaration(body) {
    return ({
        name: body.functionName,
        instantiate: function() {
            return CreateFunction(body, VariableEnvironment);
        },
        compile: function(ctx) {
            return ctx.defineObject("CreateFunction(" + ctx.literal(body) + ",VariableEnvironment)");
        },
    });
}

function FunctionExpression(staticEnv, body) {
    if (body.functionName === undefined) {
        return CompilerContext.expression(function(ctx) {
            return ctx.defineObject("CreateFunction(" + ctx.literal(body) + ",LexicalEnvironment)");
        });
    }

    return CompilerContext.expression(function(ctx) {
        var oldEnv = ctx.compileNewDeclarativeEnvironment(staticEnv);
        ctx.compileCreateImmutableBinding(staticEnv, body.functionName);
        var closure = ctx.defineObject("CreateFunction(" + ctx.literal(body) + ",LexicalEnvironment)");
        ctx.compileInitializeImmutableBinding(staticEnv, body.functionName, closure);
        if (oldEnv) ctx.text("LexicalEnvironment= " + oldEnv.name + ";");
        return closure;
    });
}

function CreateFunction(body, Scope) {
    var F = VMObject(CLASSID_Function);
    F.Prototype = realm.Function_prototype;
    F.Scope = Scope;
    F.Code = body;
    F.Extensible = true;
    var len = body.parameters.length;
    F.DefineOwnProperty("length", DataPropertyDescriptor(len, false, false, false), false);
    var proto = Object_Construct([]);
    proto.DefineOwnProperty("constructor", DataPropertyDescriptor(F, true, false, true), false);
    F.DefineOwnProperty("prototype", DataPropertyDescriptor(proto, true, false, false), false);
    if (body.strict) {
        var thrower = realm.theThrowTypeError;
        F.DefineOwnProperty("caller", AccessorPropertyDescriptor(thrower, thrower, false, false), false);
        F.DefineOwnProperty("arguments", AccessorPropertyDescriptor(thrower, thrower, false, false), false);
    }
    return F;
}

function delayedFunctionBody(F, ThisBinding, argumentsList) {
    var ctx = new CompilerContext("F, ThisBinding, argumentsList");
    try {
        compileDeclarationBindingInstantiation0(ctx, F.Code);
        if (F.Code.sourceElements !== undefined) {
            ctx.compileStatement(F.Code.sourceElements);
            F.Code.sourceElements = null;
        }
        ctx.compileReturn(COMPILER_UNDEFINED_VALUE);
    } catch (e) {
        console.error("CODEGEN ERROR:\n" + ctx.texts.join('\n'));
        console.error(e.stack);
        process.reallyExit(1);
    }
    var evaluate = ctx.finish();
    F.Code.evaluate = evaluate;
    return evaluate(F, ThisBinding, argumentsList);
}

function Function_ClassCall(thisValue, argumentsList) {
    var F = this;
    saveExecutionContext();
    var code = F.Code;
    if (code.strict) {
        var ThisBinding = thisValue;
    } else if (thisValue === null || thisValue === undefined) {
        var ThisBinding = realm.theGlobalObject;
    } else if (typeof(thisValue) !== 'object') {
        var ThisBinding = ToObject(thisValue);
    } else {
        var ThisBinding = thisValue;
    }
    runningFunction = F;
    runningCode = code;
    runningSourcePos = 0;
    try {
        return F.Code.evaluate(F, ThisBinding, argumentsList);
    } finally {
        exitExecutionContext();
    }
}

function Function_ClassConstruct(argumentsList) {
    var F = this;
    var obj = VMObject(CLASSID_Object);
    obj.Extensible = true;
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

function ThrowTypeError() {
    throw VMTypeError();
}

function createThrowTypeErrorObject() {
    var F = VMObject(CLASSID_BuiltinFunction);
    F.Prototype = realm.Function_prototype;
    defineCall(F, ThrowTypeError);
    defineFinal(F, "length", 0);
    F.Extensible = false;
    return F;
}
