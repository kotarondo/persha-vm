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

// ECMAScript 5.1: 10 Executable Code and Execution Contexts

const Class_DeclarativeEnvironment = ({
    // attributes
    // 0: Mutable Deletable
    // 1: Mutable Undeletable
    // 2: Immutable Initialized
    // 3: Immutable Uninitialized

    ClassID: CLASSID_DeclarativeEnvironment,
    walkObject: DeclarativeEnvironment_walkObject,
    writeObject: DeclarativeEnvironment_writeObject,
    readObject: DeclarativeEnvironment_readObject,

    HasBinding: function(N) {
        if (this.attributes[N] !== undefined) return true;
        return false;
    },

    CreateMutableBinding: function(N, D) {
        assert(this.attributes[N] === undefined, N);
        if (D === true) {
            this.attributes[N] = 0;
        } else {
            this.attributes[N] = 1;
        }
    },

    SetMutableBinding: function(N, V, S) {
        if (this.attributes[N] === undefined) return;
        if (this.attributes[N] <= 1) {
            this.values[N] = V;
        } else if (S === true) throw VMTypeError();
    },

    GetBindingValue: function(N, S) {
        assert(this.attributes[N] !== undefined, N);
        if (this.attributes[N] === 3) {
            if (S === false) return undefined;
            throw VMReferenceError(N);
        }
        return this.values[N];
    },

    DeleteBinding: function(N) {
        if (this.attributes[N] === undefined) return true;
        if (this.attributes[N] !== 0) return false;
        delete(this.values[N]);
        delete(this.attributes[N]);
        return true;
    },

    ImplicitThisValue: function() {
        return undefined;
    },

    CreateImmutableBinding: function(N) {
        assert(this.attributes[N] === undefined, N);
        this.attributes[N] = 3;
    },

    InitializeImmutableBinding: function(N, V) {
        assert(this.attributes[N] === 3, N);
        this.values[N] = V;
        this.attributes[N] = 2;
    },
});

const Class_ObjectEnvironment = ({
    ClassID: CLASSID_ObjectEnvironment,
    walkObject: ObjectEnvironment_walkObject,
    writeObject: ObjectEnvironment_writeObject,
    readObject: ObjectEnvironment_readObject,

    HasBinding: function(N) {
        var bindings = this.bindings;
        return bindings.HasProperty(N);
    },

    CreateMutableBinding: function(N, D) {
        var bindings = this.bindings;
        assert(bindings.HasProperty(N) === false, N);
        if (D === true) {
            var configValue = true;
        } else {
            var configValue = false;
        }
        bindings.DefineOwnProperty(N, DataPropertyDescriptor(undefined, true, true, configValue), true);
    },

    SetMutableBinding: function(N, V, S) {
        var bindings = this.bindings;
        bindings.Put(N, V, S);
    },

    GetBindingValue: function(N, S) {
        var bindings = this.bindings;
        var value = bindings.HasProperty(N);
        if (value === false) {
            if (S === false) return undefined;
            throw VMReferenceError(N);
        }
        return bindings.Get(N);
    },

    DeleteBinding: function(N) {
        var bindings = this.bindings;
        return bindings.Delete(N, false);
    },

    ImplicitThisValue: function() {
        if (this.provideThis === true) return this.bindings;
        return undefined;
    },
});

function GetIdentifierReference(lex, name, strict) {
    if (lex === null) return ReferenceValue(undefined, name, strict);
    var envRec = lex;
    var exists = envRec.HasBinding(name);
    if (exists === true) return ReferenceValue(envRec, name, strict);
    else {
        var outer = lex.outer;
        return GetIdentifierReference(outer, name, strict);
    }
}

function SkipEnvironmentRecord(lex, skip) {
    while (skip--) {
        lex = lex.outer;
    }
    return lex;
}

function GetIdentifierEnvironmentRecord(lex, skip, name) {
    while (skip--) {
        lex = lex.outer;
    }
    while (true) {
        if (lex === null) return undefined;
        if (lex.HasBinding(name)) return lex;
        lex = lex.outer;
    }
}

function NewDeclarativeEnvironment(E) {
    var obj = Object.create(Class_DeclarativeEnvironment);
    obj.values = Object.create(null);
    obj.attributes = Object.create(null);
    obj.outer = E;
    obj.ID = 0;
    return obj;
}

function NewObjectEnvironment(O, E) {
    var obj = Object.create(Class_ObjectEnvironment);
    obj.bindings = O;
    obj.provideThis = false;
    obj.outer = E;
    obj.ID = 0;
    return obj;
}

var LexicalEnvironment;
var VariableEnvironment;
var ThisBinding;
var runningFunction;
var runningCode;
var runningSourcePos;
var outerExecutionContext;
var stackDepth = 0;

function saveExecutionContext() {
    if (stackDepth >= realm.stackDepthLimit) {
        throw VMRangeError("stack overflow");
    }
    stackDepth++;
    outerExecutionContext = ({
        runningFunction: runningFunction,
        runningCode: runningCode,
        runningSourcePos: runningSourcePos,
        outerExecutionContext: outerExecutionContext,
    });
}

function exitExecutionContext() {
    var ctx = outerExecutionContext;
    stackDepth--;
    runningFunction = ctx.runningFunction;
    runningCode = ctx.runningCode;
    runningSourcePos = ctx.runningSourcePos;
    outerExecutionContext = ctx.outerExecutionContext;
}

function getStackTrace() {
    var stackTraceLimit = realm.Error.Get('stackTraceLimit');
    if (Type(stackTraceLimit) !== TYPE_Number) {
        stackTraceLimit = 10;
    }
    var stackTrace = [];
    if (runningCode !== undefined) {
        if (stackTrace.length >= stackTraceLimit) {
            return stackTrace;
        }
        stackTrace.push({
            func: runningFunction,
            code: runningCode,
            pos: runningSourcePos,
        });
        var ctx = outerExecutionContext;
        while (ctx.runningCode !== undefined) {
            if (stackTrace.length >= stackTraceLimit) {
                return stackTrace;
            }
            stackTrace.push({
                func: ctx.runningFunction,
                code: ctx.runningCode,
                pos: ctx.runningSourcePos,
            });
            var ctx = ctx.outerExecutionContext;
        }
    }
    return stackTrace;
}

function enterExecutionContextForGlobalCode(code) {
    saveExecutionContext();
    LexicalEnvironment = realm.theGlobalEnvironment;
    VariableEnvironment = realm.theGlobalEnvironment;
    ThisBinding = realm.theGlobalObject;
    runningFunction = undefined;
    runningCode = code;
    runningSourcePos = 0;
    DeclarationBindingInstantiation(code);
}

function enterExecutionContextForEvalCode(code, direct, lexEnv, varEnv, thisB) {
    saveExecutionContext();
    if (direct) {
        LexicalEnvironment = lexEnv;
        VariableEnvironment = varEnv;
        ThisBinding = thisB;
    } else {
        LexicalEnvironment = realm.theGlobalEnvironment;
        VariableEnvironment = realm.theGlobalEnvironment;
        ThisBinding = realm.theGlobalObject;
    }
    if (code.strict) {
        var strictVarEnv = NewDeclarativeEnvironment(LexicalEnvironment);
        LexicalEnvironment = strictVarEnv;
        VariableEnvironment = strictVarEnv;
    }
    runningFunction = undefined;
    runningCode = code;
    runningSourcePos = 0;
    DeclarationBindingInstantiation(code);
}

function DeclarationBindingInstantiation(code) {
    var env = VariableEnvironment;
    if (code.type === "eval") {
        var configurableBindings = true;
    } else {
        var configurableBindings = false;
    }
    if (code.strict) {
        var strict = true;
    } else {
        var strict = false;
    }
    var functions = code.functions;
    for (var i = 0; i < functions.length; i++) {
        var f = functions[i];
        var fn = f.name;
        var fo = f.instantiate();
        var funcAlreadyDeclared = env.HasBinding(fn);
        if (funcAlreadyDeclared === false) {
            env.CreateMutableBinding(fn, configurableBindings);
        } else if (env === realm.theGlobalEnvironment.envRec) {
            var go = realm.theGlobalObject;
            var existingProp = go.GetProperty(fn);
            if (existingProp.Configurable === true) {
                go.DefineOwnProperty(fn, DataPropertyDescriptor(undefined, true, true, configurableBindings), true);
            } else if (IsAccessorDescriptor(existingProp) ||
                !(existingProp.Writable === true && existingProp.Enumerable === true)) throw VMTypeError();
        }
        env.SetMutableBinding(fn, fo, strict);
    }
    var variables = code.variables;
    for (var i = 0; i < variables.length; i++) {
        var dn = variables[i];
        var varAlreadyDeclared = env.HasBinding(dn);
        if (varAlreadyDeclared === false) {
            env.CreateMutableBinding(dn, configurableBindings);
            env.SetMutableBinding(dn, undefined, strict);
        }
    }
}

function compileDeclarationBindingInstantiation0(ctx, code) {
    var names = code.parameters;
    var strict = code.strict;
    var envClass = Object.create(null);
    var staticEnv = code.varEnv;
    ctx.text("var LexicalEnvironment=F.Scope;");
    ctx.compileNewDeclarativeEnvironment(staticEnv);
    ctx.text("var VariableEnvironment=LexicalEnvironment;");
    for (var i = 0; i < names.length; i++) {
        var argName = names[i];
        if (!envClass[argName]) {
            envClass[argName] = true;
            ctx.compileCreateMutableBinding(staticEnv, argName);
        }
        var v = ctx.constantValue("argumentsList[" + i + "]");
        ctx.compileSetMutableBinding(staticEnv, argName, v, strict);
    }
    var functions = code.functions;
    for (var i = 0; i < functions.length; i++) {
        var f = functions[i];
        var fn = f.name;
        if (!envClass[fn]) {
            envClass[fn] = true;
            ctx.compileCreateMutableBinding(staticEnv, fn);
        }
        var fo = f.compile(ctx);
        ctx.compileSetMutableBinding(staticEnv, fn, fo, strict);
    }
    if (!envClass["arguments"] && (code.existsDirectEval || code.existsArgumentsRef)) {
        envClass["arguments"] = true;
        var argsObj = ctx.defineObject("CreateArgumentsObject(VariableEnvironment,F,argumentsList)");
        if (strict) {
            ctx.compileCreateImmutableBinding(staticEnv, 'arguments');
            ctx.compileInitializeImmutableBinding(staticEnv, 'arguments', argsObj);
        } else {
            ctx.compileCreateMutableBinding(staticEnv, 'arguments');
            ctx.compileSetMutableBinding(staticEnv, 'arguments', argsObj, false);
        }
    }
    var variables = code.variables;
    for (var i = 0; i < variables.length; i++) {
        var dn = variables[i];
        if (!envClass[dn]) {
            envClass[dn] = true;
            ctx.compileCreateMutableBinding(staticEnv, dn);
            ctx.compileSetMutableBinding(staticEnv, dn, COMPILER_UNDEFINED_VALUE, strict);
        }
    }
}

function CreateArgumentsObject(env, func, args) {
    var code = func.Code;
    var names = code.parameters;
    var strict = code.strict;
    var len = args.length;
    if (strict === true || len === 0 || names.length === 0) {
        var obj = VMObject(CLASSID_PlainArguments);
    } else {
        var obj = VMObject(CLASSID_Arguments);
    }
    obj.Prototype = realm.Object_prototype;
    obj.Extensible = true;
    define(obj, "length", len);
    var map = [];
    var mappedNames = [];
    var indx = len - 1;
    while (indx >= 0) {
        var val = args[indx];
        defineFree(obj, indx, val);
        if (indx < names.length) {
            var name = names[indx];
            if (strict === false && isIncluded(name, mappedNames) === false) {
                mappedNames.push(name);
                map[indx] = name;
            }
        }
        var indx = indx - 1;
    }
    if (mappedNames.length !== 0) {
        obj.ParameterMap = map;
        obj.ArgumentsScope = env;
    }
    if (strict === false) {
        define(obj, "callee", func);
    } else {
        var thrower = realm.theThrowTypeError;
        intrinsic_createAccessor(obj, "caller", thrower, thrower, false, false);
        intrinsic_createAccessor(obj, "callee", thrower, thrower, false, false);
    }
    return obj;
}

function ArgGet(env, name) {
    var ref = GetIdentifierReference(env, name, false);
    return GetValue(ref);
}

function ArgSet(env, name, value) {
    var ref = GetIdentifierReference(env, name, false);
    PutValue(ref, value);
}

function Arguments_Get(P) {
    var map = this.ParameterMap;
    if (ToArrayIndex(P) >= 0) {
        var isMapped = map[P];
    }
    if (isMapped === undefined) {
        var v = default_Get.call(this, P);
        if (P === "caller" && Type(v) === TYPE_Object && v.Class === "Function" && v.Code !== undefined && v.Code.strict)
            throw VMTypeError();
        return v;
    } else {
        return ArgGet(this.ArgumentsScope, isMapped);
    }
}

function Arguments_GetOwnProperty(P) {
    var desc = default_GetOwnProperty.call(this, P);
    if (desc === undefined) return desc;
    var map = this.ParameterMap;
    if (ToArrayIndex(P) >= 0) {
        var isMapped = map[P];
    }
    if (isMapped !== undefined) {
        desc = DataPropertyDescriptor(ArgGet(this.ArgumentsScope, isMapped), desc.Writable, desc.Enumerable, desc.Configurable);
    }
    return desc;
}

function Arguments_DefineOwnProperty(P, Desc, Throw) {
    var map = this.ParameterMap;
    if (ToArrayIndex(P) >= 0) {
        var isMapped = map[P];
    }
    var allowed = default_DefineOwnProperty.call(this, P, Desc, false);
    if (allowed === false) {
        if (Throw === true) throw VMTypeError();
        else return false;
    }
    if (isMapped !== undefined) {
        if (IsAccessorDescriptor(Desc) === true) {
            map[P] = undefined;
        } else {
            if (Desc.Value !== absent) {
                ArgSet(this.ArgumentsScope, isMapped, Desc.Value);
            }
            if (Desc.Writable === false) {
                map[P] = undefined;
            }
        }
    }
    return true;
}

function Arguments_Delete(P, Throw) {
    var map = this.ParameterMap;
    if (ToArrayIndex(P) >= 0) {
        var isMapped = map[P];
    }
    var result = default_Delete.call(this, P, Throw);
    if (result === true && isMapped !== undefined) {
        map[P] = undefined;
    }
    return result;
}

function Global_FastGetBindingValue(N, S) {
    var bindings = realm.theGlobalObject;
    var desc = bindings.properties[N];
    if (desc === undefined) {
        var proto = bindings.Prototype;
        if (proto === null) {
            if (S === false) return undefined;
            throw VMReferenceError(N);
        }
        var desc = proto.GetProperty(P);
        if (desc === undefined) {
            if (S === false) return undefined;
            throw VMReferenceError(N);
        }
    }
    if (desc.Value !== absent) return desc.Value;
    else {
        assert(IsAccessorDescriptor(desc), desc);
        var getter = desc.Get;
        if (getter === undefined) {
            return undefined;
        }
        return getter.Call(binding, []);
    }
}
