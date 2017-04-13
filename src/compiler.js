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

// constructor
function CompilerTypes() {
    var A = [];
    for (var i = 0; i < arguments.length; i++) {
        var a = arguments[i];
        if (a instanceof CompilerTypes) a = a.types;
        A[i] = a;
    }
    this.types = Array.prototype.concat.apply([], A);
}

const COMPILER_NONE_TYPE = new CompilerTypes();
const COMPILER_UNDEFINED_TYPE = new CompilerTypes("undefined");
const COMPILER_NULL_TYPE = new CompilerTypes("null");
const COMPILER_BOOLEAN_TYPE = new CompilerTypes("boolean");
const COMPILER_NUMBER_TYPE = new CompilerTypes("number");
const COMPILER_STRING_TYPE = new CompilerTypes("string");
const COMPILER_OBJECT_TYPE = new CompilerTypes("object");
const COMPILER_PRIMITIVE_TYPE = new CompilerTypes("undefined", "null", "boolean", "number", "string");
const COMPILER_VALUE_TYPE = new CompilerTypes(COMPILER_PRIMITIVE_TYPE, "object");
const COMPILER_GLOBAL_REFERENCE_TYPE = new CompilerTypes("gref");
const COMPILER_LOCAL_REFERENCE_TYPE = new CompilerTypes("lref");
const COMPILER_IDENTIFIER_REFERENCE_TYPE = new CompilerTypes("iref");
const COMPILER_PROPERTY_REFERENCE_TYPE = new CompilerTypes("pref");
const COMPILER_REF_TYPE = new CompilerTypes("gref", "lref", "iref", "pref");
const COMPILER_FUNCTION_ENV_TYPE = new CompilerTypes("fenv");
const COMPILER_CATCH_ENV_TYPE = new CompilerTypes("cenv");
const COMPILER_NAMED_FUNCTION_ENV_TYPE = new CompilerTypes("nenv");
const COMPILER_GLOBAL_ENV_TYPE = new CompilerTypes("genv");
const COMPILER_ENV_TYPE = new CompilerTypes("fenv", "cenv", "nenv", "genv", "oenv");
const COMPILER_ANY_TYPE = new CompilerTypes(COMPILER_VALUE_TYPE, COMPILER_REF_TYPE, COMPILER_ENV_TYPE, "list");

const COMPILER_UNDEFINED_VALUE = {
    name: "undefined",
    types: COMPILER_UNDEFINED_TYPE,
    isLiteral: true,
    value: undefined
};

const COMPILER_TRUE_VALUE = {
    name: "true",
    types: COMPILER_BOOLEAN_TYPE,
    isLiteral: true,
    value: true
};

const COMPILER_FALSE_VALUE = {
    name: "false",
    types: COMPILER_BOOLEAN_TYPE,
    isLiteral: true,
    value: false
};

CompilerTypes.prototype.isPrimitive = function() {
    return this.types.every(function(type) {
        return (COMPILER_PRIMITIVE_TYPE.types.indexOf(type) >= 0);
    });
};

CompilerTypes.prototype.isValue = function() {
    return this.types.every(function(type) {
        if (COMPILER_VALUE_TYPE.types.indexOf(type) >= 0) return true;
    });
};

CompilerTypes.prototype.isObject = function() {
    return this.types.every(function(type) {
        return type === "object";
    });
};

CompilerTypes.prototype.isNotObject = function() {
    return this.types.every(function(type) {
        return type !== "object";
    });
};

CompilerTypes.prototype.isString = function() {
    return this.types.every(function(type) {
        return type === "string";
    });
};

CompilerTypes.prototype.isNotString = function() {
    return this.types.every(function(type) {
        return type !== "string";
    });
};

CompilerTypes.prototype.isNumber = function() {
    return this.types.every(function(type) {
        return type === "number";
    });
};

CompilerTypes.prototype.isBoolean = function() {
    return this.types.every(function(type) {
        return type === "boolean";
    });
};

CompilerTypes.prototype.isNotNull = function() {
    return this.types.every(function(type) {
        return type !== "null";
    });
};

CompilerTypes.prototype.isNotUndefined = function() {
    return this.types.every(function(type) {
        return type !== "undefined";
    });
};

// constructor
function CompilerContext(params) {
    this.params = params;
    this.texts = ["'use strict';"];
    this.literals = [];
    this.variables = 0;
    this.iterables = 0;
    this.switches = 0;
    this.labels = [];
}

CompilerContext.prototype.compileExpression = function(expr) {
    assert(expr.compile, expr.toString()); // check if all expressions have own compilers
    if (expr.compile) {
        return expr.compile(this);
    }
    // compiler doesn't exist (under development)
    var name = this.literal(expr);
    return this.defineAny(name + "()");
};

CompilerContext.prototype.compileStatement = function(stmt) {
    assert(stmt.compile, stmt.toString()); // check if all statements have own compilers
    if (stmt.compile) {
        stmt.compile(this);
        return;
    }
    // compiler doesn't exist (under development)
    var name = this.literal(stmt);
    this.text("var stmt= " + name + "();");
    this.text("if(stmt.type==='return')return stmt.value;");
    this.text("if(stmt.type==='throw')throw stmt.value;");
    this.text("assert(stmt.target===empty,stmt);");
    if (this.iterables) {
        this.text("if(stmt.type==='continue')continue;");
    }
    if (this.iterables || this.switches) {
        this.text("if(stmt.type==='break')break;");
    }
    this.text("assert(stmt.type==='normal',stmt);");
};

CompilerContext.expression = function(compile) {
    var delayed;

    function evaluate() {
        if (!delayed) {
            var ctx = new CompilerContext();
            var v = compile(ctx);
            ctx.compileReturn(v);
            delayed = ctx.finish();
        }
        return delayed();
    }
    evaluate.compile = compile;
    return evaluate;
};

CompilerContext.reference = function(compile) {
    var delayed;

    function evaluate() {
        if (!delayed) {
            var ctx = new CompilerContext();
            var ref = compile(ctx);
            ctx.text("return ReferenceValue(" + ref.base.name + "," + ref.name + "," + ref.strict + ");");
            delayed = ctx.finish();
        }
        return delayed();
    }
    evaluate.compile = compile;
    return evaluate;
};

CompilerContext.statement = function(evaluate, compile) {
    evaluate.compile = compile;
    return evaluate;
};

CompilerContext.prototype.text = function(text) {
    this.texts.push(text);
};

CompilerContext.prototype.literal = function(value) {
    var n = this.literals.length;
    this.literals.push(value);
    return "literals[" + n + "]";
};

CompilerContext.prototype.quote = function(x) {
    switch (typeof x) {
        case "string":
            if (x.length > 100) return this.literal(x);
            for (var i = 0; i < x.length; i++) {
                var c = x.charCodeAt(i);
                if (c < 0x20 || 0x7e < c || c === 0x22 || c === 0x5c) return this.literal(x);
            }
            return '"' + x + '"';
        case "number":
            if (Math.floor(x) === x && Math.abs(x) < 1000000000) {
                if (x >= 0) return String(x);
                else return "(" + String(x) + ")";
            }
            return this.literal(x);
        case "boolean":
            return String(x);
    }
    assert(x === null);
    return "null";
};

CompilerContext.prototype.constant = function(str, types) {
    return {
        name: str,
        types: types,
    };
};

CompilerContext.prototype.constantValue = function(str) {
    return this.constant(str, COMPILER_VALUE_TYPE);
};

CompilerContext.prototype.constantAny = function(str) {
    return this.constant(str, COMPILER_ANY_TYPE);
};

CompilerContext.prototype.constantObject = function(str) {
    return this.constant(str, COMPILER_OBJECT_TYPE);
};

CompilerContext.prototype.constantString = function(str) {
    return this.constant(str, COMPILER_STRING_TYPE);
};

CompilerContext.prototype.constantNumber = function(str) {
    return this.constant(str, COMPILER_NUMBER_TYPE);
};

CompilerContext.prototype.constantBoolean = function(str) {
    return this.constant(str, COMPILER_BOOLEAN_TYPE);
};

CompilerContext.prototype.constantPrimitive = function(str) {
    return this.constant(str, COMPILER_PRIMITIVE_TYPE);
};

CompilerContext.prototype.define = function(str, types) {
    assert(types);
    var name = "tmp" + (this.variables++);
    if (str) this.text("var " + name + "= " + str + ";");
    return {
        name: name,
        types: types,
        isVariable: true,
    };
};

CompilerContext.prototype.defineValue = function(str) {
    return this.define(str, COMPILER_VALUE_TYPE);
};

CompilerContext.prototype.defineAny = function(str) {
    return this.define(str, COMPILER_ANY_TYPE);
};

CompilerContext.prototype.defineObject = function(str) {
    return this.define(str, COMPILER_OBJECT_TYPE);
};

CompilerContext.prototype.defineString = function(str) {
    return this.define(str, COMPILER_STRING_TYPE);
};

CompilerContext.prototype.defineNumber = function(str) {
    return this.define(str, COMPILER_NUMBER_TYPE);
};

CompilerContext.prototype.defineBoolean = function(str) {
    return this.define(str, COMPILER_BOOLEAN_TYPE);
};

CompilerContext.prototype.definePrimitive = function(str) {
    return this.define(str, COMPILER_PRIMITIVE_TYPE);
};

CompilerContext.prototype.unify = function(val) {
    if (val.isVariable || val.isLiteral || val.isSpecial) return val;
    assert(val.types.isValue());
    return this.define(val.name, val.types);
};

CompilerContext.prototype.toMergeable = function(val) {
    if (val.isVariable) return val;
    return this.define(val.name, val.types);
};

CompilerContext.prototype.mergeDefine = function(mval, str, types) {
    assert(mval.isVariable, mval);
    this.text("var " + mval.name + "= " + str + ";");
    mval.types = new CompilerTypes(mval.types, types);
    return mval;
};

CompilerContext.prototype.mergeString = function(mval, str) {
    return this.mergeDefine(mval, str, COMPILER_STRING_TYPE);
};

CompilerContext.prototype.mergeValue = function(mval, str) {
    return this.mergeDefine(mval, str, COMPILER_VALUE_TYPE);
};

CompilerContext.prototype.merge = function(mval, rval) {
    return this.mergeDefine(mval, rval.name, rval.types);
};

CompilerContext.prototype.finish = function() {
    var code = this.texts.join('\n');
    try {
        if (this.literals.length === 0) {
            return new Function(this.params, code);
        }
        return new Function("literals", this.params, code).bind(undefined, this.literals);
    } catch (e) {
        console.error("COMPILE ERROR:\n" + code);
        console.error(e);
        process.reallyExit(1);
    }
};

CompilerContext.prototype.compileReturn = function(val) {
    this.text("return " + val.name + ";");
}

function analyzeStaticEnv(env) {
    env.inners.forEach(function(inner) {
        analyzeStaticEnv(inner);
        env.existsDirectEval |= inner.existsDirectEval;
        inner.refs.forEach(function(name) {
            if (env.code === inner.code) {
                if (!isIncluded(name, inner.defs)) setIncluded(name, env.refs);
            } else {
                env.existsOuterFunction |= true;
                if (!isIncluded(name, inner.defs)) setIncluded(name, env.inboundRefs);
            }
            env.existsOuterFunction |= inner.existsOuterFunction;
        });
        inner.inboundRefs.forEach(function(name) {
            if (!isIncluded(name, inner.defs)) setIncluded(name, env.inboundRefs);
        });
    });
    if (env.existsDirectEval || env.code.existsWithStatement) return;
    if (env.code.type !== "function" || env.type === "with") return;
    env.defs.forEach(function(name) {
        if (env.code.existsArgumentsRef && !env.code.strict && isIncluded(name, env.code.parameters)) return;
        if (!isIncluded(name, env.inboundRefs)) setIncluded(name, env.locals);
    });

    if (!env.existsOuterFunction && env.defs.length === env.locals.length) env.collapsed = true;
}

CompilerContext.prototype.compileNewDeclarativeEnvironment = function(staticEnv) {
    if (staticEnv.collapsed) return null;
    var oldEnv = this.defineAny("LexicalEnvironment");
    this.text("LexicalEnvironment=NewDeclarativeEnvironment(LexicalEnvironment);");
    return oldEnv;
};

CompilerContext.prototype.compileCreateMutableBinding = function(staticEnv, name) {
    if (isIncluded(name, staticEnv.locals)) {
        staticEnv.bindings[name] = "V" + (this.variables++);
        this.text("var " + staticEnv.bindings[name] + "; // " + name);
    } else {
        assert(isIncluded(name, staticEnv.defs));
        this.text("LexicalEnvironment.CreateMutableBinding(" + this.quote(name) + ");");
    }
};

CompilerContext.prototype.compileSetMutableBinding = function(staticEnv, name, val, strict) {
    if (isIncluded(name, staticEnv.locals)) {
        this.text(staticEnv.bindings[name] + " = " + val.name);
    } else {
        assert(isIncluded(name, staticEnv.defs));
        this.text("LexicalEnvironment.SetMutableBinding(" + this.quote(name) + "," + val.name + "," + strict + ");");
    }
};

CompilerContext.prototype.compileCreateImmutableBinding = function(staticEnv, name) {
    if (isIncluded(name, staticEnv.locals)) {
        staticEnv.bindings[name] = "V" + (this.variables++);
        this.text("var " + staticEnv.bindings[name] + "; // " + name);
    } else {
        assert(isIncluded(name, staticEnv.defs));
        this.text("LexicalEnvironment.CreateImmutableBinding(" + this.quote(name) + ");");
    }
};

CompilerContext.prototype.compileInitializeImmutableBinding = function(staticEnv, name, val) {
    if (isIncluded(name, staticEnv.locals)) {
        this.text(staticEnv.bindings[name] + " = " + val.name);
    } else {
        assert(isIncluded(name, staticEnv.defs));
        this.text("LexicalEnvironment.InitializeImmutableBinding(" + this.quote(name) + "," + val.name + ");");
    }
};

CompilerContext.prototype.compileGetIdentifierReferece = function(staticEnv, name, strict) {
    var qname = this.quote(name);
    var resolvable = false;
    var ambiguous = false;
    var skip = 0;
    var env = staticEnv;
    while (env) {
        if (isIncluded(name, env.locals)) {
            assert(env.code === staticEnv.code);
            assert(!ambiguous);
            return {
                name: name,
                types: COMPILER_LOCAL_REFERENCE_TYPE,
                base: env,
            };
        }
        if (isIncluded(name, env.defs)) {
            resolvable = true;
            break;
        }
        if (env.existsDirectEval || !(env.type === "function" || env.type === "catch" || env.type === "named-function")) {
            ambiguous = true;
        }
        if (!ambiguous && !env.collapsed) {
            skip++;
        }
        env = env.outer;
    }
    var types = COMPILER_ANY_TYPE;
    if (resolvable) {
        var types = COMPILER_ENV_TYPE;
        if (!ambiguous) {
            if (env.type === "function") var types = COMPILER_FUNCTION_ENV_TYPE;
            else if (env.type === "global") var types = COMPILER_GLOBAL_ENV_TYPE;
            else if (env.type === "catch") var types = COMPILER_CATCH_ENV_TYPE;
            else if (env.type === "named-function") var types = COMPILER_NAMED_FUNCTION_ENV_TYPE;
        }
    }
    if (resolvable && !ambiguous) {
        if (skip === 0) var base = {
            name: "LexicalEnvironment",
            types: types,
            isSpecial: true,
        };
        else if (skip === 1) var base = this.constant("LexicalEnvironment.outer", types);
        else if (env.type === "global") var base = this.constant("realm.theGlobalEnvironment", types);
        else var base = this.define("SkipEnvironmentRecord(LexicalEnvironment," + skip + ")", types);
    } else {
        var base = this.define("GetIdentifierEnvironmentRecord(LexicalEnvironment," + skip + "," + qname + ")", types);
    }
    return {
        name: qname,
        types: COMPILER_IDENTIFIER_REFERENCE_TYPE,
        base: base,
        strict: strict
    };
};

CompilerContext.prototype.compileGetValue = function(ref) {
    if (ref.types.isValue()) return ref;
    if (ref.types === COMPILER_PROPERTY_REFERENCE_TYPE) {
        var base = ref.base;
        if (base.types.isObject()) {
            return this.defineValue(base.name + " .Get(" + ref.name + ")");
        }
        if (base.types.isNotObject()) {
            return this.defineValue("specialGet(" + base.name + "," + ref.name + ")");
        }
        this.text("if(typeof " + base.name + " ==='object')");
        var mval = this.defineValue(base.name + " .Get(" + ref.name + ")");
        this.text("else");
        this.mergeValue(mval, "specialGet(" + base.name + "," + ref.name + ")");
        return mval;
    } else if (ref.types === COMPILER_IDENTIFIER_REFERENCE_TYPE) {
        var base = ref.base;
        if (base.types === COMPILER_FUNCTION_ENV_TYPE || base.types === COMPILER_CATCH_ENV_TYPE ||
            base.types === COMPILER_NAMED_FUNCTION_ENV_TYPE) {
            return this.defineValue(base.name + " .values[" + ref.name + "]");
        } else if (base.types === COMPILER_GLOBAL_ENV_TYPE) {
            return this.defineValue("Global_FastGetBindingValue(" + ref.name + ")");
        }
        if (!base.types.isNotUndefined()) {
            this.text("if(" + base.name + " ===undefined)throw VMReferenceError(" + ref.name + " +' is not defined');");
        }
        return this.defineValue(base.name + " .GetBindingValue(" + ref.name + "," + ref.strict + ")");
    } else if (ref.types === COMPILER_LOCAL_REFERENCE_TYPE) {
        return this.defineValue(ref.base.bindings[ref.name]);
    } else {
        return this.defineValue("GetValue(" + ref.name + ")");
    }
};

CompilerContext.prototype.compilePutValue = function(ref, val) {
    if (ref.types === COMPILER_PROPERTY_REFERENCE_TYPE) {
        var base = ref.base;
        if (base.types.isObject()) {
            this.text(base.name + " .Put(" + ref.name + "," + val.name + "," + ref.strict + ");");
            return;
        }
        if (base.types.isNotObject()) {
            this.text("specialPut(" + base.name + "," + ref.name + "," + val.name + "," + ref.strict + ");");
            return;
        }
        this.text("if(typeof " + base.name + " ==='object')");
        this.text(base.name + " .Put(" + ref.name + "," + val.name + "," + ref.strict + ");");
        this.text("else");
        this.text("specialPut(" + base.name + "," + ref.name + "," + val.name + "," + ref.strict + ");");
    } else if (ref.types === COMPILER_IDENTIFIER_REFERENCE_TYPE) {
        var base = ref.base;
        if (base.types === COMPILER_FUNCTION_ENV_TYPE || base.types === COMPILER_CATCH_ENV_TYPE) {
            this.text(base.name + " .values[" + ref.name + "]= " + val.name + ";");
            return;
        } else if (base.types === COMPILER_GLOBAL_ENV_TYPE) {
            this.text("realm.theGlobalObject.Put(" + ref.name + "," + val.name + "," + ref.strict + ");");
            return;
        }
        if (!base.types.isNotUndefined()) {
            this.text("if(" + base.name + " ===undefined)");
            if (ref.strict) this.text("throw VMReferenceError(" + ref.name + " +' is not defined');");
            else this.text("realm.theGlobalObject.Put(" + ref.name + "," + val.name + ",false);");
            this.text("else");
        }
        this.text(base.name + " .SetMutableBinding(" + ref.name + "," + val.name + "," + ref.strict + ");");
    } else if (ref.types === COMPILER_LOCAL_REFERENCE_TYPE) {
        this.text(ref.base.bindings[ref.name] + " = " + val.name + ";");
    } else {
        this.text("PutValue(" + ref.name + "," + val.name + ");");
    }
};

CompilerContext.prototype.compileToNumber = function(val) {
    if (val.types.isNumber()) return val;
    return this.defineNumber("typeof " + val.name + " === 'number'? " + "+ " + val.name + //
        " :+FastToNumber(" + val.name + ")");
};

CompilerContext.prototype.compileToString = function(val) {
    if (val.types.isString()) return val;
    if (val.types.isPrimitive()) return this.constantString("String(" + val.name + ")");
    return this.defineString("FastToString(" + val.name + ")");
};

CompilerContext.prototype.compileToObject = function(val) {
    if (val.types.isObject()) return val;
    return this.defineObject("FastToObject(" + val.name + ")");
};

CompilerContext.prototype.compileToPrimitive = function(val, hint) {
    if (val.types.isPrimitive()) return val;
    if (hint) {
        return this.definePrimitive("FastToPrimitive(" + val.name + "," + hint + ")");
    } else {
        return this.definePrimitive("typeof " + val.name + " !== 'object'? " + val.name + //
            " :FastToPrimitive(" + val.name + ")");
    }
};

CompilerContext.prototype.compileEvaluateArguments = function(args) {
    var argList = this.defineAny("[]");
    for (var i = 0; i < args.length; i++) {
        var ref = this.compileExpression(args[i]);
        var arg = this.compileGetValue(ref);
        this.text(argList.name + " .push(" + arg.name + ");");
    }
    return argList;
};

CompilerContext.prototype.compileRunningPos = function(pos) {
    this.text("runningSourcePos= " + pos + ";"); // TODO delayed
};

CompilerContext.prototype.openLabel = function(identifier) {
    var i = this.labels.length;
    this.labels.push(identifier);
    return "L" + i;
};

CompilerContext.prototype.closeLabel = function(identifier) {
    var exp = this.labels.pop();
    assert(exp === identifier, identifier);
};

CompilerContext.prototype.findLabel = function(identifier) {
    var i = this.labels.length;
    while (i-- !== 0) {
        if (identifier === this.labels[i]) return "L" + i;
    }
    assert(false, identifier);
}

CompilerContext.prototype.compileLabelset = function(labelset) {
    if (!labelset) return;
    for (var i = 0; i < labelset.length; i++) {
        this.text(this.findLabel(labelset[i]) + ":");
    }
}
