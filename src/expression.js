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

// ECMAScript 5.1: 11 Expressions

function ThisExpression() {
    var evaluate = function() {
        return ThisBinding;
    };
    evaluate.compile = (function(ctx) {
        return {
            name: "ThisBinding",
            types: COMPILER_VALUE_TYPE,
            isSpecial: true,
        };
    });
    return evaluate;
}

function IdentifierReference(staticEnv, identifier, strict) {
    var evaluate = function() {
        var env = LexicalEnvironment;
        return GetIdentifierReference(env, identifier, strict);
    };
    evaluate.compile = (function(ctx) {
        return ctx.compileGetIdentifierReferece(staticEnv, identifier, strict);
    });
    return evaluate;
}

function Literal(value) {
    var evaluate = function() {
        return value;
    };
    evaluate.compile = (function(ctx) {
        switch (Type(value)) {
            case TYPE_Number:
                var types = COMPILER_NUMBER_TYPE;
                break;
            case TYPE_String:
                var types = COMPILER_STRING_TYPE;
                break;
            case TYPE_Undefined:
                var types = COMPILER_UNDEFINED_TYPE;
                break;
            case TYPE_Null:
                var types = COMPILER_NULL_TYPE;
                break;
            case TYPE_Boolean:
                var types = COMPILER_BOOLEAN_TYPE;
                break;
            default:
                assert(false, value);
        }
        return {
            name: ctx.quote(value),
            types: types,
            isLiteral: true,
            value: value
        };
    });
    return evaluate;
}

function RegExpLiteral(regexp) {
    function evaluate() {
        return RegExpFactory.createRegExpObject(regexp);
    }
    evaluate.compile = (function(ctx) {
        return ctx.defineObject("RegExpFactory.createRegExpObject(" + ctx.literal(regexp) + ")");
    });
    return evaluate;
}

function ArrayInitialiser(elements) {
    return CompilerContext.expression(function(ctx) {
        var length = elements.length;
        if (elements[length - 1] === empty) {
            length = length - 1;
        }
        var array = ctx.defineObject("Array_Construct([])");
        ctx.text("intrinsic_set_value(" + array.name + ",'length'," + length + ");");
        for (var i = 0; i < length; i++) {
            var e = elements[i];
            if (e !== empty) {
                var initResult = ctx.compileExpression(e);
                var initValue = ctx.compileGetValue(initResult);
                ctx.text("intrinsic_createData(" + array.name + "," + i + "," + initValue.name + ",true,true,true);");
            }
        }
        return array;
    });
}

function ObjectInitialiser(elements) {
    return CompilerContext.expression(function(ctx) {
        var obj = ctx.defineObject("Object_Construct([])");
        for (var i = 0; i < elements.length; i++) {
            elements[i](ctx, obj);
        }
        return obj;
    });
}

function PropertyAssignment(name, expression) {
    return function(ctx, obj) {
        var exprValue = ctx.compileExpression(expression);
        var propValue = ctx.compileGetValue(exprValue);
        if (name === '__proto__') {
            ctx.text("set_Object_prototype___proto__(" + obj.name + ",[" + propValue.name + "]);");
            return;
        }
        ctx.text("intrinsic_createData(" + obj.name + "," + ctx.quote(name) + "," + propValue.name + ",true,true,true);");
    };
}

function PropertyAssignmentGet(name, body) {
    return function(ctx, obj) {
        var closure = ctx.constantValue("CreateFunction(" + ctx.literal(body) + ",LexicalEnvironment)");
        var desc = ctx.constantAny("AccessorPropertyDescriptor(" + closure.name + ",absent,true,true)");
        ctx.text(obj.name + " .DefineOwnProperty(" + ctx.quote(name) + "," + desc.name + ",false);");
    };
}

function PropertyAssignmentSet(name, body) {
    return function(ctx, obj) {
        var closure = ctx.constantValue("CreateFunction(" + ctx.literal(body) + ",LexicalEnvironment)");
        var desc = ctx.constantAny("AccessorPropertyDescriptor(absent," + closure.name + ",true,true)");
        ctx.text(obj.name + " .DefineOwnProperty(" + ctx.quote(name) + "," + desc.name + ",false);");
    };
}

function PropertyAccessor(base, name, strict) {
    return CompilerContext.reference(function(ctx) {
        var baseReference = ctx.compileExpression(base);
        var baseValue = ctx.compileGetValue(baseReference);
        var propertyNameReference = ctx.compileExpression(name);
        var propertyNameValue = ctx.compileGetValue(propertyNameReference);
        if (!(baseValue.types.isNotUndefined() && baseValue.types.isNotNull())) {
            propertyNameValue = ctx.unify(propertyNameValue);
            baseValue = ctx.unify(baseValue);
            ctx.text("if(" + baseValue.name + " ===undefined|| " + baseValue.name + " ===null)" + //
                "throwPropertyAccessorError(" + baseValue.name + "," + propertyNameValue.name + ");");
        }
        if (!propertyNameValue.types.isNotObject()) {
            propertyNameValue = ctx.defineValue("ToPropertyName(" + propertyNameValue.name + ")");
        }
        return {
            name: propertyNameValue.name,
            types: COMPILER_PROPERTY_REFERENCE_TYPE,
            base: baseValue,
            strict: strict
        };
    });
}

function throwPropertyAccessorError(base, name) {
    if (Type(name) === TYPE_Object) {
        throw VMTypeError("Cannot read property of " + base);
    }
    throw VMTypeError("Cannot read property '" + name + "' of " + base);
}

function NewOperator(expression, args) {
    return CompilerContext.expression(function(ctx) {
        var ref = ctx.compileExpression(expression);
        var cntr = ctx.compileGetValue(ref);
        var argList = ctx.compileEvaluateArguments(args);
        if (cntr.types.isNotObject()) {
            ctx.text("throwNotAFunctionError(" + cntr.name + ");");
            return COMPILER_UNDEFINED_VALUE;
        }
        cntr = ctx.unify(cntr);
        ctx.text("if(! " + cntr.name + " ||! " + cntr.name + " .Construct)throwNotAFunctionError(" + cntr.name + ");");
        var mval = ctx.defineValue(cntr.name + " .Construct(" + argList.name + ")");
        return mval;
    });
}

function FunctionCall(expression, args, strict) {
    return CompilerContext.expression(function(ctx) {
        var ref = ctx.compileExpression(expression);
        var func = ctx.compileGetValue(ref);
        var argList = ctx.compileEvaluateArguments(args);
        if (func.types.isNotObject()) {
            ctx.text("throwNotAFunctionError(" + func.name + ");");
            return COMPILER_UNDEFINED_VALUE;
        }
        func = ctx.unify(func);
        ctx.text("if(! " + func.name + " ||! " + func.name + " .Call)throwNotAFunctionError(" + func.name + ");");
        if (ref.types === COMPILER_PROPERTY_REFERENCE_TYPE) {
            var thisValue = ref.base;
        } else if (ref.types === COMPILER_IDENTIFIER_REFERENCE_TYPE) {
            var base = ref.base;
            if (base.types === COMPILER_FUNCTION_ENV_TYPE || base.types === COMPILER_GLOBAL_ENV_TYPE ||
                base.types === COMPILER_CATCH_ENV_TYPE || base.types === COMPILER_NAMED_FUNCTION_ENV_TYPE) {
                var thisValue = COMPILER_UNDEFINED_VALUE;
            } else {
                var thisValue = ctx.defineValue(ref.base.name + " .ImplicitThisValue()");
            }
        } else if (ref.types === COMPILER_LOCAL_REFERENCE_TYPE) {
            var thisValue = COMPILER_UNDEFINED_VALUE;
        } else {
            assert(ref.types.isValue(), ref); // provided that all expressions have own compilers
            var thisValue = COMPILER_UNDEFINED_VALUE;
        }
        if (ref.name === '"eval"' && ref.types === COMPILER_IDENTIFIER_REFERENCE_TYPE) {
            ctx.text("if(" + func.name + " ===realm.theEvalFunction)");
            var mval = ctx.defineValue("Global_eval(" + thisValue.name + "," + argList.name + ",true," + strict +
                ",LexicalEnvironment,VariableEnvironment,ThisBinding)");
            ctx.text("else");
            ctx.mergeValue(mval, func.name + " .Call(" + thisValue.name + "," + argList.name + ")");
        } else {
            var mval = ctx.defineValue(func.name + " .Call(" + thisValue.name + "," + argList.name + ")");
        }
        return mval;
    });
}

function throwNotAFunctionError(name) {
    throw VMTypeError(typeof name + " is not a function");
}

function PostfixIncrementOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var lhs = ctx.compileExpression(expression);
        var oldValue = ctx.compileToNumber(ctx.compileGetValue(lhs));
        var newValue = ctx.constantNumber("(" + oldValue.name + " +1)");
        ctx.compilePutValue(lhs, newValue);
        return oldValue;
    });
}

function PostfixDecrementOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var lhs = ctx.compileExpression(expression);
        var oldValue = ctx.compileToNumber(ctx.compileGetValue(lhs));
        var newValue = ctx.constantNumber("(" + oldValue.name + " -1)");
        ctx.compilePutValue(lhs, newValue);
        return oldValue;
    });
}

function deleteOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var ref = ctx.compileExpression(expression);
        var base = ref.base;
        if (ref.types === COMPILER_PROPERTY_REFERENCE_TYPE) {
            return ctx.defineBoolean("ToObject(" + base.name + ").Delete(" + ref.name + "," + ref.strict + ");");
        } else if (ref.types === COMPILER_IDENTIFIER_REFERENCE_TYPE) {
            if (base.types.isNotUndefined()) {
                return ctx.defineBoolean(base.name + " .DeleteBinding(" + ref.name + ")");
            } else {
                ctx.text("if(" + base.name + " !==undefined){");
                var mval = ctx.defineBoolean(base.name + " .DeleteBinding(" + ref.name + ")");
                ctx.text("}else");
                ctx.merge(mval, COMPILER_TRUE_VALUE);
                return mval;
            }
        } else if (ref.types === COMPILER_LOCAL_REFERENCE_TYPE) {
            return COMPILER_FALSE_VALUE;
        } else {
            assert(ref.types.isValue(), ref); // provided that all expressions have own compilers
            return COMPILER_TRUE_VALUE;
        }
    });
}

function voidOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var expr = ctx.compileExpression(expression);
        ctx.compileGetValue(expr);
        return COMPILER_UNDEFINED_VALUE;
    });
}

function typeofOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var val = ctx.compileExpression(expression);
        if (val.types === COMPILER_PROPERTY_REFERENCE_TYPE) {
            var val = ctx.compileGetValue(val);
        } else if (val.types === COMPILER_IDENTIFIER_REFERENCE_TYPE) {
            var base = val.base;
            if (base.types.isNotUndefined()) {
                var val = ctx.compileGetValue(val);
            } else {
                ctx.text("if(" + val.base.name + " !==undefined){");
                var val = ctx.compileGetValue(val);
                val = ctx.toMergeable(val);
                ctx.text("}else");
                ctx.merge(val, COMPILER_UNDEFINED_VALUE);
            }
        } else if (val.types === COMPILER_LOCAL_REFERENCE_TYPE) {
            var val = ctx.compileGetValue(val);
        } else {
            assert(val.types.isValue(), val); // provided that all expressions have own compilers
        }
        if (val.types.isObject()) {
            return ctx.constantString("(" + val.name + " .Call?'function':'object')");
        }
        if (val.types.isNotObject()) {
            return ctx.constantString("(typeof " + val.name + ")");
        }
        val = ctx.unify(val);
        ctx.text("if(typeof(" + val.name + ")==='object'&& " + val.name + " !==null)");
        var mval = ctx.defineString(val.name + " .Call?'function':'object'");
        ctx.text("else");
        ctx.mergeString(mval, "typeof " + val.name);
        return mval;
    });
}

function PrefixIncrementOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var expr = ctx.compileExpression(expression);
        var oldValue = ctx.compileToNumber(ctx.compileGetValue(expr));
        var newValue = ctx.defineNumber(oldValue.name + " +1");
        ctx.compilePutValue(expr, newValue);
        return newValue;
    });
}

function PrefixDecrementOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var expr = ctx.compileExpression(expression);
        var oldValue = ctx.compileToNumber(ctx.compileGetValue(expr));
        var newValue = ctx.defineNumber(oldValue.name + " -1");
        ctx.compilePutValue(expr, newValue);
        return newValue;
    });
}

function PlusOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var expr = ctx.compileExpression(expression);
        return ctx.compileToNumber(ctx.compileGetValue(expr));
    });
}

function MinusOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var expr = ctx.compileExpression(expression);
        var oldValue = ctx.compileToNumber(ctx.compileGetValue(expr));
        return ctx.constantNumber("(- " + oldValue.name + ")");
    });
}

function BitwiseNOTOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var expr = ctx.compileExpression(expression);
        var oldValue = ctx.compileToNumber(ctx.compileGetValue(expr));
        return ctx.constantNumber("(~ " + oldValue.name + ")");
    });
}

function LogicalNOTOperator(expression) {
    return CompilerContext.expression(function(ctx) {
        var expr = ctx.compileExpression(expression);
        var oldValue = ctx.compileGetValue(expr);
        return ctx.constantBoolean("(! " + oldValue.name + ")");
    });
}

function MultiplicativeOperator(operator, leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var left = ctx.compileExpression(leftExpression);
        var leftValue = ctx.compileGetValue(left);
        var right = ctx.compileExpression(rightExpression);
        var rightValue = ctx.compileGetValue(right);
        var leftNum = ctx.compileToNumber(leftValue);
        var rightNum = ctx.compileToNumber(rightValue);
        switch (operator) {
            case '*':
                return ctx.constantNumber("(" + leftNum.name + " * " + rightNum.name + ")");
            case '/':
                return ctx.constantNumber("(" + leftNum.name + " / " + rightNum.name + ")");
            case '%':
                return ctx.constantNumber("(" + leftNum.name + " % " + rightNum.name + ")");
        }
    });
}

function AdditionOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        var lprim = ctx.compileToPrimitive(lval);
        var rprim = ctx.compileToPrimitive(rval);
        if (lprim.types.isString() || rprim.types.isString()) {
            return ctx.constantString("(" + lprim.name + " + " + rprim.name + ")");
        } else if (lprim.types.isNotString() && rprim.types.isNotString()) {
            return ctx.constantNumber("(" + lprim.name + " + " + rprim.name + ")");
        } else {
            return ctx.constantValue("(" + lprim.name + " + " + rprim.name + ")");
        }
    });
}

function SubtractionOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        var lnum = ctx.compileToNumber(lval);
        var rnum = ctx.compileToNumber(rval);
        return ctx.constantNumber("(" + lnum.name + " - " + rnum.name + ")");
    });
}

function LeftShiftOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        var lnum = ctx.compileToNumber(lval);
        var rnum = ctx.compileToNumber(rval);
        return ctx.constantNumber("(" + lnum.name + " << " + rnum.name + ")");
    });
}

function SignedRightShiftOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        var lnum = ctx.compileToNumber(lval);
        var rnum = ctx.compileToNumber(rval);
        return ctx.constantNumber("(" + lnum.name + " >> " + rnum.name + ")");
    });
}

function UnsignedRightShiftOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        var lnum = ctx.compileToNumber(lval);
        var rnum = ctx.compileToNumber(rval);
        return ctx.constantNumber("(" + lnum.name + " >>> " + rnum.name + ")");
    });
}

function LessThanOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        var px = ctx.compileToPrimitive(lval, TYPE_Number);
        var py = ctx.compileToPrimitive(rval, TYPE_Number);
        return ctx.constantBoolean("(" + px.name + " < " + py.name + ")");
    });
}

function GreaterThanOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        var px = ctx.compileToPrimitive(lval, TYPE_Number);
        var py = ctx.compileToPrimitive(rval, TYPE_Number);
        return ctx.constantBoolean("(" + px.name + " > " + py.name + ")");
    });
}

function LessThanOrEqualOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        var px = ctx.compileToPrimitive(lval, TYPE_Number);
        var py = ctx.compileToPrimitive(rval, TYPE_Number);
        return ctx.constantBoolean("(" + px.name + " <= " + py.name + ")");
    });
}

function GreaterThanOrEqualOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        var px = ctx.compileToPrimitive(lval, TYPE_Number);
        var py = ctx.compileToPrimitive(rval, TYPE_Number);
        return ctx.constantBoolean("(" + px.name + " >= " + py.name + ")");
    });
}

function instanceofOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        if (rval.types.isNotObject()) {
            ctx.text("throw VMTypeError();");
            return COMPILER_FALSE_VALUE;
        }
        rval = ctx.unify(rval);
        ctx.text("if(! " + rval.name + " || " + rval.name + " .HasInstance===undefined)throw VMTypeError();");
        return ctx.defineBoolean(rval.name + " .HasInstance(" + lval.name + ")");
    });
}

function inOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        if (rval.types.isNotObject()) {
            ctx.text("throw VMTypeError();");
            return COMPILER_FALSE_VALUE;
        }
        rval = ctx.unify(rval);
        ctx.text("if(typeof(" + rval.name + ")!=='object'|| " + rval.name + " ===null)throw VMTypeError();");
        var lval = ctx.compileToString(lval);
        return ctx.defineBoolean(rval.name + " .HasProperty(" + lval.name + ")");
    });
}

function EqualsOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        if (rval.types.isString() || rval.types.isNumber() || rval.types.isBoolean()) {
            var lval = ctx.compileToPrimitive(lval);
            return ctx.constantBoolean("(" + lval.name + " == " + rval.name + ")");
        }
        if (lval.types.isString() || lval.types.isNumber() || lval.types.isBoolean()) {
            var rval = ctx.compileToPrimitive(rval);
            return ctx.constantBoolean("(" + lval.name + " == " + rval.name + ")");
        }
        return ctx.constantBoolean("abstractEqualityComparison(" + lval.name + " , " + rval.name + ")");
    });
}

function DoesNotEqualOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        if (rval.types.isString() || rval.types.isNumber() || rval.types.isBoolean()) {
            var lval = ctx.compileToPrimitive(lval);
            return ctx.constantBoolean("(" + lval.name + " != " + rval.name + ")");
        }
        if (lval.types.isString() || lval.types.isNumber() || lval.types.isBoolean()) {
            var rval = ctx.compileToPrimitive(rval);
            return ctx.constantBoolean("(" + lval.name + " != " + rval.name + ")");
        }
        return ctx.constantBoolean("(!abstractEqualityComparison(" + lval.name + " , " + rval.name + "))");
    });
}

function abstractEqualityComparison(x, y) {
    if (typeof(x) === 'object' && x !== null) {
        if (typeof(y) === 'object' && y !== null) {
            return (x === y);
        }
        if (y === null || y === undefined) return false;
        x = ToPrimitive(x);
        return (x == y);
    } else {
        if (typeof(y) !== 'object' || y === null) {
            return (x == y);
        }
        if (x === null || x === undefined) return false;
        y = ToPrimitive(y);
        return (x == y);
    }
}

function StrictEqualsOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        return ctx.constantBoolean("(" + lval.name + " === " + rval.name + ")");
    });
}

function StrictDoesNotEqualOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        return ctx.constantBoolean("(" + lval.name + " !== " + rval.name + ")");
    });
}

function BinaryBitwiseOperator(operator, leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        var lnum = ctx.compileToNumber(lval);
        var rnum = ctx.compileToNumber(rval);
        switch (operator) {
            case '&':
                return ctx.constantNumber("(" + lnum.name + " & " + rnum.name + ")");
            case '^':
                return ctx.constantNumber("(" + lnum.name + " ^ " + rnum.name + ")");
            case '|':
                return ctx.constantNumber("(" + lnum.name + " | " + rnum.name + ")");
        }
    });
}

function LogicalAndOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        if (lval.isLiteral) {
            if (!lval.value) {
                return lval;
            }
            var rref = ctx.compileExpression(rightExpression);
            return ctx.compileGetValue(rref);
        }
        lval = ctx.toMergeable(lval);
        ctx.text("if(" + lval.name + "){");
        var rref = ctx.compileExpression(rightExpression);
        ctx.merge(lval, ctx.compileGetValue(rref));
        ctx.text("}");
        return lval;
    });
}

function LogicalOrOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        if (lval.isLiteral) {
            if (lval.value) {
                return lval;
            }
            var rref = ctx.compileExpression(rightExpression);
            return ctx.compileGetValue(rref);
        }
        lval = ctx.toMergeable(lval);
        ctx.text("if(! " + lval.name + "){");
        var rref = ctx.compileExpression(rightExpression);
        ctx.merge(lval, ctx.compileGetValue(rref));
        ctx.text("}");
        return lval;
    });
}

function ConditionalOperator(condition, firstExpression, secondExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(condition);
        var lval = ctx.compileGetValue(lref);
        ctx.text("if(" + lval.name + "){");
        var trueRef = ctx.compileExpression(firstExpression);
        var mval = ctx.compileGetValue(trueRef);
        mval = ctx.toMergeable(mval);
        ctx.text("}else{");
        var falseRef = ctx.compileExpression(secondExpression);
        ctx.merge(mval, ctx.compileGetValue(falseRef));
        ctx.text("}");
        return mval;
    });
}

function SimpleAssignment(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        rval = ctx.unify(rval);
        ctx.compilePutValue(lref, rval);
        return rval;
    });
}

function CompoundAssignment(operator, leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        var rval = ctx.compileGetValue(rref);
        switch (operator) {
            case '*=':
                var leftNum = ctx.compileToNumber(lval);
                var rightNum = ctx.compileToNumber(rval);
                var r = ctx.defineNumber(leftNum.name + " * " + rightNum.name);
                break;
            case '/=':
                var leftNum = ctx.compileToNumber(lval);
                var rightNum = ctx.compileToNumber(rval);
                var r = ctx.defineNumber(leftNum.name + " / " + rightNum.name);
                break;
            case '%=':
                var leftNum = ctx.compileToNumber(lval);
                var rightNum = ctx.compileToNumber(rval);
                var r = ctx.defineNumber(leftNum.name + " % " + rightNum.name);
                break;
            case '+=':
                var lprim = ctx.compileToPrimitive(lval);
                var rprim = ctx.compileToPrimitive(rval);
                if (lprim.types.isString() || rprim.types.isString()) {
                    var r = ctx.defineString(lprim.name + " + " + rprim.name);
                } else if (lprim.types.isNotString() && rprim.types.isNotString()) {
                    var r = ctx.defineNumber(lprim.name + " + " + rprim.name);
                } else {
                    var r = ctx.defineValue(lprim.name + " + " + rprim.name);
                }
                break;
            case '-=':
                var leftNum = ctx.compileToNumber(lval);
                var rightNum = ctx.compileToNumber(rval);
                var r = ctx.defineNumber(leftNum.name + " - " + rightNum.name);
                break;
            case '<<=':
                var leftNum = ctx.compileToNumber(lval);
                var rightNum = ctx.compileToNumber(rval);
                var r = ctx.defineNumber(leftNum.name + " << " + rightNum.name);
                break;
            case '>>=':
                var leftNum = ctx.compileToNumber(lval);
                var rightNum = ctx.compileToNumber(rval);
                var r = ctx.defineNumber(leftNum.name + " >> " + rightNum.name);
                break;
            case '>>>=':
                var leftNum = ctx.compileToNumber(lval);
                var rightNum = ctx.compileToNumber(rval);
                var r = ctx.defineNumber(leftNum.name + " >>> " + rightNum.name);
                break;
            case '&=':
                var leftNum = ctx.compileToNumber(lval);
                var rightNum = ctx.compileToNumber(rval);
                var r = ctx.defineNumber(leftNum.name + " & " + rightNum.name);
                break;
            case '|=':
                var leftNum = ctx.compileToNumber(lval);
                var rightNum = ctx.compileToNumber(rval);
                var r = ctx.defineNumber(leftNum.name + " | " + rightNum.name);
                break;
            case '^=':
                var leftNum = ctx.compileToNumber(lval);
                var rightNum = ctx.compileToNumber(rval);
                var r = ctx.defineNumber(leftNum.name + " ^ " + rightNum.name);
                break;
        }
        ctx.compilePutValue(lref, r);
        return r;
    });
}

function CommaOperator(leftExpression, rightExpression) {
    return CompilerContext.expression(function(ctx) {
        var lref = ctx.compileExpression(leftExpression);
        var lval = ctx.compileGetValue(lref);
        var rref = ctx.compileExpression(rightExpression);
        return ctx.compileGetValue(rref);
    });
}
