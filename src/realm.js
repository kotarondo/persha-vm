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


// ECMAScript 5.1: 15 Standard Built-in ECMAScript Objects

function initializeRealm() {
    realm = {
        systemHandlers: Object.create(null),
    };

    realm.Object_prototype = VMObject(CLASSID_Object);
    realm.Object_prototype.Prototype = null;
    realm.Object_prototype.Extensible = true;

    realm.Function_prototype = VMObject(CLASSID_BuiltinFunction);
    realm.Function_prototype.Prototype = realm.Object_prototype;
    realm.Function_prototype.Extensible = true;
    defineCall(realm.Function_prototype, ReturnUndefined);

    realm.Array_prototype = VMObject(CLASSID_Array);
    realm.Array_prototype.Prototype = realm.Object_prototype;
    realm.Array_prototype.Extensible = true;

    realm.String_prototype = VMObject(CLASSID_String);
    realm.String_prototype.Prototype = realm.Object_prototype;
    realm.String_prototype.Extensible = true;
    realm.String_prototype.PrimitiveValue = "";

    realm.Boolean_prototype = VMObject(CLASSID_Boolean);
    realm.Boolean_prototype.Prototype = realm.Object_prototype;
    realm.Boolean_prototype.Extensible = true;
    realm.Boolean_prototype.PrimitiveValue = false;

    realm.Number_prototype = VMObject(CLASSID_Number);
    realm.Number_prototype.Prototype = realm.Object_prototype;
    realm.Number_prototype.Extensible = true;
    realm.Number_prototype.PrimitiveValue = 0;

    realm.Date_prototype = VMObject(CLASSID_Date);
    realm.Date_prototype.Prototype = realm.Object_prototype;
    realm.Date_prototype.Extensible = true;
    realm.Date_prototype.PrimitiveValue = NaN;

    realm.RegExp_prototype = VMObject(CLASSID_RegExp);
    realm.RegExp_prototype.Prototype = realm.Object_prototype;
    realm.RegExp_prototype.Extensible = true;

    realm.Error_prototype = VMObject(CLASSID_Error);
    realm.Error_prototype.Prototype = realm.Object_prototype;
    realm.Error_prototype.Extensible = true;

    realm.EvalError_prototype = VMObject(CLASSID_Error);
    realm.EvalError_prototype.Prototype = realm.Error_prototype;
    realm.EvalError_prototype.Extensible = true;

    realm.RangeError_prototype = VMObject(CLASSID_Error);
    realm.RangeError_prototype.Prototype = realm.Error_prototype;
    realm.RangeError_prototype.Extensible = true;

    realm.ReferenceError_prototype = VMObject(CLASSID_Error);
    realm.ReferenceError_prototype.Prototype = realm.Error_prototype;
    realm.ReferenceError_prototype.Extensible = true;

    realm.SyntaxError_prototype = VMObject(CLASSID_Error);
    realm.SyntaxError_prototype.Prototype = realm.Error_prototype;
    realm.SyntaxError_prototype.Extensible = true;

    realm.TypeError_prototype = VMObject(CLASSID_Error);
    realm.TypeError_prototype.Prototype = realm.Error_prototype;
    realm.TypeError_prototype.Extensible = true;

    realm.URIError_prototype = VMObject(CLASSID_Error);
    realm.URIError_prototype.Prototype = realm.Error_prototype;
    realm.URIError_prototype.Extensible = true;

    realm.Object = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.Object, Object_Call);
    defineConstruct(realm.Object, Object_Construct);
    realm.Object.Prototype = realm.Function_prototype;
    realm.Object.Extensible = true;

    realm.Function = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.Function, Function_Call);
    defineConstruct(realm.Function, Function_Construct);
    realm.Function.Prototype = realm.Function_prototype;
    realm.Function.Extensible = true;

    realm.Array = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.Array, Array_Call);
    defineConstruct(realm.Array, Array_Construct);
    realm.Array.Prototype = realm.Function_prototype;
    realm.Array.Extensible = true;

    realm.String = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.String, String_Call);
    defineConstruct(realm.String, String_Construct);
    realm.String.Prototype = realm.Function_prototype;
    realm.String.Extensible = true;

    realm.Boolean = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.Boolean, Boolean_Call);
    defineConstruct(realm.Boolean, Boolean_Construct);
    realm.Boolean.Prototype = realm.Function_prototype;
    realm.Boolean.Extensible = true;

    realm.Number = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.Number, Number_Call);
    defineConstruct(realm.Number, Number_Construct);
    realm.Number.Prototype = realm.Function_prototype;
    realm.Number.Extensible = true;

    realm.Math = VMObject(CLASSID_Math);
    realm.Math.Prototype = realm.Object_prototype;
    realm.Math.Extensible = true;

    realm.Date = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.Date, Date_Call);
    defineConstruct(realm.Date, Date_Construct);
    realm.Date.Prototype = realm.Function_prototype;
    realm.Date.Extensible = true;

    realm.RegExp = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.RegExp, RegExp_Call);
    defineConstruct(realm.RegExp, RegExp_Construct);
    realm.RegExp.Prototype = realm.Function_prototype;
    realm.RegExp.Extensible = true;

    realm.Error = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.Error, Error_Call);
    defineConstruct(realm.Error, Error_Construct);
    realm.Error.Prototype = realm.Function_prototype;
    realm.Error.Extensible = true;

    realm.EvalError = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.EvalError, EvalError_Call);
    defineConstruct(realm.EvalError, EvalError_Construct);
    realm.EvalError.Prototype = realm.Function_prototype;
    realm.EvalError.Extensible = true;

    realm.RangeError = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.RangeError, RangeError_Call);
    defineConstruct(realm.RangeError, RangeError_Construct);
    realm.RangeError.Prototype = realm.Function_prototype;
    realm.RangeError.Extensible = true;

    realm.ReferenceError = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.ReferenceError, ReferenceError_Call);
    defineConstruct(realm.ReferenceError, ReferenceError_Construct);
    realm.ReferenceError.Prototype = realm.Function_prototype;
    realm.ReferenceError.Extensible = true;

    realm.SyntaxError = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.SyntaxError, SyntaxError_Call);
    defineConstruct(realm.SyntaxError, SyntaxError_Construct);
    realm.SyntaxError.Prototype = realm.Function_prototype;
    realm.SyntaxError.Extensible = true;

    realm.TypeError = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.TypeError, TypeError_Call);
    defineConstruct(realm.TypeError, TypeError_Construct);
    realm.TypeError.Prototype = realm.Function_prototype;
    realm.TypeError.Extensible = true;

    realm.URIError = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.URIError, URIError_Call);
    defineConstruct(realm.URIError, URIError_Construct);
    realm.URIError.Prototype = realm.Function_prototype;
    realm.URIError.Extensible = true;

    realm.JSON = VMObject(CLASSID_JSON);
    realm.JSON.Prototype = realm.Object_prototype;
    realm.JSON.Extensible = true;

    realm.theGlobalObject = VMObject(CLASSID_Global);
    realm.theGlobalObject.Prototype = realm.Object_prototype;
    realm.theGlobalObject.Extensible = true;

    realm.theGlobalEnvironment = NewObjectEnvironment(realm.theGlobalObject, null);
    realm.theThrowTypeError = createThrowTypeErrorObject();

    defineFinal(realm.theGlobalObject, "NaN", NaN);
    defineFinal(realm.theGlobalObject, "Infinity", Infinity);
    defineFinal(realm.theGlobalObject, "undefined", undefined);
    realm.theEvalFunction = //
        defineFunction(realm.theGlobalObject, "eval", 1, Global_eval);
    defineFunction(realm.theGlobalObject, "parseInt", 2, Global_parseInt);
    defineFunction(realm.theGlobalObject, "parseFloat", 1, Global_parseFloat);
    defineFunction(realm.theGlobalObject, "isNaN", 1, Global_isNaN);
    defineFunction(realm.theGlobalObject, "isFinite", 1, Global_isFinite);
    defineFunction(realm.theGlobalObject, "decodeURI", 1, Global_decodeURI);
    defineFunction(realm.theGlobalObject, "decodeURIComponent", 1, Global_decodeURIComponent);
    defineFunction(realm.theGlobalObject, "encodeURI", 1, Global_encodeURI);
    defineFunction(realm.theGlobalObject, "encodeURIComponent", 1, Global_encodeURIComponent);
    defineFunction(realm.theGlobalObject, "escape", 1, Global_escape);
    defineFunction(realm.theGlobalObject, "unescape", 1, Global_unescape);
    define(realm.theGlobalObject, "Object", realm.Object);
    define(realm.theGlobalObject, "Function", realm.Function);
    define(realm.theGlobalObject, "Array", realm.Array);
    define(realm.theGlobalObject, "String", realm.String);
    define(realm.theGlobalObject, "Boolean", realm.Boolean);
    define(realm.theGlobalObject, "Number", realm.Number);
    define(realm.theGlobalObject, "Math", realm.Math);
    define(realm.theGlobalObject, "Date", realm.Date);
    define(realm.theGlobalObject, "RegExp", realm.RegExp);
    define(realm.theGlobalObject, "Error", realm.Error);
    define(realm.theGlobalObject, "EvalError", realm.EvalError);
    define(realm.theGlobalObject, "RangeError", realm.RangeError);
    define(realm.theGlobalObject, "ReferenceError", realm.ReferenceError);
    define(realm.theGlobalObject, "SyntaxError", realm.SyntaxError);
    define(realm.theGlobalObject, "TypeError", realm.TypeError);
    define(realm.theGlobalObject, "URIError", realm.URIError);
    define(realm.theGlobalObject, "JSON", realm.JSON);
    defineFinal(realm.theGlobalObject, "global", realm.theGlobalObject);
    defineFunction(realm.theGlobalObject, "setSystemProperty", 2, Global_setSystemProperty);
    defineFunction(realm.theGlobalObject, "getSystemProperty", 1, Global_getSystemProperty);
    defineFunction(realm.theGlobalObject, "setSystemHandler", 2, Global_setSystemHandler);
    defineFunction(realm.theGlobalObject, "getSystemHandler", 1, Global_getSystemHandler);
    defineFunction(realm.theGlobalObject, "removeSystemHandler", 1, Global_removeSystemHandler);

    defineFinal(realm.Object, "length", 1);
    defineFinal(realm.Object, "prototype", realm.Object_prototype);
    defineFunction(realm.Object, "getPrototypeOf", 1, Object_getPrototypeOf);
    defineFunction(realm.Object, "getOwnPropertyDescriptor", 2, Object_getOwnPropertyDescriptor);
    defineFunction(realm.Object, "getOwnPropertyNames", 1, Object_getOwnPropertyNames);
    defineFunction(realm.Object, "create", 2, Object_create);
    defineFunction(realm.Object, "defineProperty", 3, Object_defineProperty);
    defineFunction(realm.Object, "defineProperties", 2, Object_defineProperties);
    defineFunction(realm.Object, "seal", 1, Object_seal);
    defineFunction(realm.Object, "freeze", 1, Object_freeze);
    defineFunction(realm.Object, "preventExtensions", 1, Object_preventExtensions);
    defineFunction(realm.Object, "isSealed", 1, Object_isSealed);
    defineFunction(realm.Object, "isFrozen", 1, Object_isFrozen);
    defineFunction(realm.Object, "isExtensible", 1, Object_isExtensible);
    defineFunction(realm.Object, "keys", 1, Object_keys);
    define(realm.Object_prototype, "constructor", realm.Object);
    defineFunction(realm.Object_prototype, "toString", 0, Object_prototype_toString);
    defineFunction(realm.Object_prototype, "toLocaleString", 0, Object_prototype_toLocaleString);
    defineFunction(realm.Object_prototype, "valueOf", 0, Object_prototype_valueOf);
    defineFunction(realm.Object_prototype, "hasOwnProperty", 1, Object_prototype_hasOwnProperty);
    defineFunction(realm.Object_prototype, "isPrototypeOf", 1, Object_prototype_isPrototypeOf);
    defineFunction(realm.Object_prototype, "propertyIsEnumerable", 1, Object_prototype_propertyIsEnumerable);
    defineAccessor(realm.Object_prototype, "__proto__", get_Object_prototype___proto__, set_Object_prototype___proto__);

    defineFinal(realm.Function, "length", 1);
    defineFinal(realm.Function, "prototype", realm.Function_prototype);
    defineFinal(realm.Function_prototype, "length", 0);
    define(realm.Function_prototype, "constructor", realm.Function);
    defineFunction(realm.Function_prototype, "toString", 0, Function_prototype_toString);
    defineFunction(realm.Function_prototype, "apply", 2, Function_prototype_apply);
    defineFunction(realm.Function_prototype, "call", 1, Function_prototype_call);
    defineFunction(realm.Function_prototype, "bind", 1, Function_prototype_bind);
    defineAccessor(realm.Function_prototype, "name", get_Function_prototype_name, undefined);

    defineFinal(realm.Array, "length", 1);
    defineFinal(realm.Array, "prototype", realm.Array_prototype);
    defineFunction(realm.Array, "isArray", 1, Array_isArray);
    defineWritable(realm.Array_prototype, "length", 0);
    define(realm.Array_prototype, "constructor", realm.Array);
    defineFunction(realm.Array_prototype, "toString", 0, Array_prototype_toString);
    defineFunction(realm.Array_prototype, "toLocaleString", 0, Array_prototype_toLocaleString);
    defineFunction(realm.Array_prototype, "concat", 1, Array_prototype_concat);
    defineFunction(realm.Array_prototype, "join", 1, Array_prototype_join);
    defineFunction(realm.Array_prototype, "pop", 0, Array_prototype_pop);
    defineFunction(realm.Array_prototype, "push", 1, Array_prototype_push);
    defineFunction(realm.Array_prototype, "reverse", 0, Array_prototype_reverse);
    defineFunction(realm.Array_prototype, "shift", 0, Array_prototype_shift);
    defineFunction(realm.Array_prototype, "slice", 2, Array_prototype_slice);
    defineFunction(realm.Array_prototype, "sort", 1, Array_prototype_sort);
    defineFunction(realm.Array_prototype, "splice", 2, Array_prototype_splice);
    defineFunction(realm.Array_prototype, "unshift", 1, Array_prototype_unshift);
    defineFunction(realm.Array_prototype, "indexOf", 1, Array_prototype_indexOf);
    defineFunction(realm.Array_prototype, "lastIndexOf", 1, Array_prototype_lastIndexOf);
    defineFunction(realm.Array_prototype, "every", 1, Array_prototype_every);
    defineFunction(realm.Array_prototype, "some", 1, Array_prototype_some);
    defineFunction(realm.Array_prototype, "forEach", 1, Array_prototype_forEach);
    defineFunction(realm.Array_prototype, "map", 1, Array_prototype_map);
    defineFunction(realm.Array_prototype, "filter", 1, Array_prototype_filter);
    defineFunction(realm.Array_prototype, "reduce", 1, Array_prototype_reduce);
    defineFunction(realm.Array_prototype, "reduceRight", 1, Array_prototype_reduceRight);

    defineFinal(realm.String, "length", 1);
    defineFinal(realm.String, "prototype", realm.String_prototype);
    defineFunction(realm.String, "fromCharCode", 1, String_fromCharCode);
    defineFinal(realm.String_prototype, "length", 0);
    define(realm.String_prototype, "constructor", realm.String);
    defineFunction(realm.String_prototype, "toString", 0, String_prototype_toString);
    defineFunction(realm.String_prototype, "valueOf", 0, String_prototype_valueOf);
    defineFunction(realm.String_prototype, "charAt", 1, String_prototype_charAt);
    defineFunction(realm.String_prototype, "charCodeAt", 1, String_prototype_charCodeAt);
    defineFunction(realm.String_prototype, "concat", 1, String_prototype_concat);
    defineFunction(realm.String_prototype, "indexOf", 1, String_prototype_indexOf);
    defineFunction(realm.String_prototype, "lastIndexOf", 1, String_prototype_lastIndexOf);
    defineFunction(realm.String_prototype, "localeCompare", 1, String_prototype_localeCompare);
    defineFunction(realm.String_prototype, "match", 1, String_prototype_match);
    defineFunction(realm.String_prototype, "replace", 2, String_prototype_replace);
    defineFunction(realm.String_prototype, "search", 1, String_prototype_search);
    defineFunction(realm.String_prototype, "slice", 2, String_prototype_slice);
    defineFunction(realm.String_prototype, "split", 2, String_prototype_split);
    defineFunction(realm.String_prototype, "substring", 2, String_prototype_substring);
    defineFunction(realm.String_prototype, "toLowerCase", 0, String_prototype_toLowerCase);
    defineFunction(realm.String_prototype, "toLocaleLowerCase", 0, String_prototype_toLocaleLowerCase);
    defineFunction(realm.String_prototype, "toUpperCase", 0, String_prototype_toUpperCase);
    defineFunction(realm.String_prototype, "toLocaleUpperCase", 0, String_prototype_toLocaleUpperCase);
    defineFunction(realm.String_prototype, "trim", 0, String_prototype_trim);
    defineFunction(realm.String_prototype, "substr", 2, String_prototype_substr);

    defineFinal(realm.Boolean, "length", 1);
    defineFinal(realm.Boolean, "prototype", realm.Boolean_prototype);
    define(realm.Boolean_prototype, "constructor", realm.Boolean);
    defineFunction(realm.Boolean_prototype, "toString", 0, Boolean_prototype_toString);
    defineFunction(realm.Boolean_prototype, "valueOf", 0, Boolean_prototype_valueOf);

    defineFinal(realm.Number, "length", 1);
    defineFinal(realm.Number, "prototype", realm.Number_prototype);
    defineFinal(realm.Number, "MAX_VALUE", Number.MAX_VALUE);
    defineFinal(realm.Number, "MIN_VALUE", Number.MIN_VALUE);
    defineFinal(realm.Number, "NaN", NaN);
    defineFinal(realm.Number, "POSITIVE_INFINITY", Infinity);
    defineFinal(realm.Number, "NEGATIVE_INFINITY", -Infinity);
    define(realm.Number_prototype, "constructor", realm.Number);
    defineFunction(realm.Number_prototype, "toString", 0, Number_prototype_toString);
    defineFunction(realm.Number_prototype, "toLocaleString", 0, Number_prototype_toLocaleString);
    defineFunction(realm.Number_prototype, "valueOf", 0, Number_prototype_valueOf);
    defineFunction(realm.Number_prototype, "toFixed", 1, Number_prototype_toFixed);
    defineFunction(realm.Number_prototype, "toExponential", 1, Number_prototype_toExponential);
    defineFunction(realm.Number_prototype, "toPrecision", 1, Number_prototype_toPrecision);

    defineFinal(realm.Math, "E", Math.E);
    defineFinal(realm.Math, "LN10", Math.LN10);
    defineFinal(realm.Math, "LN2", Math.LN2);
    defineFinal(realm.Math, "LOG2E", Math.LOG2E);
    defineFinal(realm.Math, "LOG10E", Math.LOG10E);
    defineFinal(realm.Math, "PI", Math.PI);
    defineFinal(realm.Math, "SQRT1_2", Math.SQRT1_2);
    defineFinal(realm.Math, "SQRT2", Math.SQRT2);
    defineFunction(realm.Math, "abs", 1, Math_abs);
    defineFunction(realm.Math, "acos", 1, Math_acos);
    defineFunction(realm.Math, "asin", 1, Math_asin);
    defineFunction(realm.Math, "atan", 1, Math_atan);
    defineFunction(realm.Math, "atan2", 2, Math_atan2);
    defineFunction(realm.Math, "ceil", 1, Math_ceil);
    defineFunction(realm.Math, "cos", 1, Math_cos);
    defineFunction(realm.Math, "exp", 1, Math_exp);
    defineFunction(realm.Math, "floor", 1, Math_floor);
    defineFunction(realm.Math, "log", 1, Math_log);
    defineFunction(realm.Math, "max", 2, Math_max);
    defineFunction(realm.Math, "min", 2, Math_min);
    defineFunction(realm.Math, "pow", 2, Math_pow);
    defineFunction(realm.Math, "random", 0, Math_random);
    defineFunction(realm.Math, "round", 1, Math_round);
    defineFunction(realm.Math, "sin", 1, Math_sin);
    defineFunction(realm.Math, "sqrt", 1, Math_sqrt);
    defineFunction(realm.Math, "tan", 1, Math_tan);

    defineFinal(realm.Date, "length", 7);
    defineFinal(realm.Date, "prototype", realm.Date_prototype);
    defineFunction(realm.Date, "parse", 1, Date_parse);
    defineFunction(realm.Date, "UTC", 7, Date_UTC);
    defineFunction(realm.Date, "now", 0, Date_now);
    define(realm.Date_prototype, "constructor", realm.Date);
    defineFunction(realm.Date_prototype, "toString", 0, Date_prototype_toString);
    defineFunction(realm.Date_prototype, "toDateString", 0, Date_prototype_toDateString);
    defineFunction(realm.Date_prototype, "toTimeString", 0, Date_prototype_toTimeString);
    defineFunction(realm.Date_prototype, "toLocaleString", 0, Date_prototype_toLocaleString);
    defineFunction(realm.Date_prototype, "toLocaleDateString", 0, Date_prototype_toLocaleDateString);
    defineFunction(realm.Date_prototype, "toLocaleTimeString", 0, Date_prototype_toLocaleTimeString);
    defineFunction(realm.Date_prototype, "valueOf", 0, Date_prototype_valueOf);
    defineFunction(realm.Date_prototype, "getTime", 0, Date_prototype_getTime);
    defineFunction(realm.Date_prototype, "getFullYear", 0, Date_prototype_getFullYear);
    defineFunction(realm.Date_prototype, "getUTCFullYear", 0, Date_prototype_getUTCFullYear);
    defineFunction(realm.Date_prototype, "getMonth", 0, Date_prototype_getMonth);
    defineFunction(realm.Date_prototype, "getUTCMonth", 0, Date_prototype_getUTCMonth);
    defineFunction(realm.Date_prototype, "getDate", 0, Date_prototype_getDate);
    defineFunction(realm.Date_prototype, "getUTCDate", 0, Date_prototype_getUTCDate);
    defineFunction(realm.Date_prototype, "getDay", 0, Date_prototype_getDay);
    defineFunction(realm.Date_prototype, "getUTCDay", 0, Date_prototype_getUTCDay);
    defineFunction(realm.Date_prototype, "getHours", 0, Date_prototype_getHours);
    defineFunction(realm.Date_prototype, "getUTCHours", 0, Date_prototype_getUTCHours);
    defineFunction(realm.Date_prototype, "getMinutes", 0, Date_prototype_getMinutes);
    defineFunction(realm.Date_prototype, "getUTCMinutes", 0, Date_prototype_getUTCMinutes);
    defineFunction(realm.Date_prototype, "getSeconds", 0, Date_prototype_getSeconds);
    defineFunction(realm.Date_prototype, "getUTCSeconds", 0, Date_prototype_getUTCSeconds);
    defineFunction(realm.Date_prototype, "getMilliseconds", 0, Date_prototype_getMilliseconds);
    defineFunction(realm.Date_prototype, "getUTCMilliseconds", 0, Date_prototype_getUTCMilliseconds);
    defineFunction(realm.Date_prototype, "getTimezoneOffset", 0, Date_prototype_getTimezoneOffset);
    defineFunction(realm.Date_prototype, "setTime", 1, Date_prototype_setTime);
    defineFunction(realm.Date_prototype, "setMilliseconds", 1, Date_prototype_setMilliseconds);
    defineFunction(realm.Date_prototype, "setUTCMilliseconds", 1, Date_prototype_setUTCMilliseconds);
    defineFunction(realm.Date_prototype, "setSeconds", 2, Date_prototype_setSeconds);
    defineFunction(realm.Date_prototype, "setUTCSeconds", 2, Date_prototype_setUTCSeconds);
    defineFunction(realm.Date_prototype, "setMinutes", 3, Date_prototype_setMinutes);
    defineFunction(realm.Date_prototype, "setUTCMinutes", 3, Date_prototype_setUTCMinutes);
    defineFunction(realm.Date_prototype, "setHours", 4, Date_prototype_setHours);
    defineFunction(realm.Date_prototype, "setUTCHours", 4, Date_prototype_setUTCHours);
    defineFunction(realm.Date_prototype, "setDate", 1, Date_prototype_setDate);
    defineFunction(realm.Date_prototype, "setUTCDate", 1, Date_prototype_setUTCDate);
    defineFunction(realm.Date_prototype, "setMonth", 2, Date_prototype_setMonth);
    defineFunction(realm.Date_prototype, "setUTCMonth", 2, Date_prototype_setUTCMonth);
    defineFunction(realm.Date_prototype, "setFullYear", 3, Date_prototype_setFullYear);
    defineFunction(realm.Date_prototype, "setUTCFullYear", 3, Date_prototype_setUTCFullYear);
    defineFunction(realm.Date_prototype, "toUTCString", 0, Date_prototype_toUTCString);
    defineFunction(realm.Date_prototype, "toISOString", 0, Date_prototype_toISOString);
    defineFunction(realm.Date_prototype, "toJSON", 1, Date_prototype_toJSON);
    defineFunction(realm.Date_prototype, "getYear", 0, Date_prototype_getYear);
    defineFunction(realm.Date_prototype, "setYear", 1, Date_prototype_setYear);
    defineFunction(realm.Date_prototype, "toGMTString", 0, Date_prototype_toUTCString);

    defineFinal(realm.RegExp, "length", 2);
    defineFinal(realm.RegExp, "prototype", realm.RegExp_prototype);
    defineFinal(realm.RegExp_prototype, "source", "(?:)");
    defineFinal(realm.RegExp_prototype, "global", false);
    defineFinal(realm.RegExp_prototype, "ignoreCase", false);
    defineFinal(realm.RegExp_prototype, "multiline", false);
    defineWritable(realm.RegExp_prototype, "lastIndex", 0);
    RegExpFactory.recompile(realm.RegExp_prototype);
    define(realm.RegExp_prototype, "constructor", realm.RegExp);
    defineFunction(realm.RegExp_prototype, "exec", 1, RegExp_prototype_exec);
    defineFunction(realm.RegExp_prototype, "test", 1, RegExp_prototype_test);
    defineFunction(realm.RegExp_prototype, "toString", 0, RegExp_prototype_toString);

    defineFinal(realm.Error, "length", 1);
    defineFinal(realm.Error, "prototype", realm.Error_prototype);
    define(realm.Error_prototype, "constructor", realm.Error);
    define(realm.Error_prototype, "name", "Error");
    define(realm.Error_prototype, "message", "");
    defineFunction(realm.Error_prototype, "toString", 0, Error_prototype_toString);
    defineWritable(realm.Error, "stackTraceLimit", 10);
    defineAccessor(realm.Error_prototype, "stack", get_Error_prototype_stack, undefined);
    defineFunction(realm.Error_prototype, "getStackTraceEntry", 1, Error_prototype_getStackTraceEntry);

    defineFinal(realm.EvalError, "length", 1);
    defineFinal(realm.EvalError, "prototype", realm.EvalError_prototype);
    define(realm.EvalError_prototype, "constructor", realm.EvalError);
    define(realm.EvalError_prototype, "name", "EvalError");
    define(realm.EvalError_prototype, "message", "");

    defineFinal(realm.RangeError, "length", 1);
    defineFinal(realm.RangeError, "prototype", realm.RangeError_prototype);
    define(realm.RangeError_prototype, "constructor", realm.RangeError);
    define(realm.RangeError_prototype, "name", "RangeError");
    define(realm.RangeError_prototype, "message", "");

    defineFinal(realm.ReferenceError, "length", 1);
    defineFinal(realm.ReferenceError, "prototype", realm.ReferenceError_prototype);
    define(realm.ReferenceError_prototype, "constructor", realm.ReferenceError);
    define(realm.ReferenceError_prototype, "name", "ReferenceError");
    define(realm.ReferenceError_prototype, "message", "");

    defineFinal(realm.SyntaxError, "length", 1);
    defineFinal(realm.SyntaxError, "prototype", realm.SyntaxError_prototype);
    define(realm.SyntaxError_prototype, "constructor", realm.SyntaxError);
    define(realm.SyntaxError_prototype, "name", "SyntaxError");
    define(realm.SyntaxError_prototype, "message", "");

    defineFinal(realm.TypeError, "length", 1);
    defineFinal(realm.TypeError, "prototype", realm.TypeError_prototype);
    define(realm.TypeError_prototype, "constructor", realm.TypeError);
    define(realm.TypeError_prototype, "name", "TypeError");
    define(realm.TypeError_prototype, "message", "");

    defineFinal(realm.URIError, "length", 1);
    defineFinal(realm.URIError, "prototype", realm.URIError_prototype);
    define(realm.URIError_prototype, "constructor", realm.URIError);
    define(realm.URIError_prototype, "name", "URIError");
    define(realm.URIError_prototype, "message", "");

    defineFunction(realm.JSON, "parse", 2, JSON_parse);
    defineFunction(realm.JSON, "stringify", 3, JSON_stringify);

    realm.Buffer_prototype = VMObject(CLASSID_Buffer);
    realm.Buffer_prototype.Prototype = realm.Object_prototype;
    realm.Buffer_prototype.Extensible = true;
    realm.Buffer_prototype.wrappedBuffer = new Buffer(0);

    realm.Buffer = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.Buffer, Buffer_Call);
    defineConstruct(realm.Buffer, Buffer_Construct);
    realm.Buffer.Prototype = realm.Function_prototype;
    realm.Buffer.Extensible = true;
    define(realm.theGlobalObject, "Buffer", realm.Buffer);

    defineFinal(realm.Buffer, "length", 2);
    defineFinal(realm.Buffer, "prototype", realm.Buffer_prototype);
    defineFunction(realm.Buffer, "isEncoding", 1, Buffer_isEncoding);
    defineFunction(realm.Buffer, "isBuffer", 1, Buffer_isBuffer);
    defineFunction(realm.Buffer, "byteLength", 1, Buffer_byteLength);
    defineFunction(realm.Buffer, "concat", 2, Buffer_concat);
    defineFunction(realm.Buffer, "compare", 2, Buffer_compare);
    defineFinal(realm.Buffer_prototype, "length", 0);
    define(realm.Buffer_prototype, "constructor", realm.Buffer);
    defineFunction(realm.Buffer_prototype, "write", 4, Buffer_prototype_write);
    defineFunction(realm.Buffer_prototype, "writeUIntLE", 4, Buffer_prototype_writeUIntLE);
    defineFunction(realm.Buffer_prototype, "writeUIntBE", 4, Buffer_prototype_writeUIntBE);
    defineFunction(realm.Buffer_prototype, "writeIntLE", 4, Buffer_prototype_writeIntLE);
    defineFunction(realm.Buffer_prototype, "writeIntBE", 4, Buffer_prototype_writeIntBE);
    defineFunction(realm.Buffer_prototype, "readUIntLE", 3, Buffer_prototype_readUIntLE);
    defineFunction(realm.Buffer_prototype, "readUIntBE", 3, Buffer_prototype_readUIntBE);
    defineFunction(realm.Buffer_prototype, "readIntLE", 3, Buffer_prototype_readIntLE);
    defineFunction(realm.Buffer_prototype, "readIntBE", 3, Buffer_prototype_readIntBE);
    defineFunction(realm.Buffer_prototype, "toString", 3, Buffer_prototype_toString);
    defineFunction(realm.Buffer_prototype, "toJSON", 0, Buffer_prototype_toJSON);
    defineFunction(realm.Buffer_prototype, "equals", 1, Buffer_prototype_equals);
    defineFunction(realm.Buffer_prototype, "compare", 1, Buffer_prototype_compare);
    defineFunction(realm.Buffer_prototype, "copy", 0, Buffer_prototype_copy);
    defineFunction(realm.Buffer_prototype, "slice", 2, Buffer_prototype_slice);
    defineFunction(realm.Buffer_prototype, "readUInt8", 2, Buffer_prototype_readUInt8);
    defineFunction(realm.Buffer_prototype, "readUInt16LE", 2, Buffer_prototype_readUInt16LE);
    defineFunction(realm.Buffer_prototype, "readUInt16BE", 2, Buffer_prototype_readUInt16BE);
    defineFunction(realm.Buffer_prototype, "readUInt32LE", 2, Buffer_prototype_readUInt32LE);
    defineFunction(realm.Buffer_prototype, "readUInt32BE", 2, Buffer_prototype_readUInt32BE);
    defineFunction(realm.Buffer_prototype, "readInt8", 2, Buffer_prototype_readInt8);
    defineFunction(realm.Buffer_prototype, "readInt16LE", 2, Buffer_prototype_readInt16LE);
    defineFunction(realm.Buffer_prototype, "readInt16BE", 2, Buffer_prototype_readInt16BE);
    defineFunction(realm.Buffer_prototype, "readInt32LE", 2, Buffer_prototype_readInt32LE);
    defineFunction(realm.Buffer_prototype, "readInt32BE", 2, Buffer_prototype_readInt32BE);
    defineFunction(realm.Buffer_prototype, "readFloatLE", 2, Buffer_prototype_readFloatLE);
    defineFunction(realm.Buffer_prototype, "readFloatBE", 2, Buffer_prototype_readFloatBE);
    defineFunction(realm.Buffer_prototype, "readDoubleLE", 2, Buffer_prototype_readDoubleLE);
    defineFunction(realm.Buffer_prototype, "readDoubleBE", 2, Buffer_prototype_readDoubleBE);
    defineFunction(realm.Buffer_prototype, "writeUInt8", 3, Buffer_prototype_writeUInt8);
    defineFunction(realm.Buffer_prototype, "writeUInt16LE", 3, Buffer_prototype_writeUInt16LE);
    defineFunction(realm.Buffer_prototype, "writeUInt16BE", 3, Buffer_prototype_writeUInt16BE);
    defineFunction(realm.Buffer_prototype, "writeUInt32LE", 3, Buffer_prototype_writeUInt32LE);
    defineFunction(realm.Buffer_prototype, "writeUInt32BE", 3, Buffer_prototype_writeUInt32BE);
    defineFunction(realm.Buffer_prototype, "writeInt8", 3, Buffer_prototype_writeInt8);
    defineFunction(realm.Buffer_prototype, "writeInt16LE", 3, Buffer_prototype_writeInt16LE);
    defineFunction(realm.Buffer_prototype, "writeInt16BE", 3, Buffer_prototype_writeInt16BE);
    defineFunction(realm.Buffer_prototype, "writeInt32LE", 3, Buffer_prototype_writeInt32LE);
    defineFunction(realm.Buffer_prototype, "writeInt32BE", 3, Buffer_prototype_writeInt32BE);
    defineFunction(realm.Buffer_prototype, "writeFloatLE", 3, Buffer_prototype_writeFloatLE);
    defineFunction(realm.Buffer_prototype, "writeFloatBE", 3, Buffer_prototype_writeFloatBE);
    defineFunction(realm.Buffer_prototype, "writeDoubleLE", 3, Buffer_prototype_writeDoubleLE);
    defineFunction(realm.Buffer_prototype, "writeDoubleBE", 3, Buffer_prototype_writeDoubleBE);
    defineFunction(realm.Buffer_prototype, "fill", 3, Buffer_prototype_fill);

    realm.OpaqueFunction = VMObject(CLASSID_BuiltinFunction);
    defineCall(realm.OpaqueFunction, OpaqueFunction_Call);
    defineConstruct(realm.OpaqueFunction, OpaqueFunction_Construct);
    realm.OpaqueFunction.Prototype = realm.Function_prototype;
    realm.OpaqueFunction.Extensible = true;
    define(realm.theGlobalObject, "OpaqueFunction", realm.OpaqueFunction);

    defineFinal(realm.OpaqueFunction, "length", 3);
    defineFinal(realm.OpaqueFunction, "prototype", realm.Function_prototype);

    defineFinal(realm.Object, "name", "Object");
    defineFinal(realm.Function, "name", "Function");
    defineFinal(realm.Array, "name", "Array");
    defineFinal(realm.String, "name", "String");
    defineFinal(realm.Boolean, "name", "Boolean");
    defineFinal(realm.Number, "name", "Number");
    defineFinal(realm.Date, "name", "Date");
    defineFinal(realm.RegExp, "name", "RegExp");
    defineFinal(realm.Error, "name", "Error");
    defineFinal(realm.EvalError, "name", "EvalError");
    defineFinal(realm.RangeError, "name", "RangeError");
    defineFinal(realm.ReferenceError, "name", "ReferenceError");
    defineFinal(realm.SyntaxError, "name", "SyntaxError");
    defineFinal(realm.TypeError, "name", "TypeError");
    defineFinal(realm.URIError, "name", "URIError");
    defineFinal(realm.Buffer, "name", "Buffer");
    defineFinal(realm.OpaqueFunction, "name", "OpaqueFunction");

    realm.stackDepthLimit = 400;
    realm.LocalTZA = 9 * 3600000;
    realm.LocalTZAString = "JST";

    initializeDefaultExport();
}

const realmTemplate = {
    Object_prototype: 1,
    Function_prototype: 1,
    Array_prototype: 1,
    String_prototype: 1,
    Boolean_prototype: 1,
    Number_prototype: 1,
    Date_prototype: 1,
    RegExp_prototype: 1,
    Error_prototype: 1,
    EvalError_prototype: 1,
    RangeError_prototype: 1,
    ReferenceError_prototype: 1,
    SyntaxError_prototype: 1,
    TypeError_prototype: 1,
    URIError_prototype: 1,
    Object: 1,
    Function: 1,
    Array: 1,
    String: 1,
    Boolean: 1,
    Number: 1,
    Math: 1,
    Date: 1,
    RegExp: 1,
    Error: 1,
    EvalError: 1,
    RangeError: 1,
    ReferenceError: 1,
    SyntaxError: 1,
    TypeError: 1,
    URIError: 1,
    JSON: 1,
    theGlobalObject: 1,
    theGlobalEnvironment: 1,
    theEvalFunction: 1,
    theThrowTypeError: 1,
    Buffer_prototype: 1,
    Buffer: 1,
    OpaqueFunction: 1,
    stackDepthLimit: 1,
    LocalTZA: 1,
    LocalTZAString: 1,
};

var realm;
var customFunctions;

function getRealm() {
    return realm;
}

function setRealm(r) {
    realm = r;
}

function setCustomFunctions(cf) {
    customFunctions = cf;
}
