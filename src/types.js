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

// ECMAScript 5.1: 8 Types

function Type(x) {
    switch (typeof x) {
        case "undefined":
            return TYPE_Undefined;
        case "boolean":
            return TYPE_Boolean;
        case "number":
            return TYPE_Number;
        case "string":
            return TYPE_String;
    }
    if (x === null) return TYPE_Null;
    if (x.Class !== undefined) return TYPE_Object;
    if (x.strictReference !== undefined) return TYPE_Reference;
    if (x.HasBinding !== undefined) return TYPE_EnvironmentRecord;
    assert(false, x);
}

function setAlltheInternalMethod(Class, ClassID) {
    var clz = {};
    clz.ClassID = ClassID;
    clz.Class = Class;
    clz.GetOwnProperty = default_GetOwnProperty;
    clz.GetProperty = default_GetProperty;
    clz.Get = default_Get;
    clz.CanPut = default_CanPut;
    clz.Put = default_Put;
    clz.HasProperty = default_HasProperty;
    clz.Delete = default_Delete;
    clz.DefaultValue = default_DefaultValue;
    clz.DefineOwnProperty = default_DefineOwnProperty;
    clz.enumerator = default_enumerator;
    clz.walkObject = default_walkObject;
    clz.writeObject = default_writeObject;
    clz.readObject = default_readObject;
    return clz;
}

const Class_Object = (function() {
    var clz = setAlltheInternalMethod("Object", CLASSID_Object);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    return clz;
})();

const Class_OpaqueObject = (function() {
    var clz = setAlltheInternalMethod("Object", CLASSID_OpaqueObject);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    clz.writeObject = OpaqueObject_writeObject;
    clz.readObject = OpaqueObject_readObject;
    return clz;
})();

const Class_OpaqueFunction = (function() {
    var clz = setAlltheInternalMethod("Function", CLASSID_OpaqueFunction);
    clz.GetProperty = default_FastGetProperty;
    clz.Put = default_FastPut;
    clz.Get = Function_Get;
    clz.Call = OpaqueFunction_ClassCall;
    clz.Construct = OpaqueFunction_ClassConstruct;
    clz.HasInstance = Function_HasInstance;
    return clz;
})();

const Class_BuiltinFunction = (function() {
    var clz = setAlltheInternalMethod("Function", CLASSID_BuiltinFunction);
    clz.GetProperty = default_FastGetProperty;
    clz.Put = default_FastPut;
    clz.Get = Function_Get;
    clz.HasInstance = Function_HasInstance;
    clz.writeObject = BuiltinFunction_writeObject;
    clz.readObject = BuiltinFunction_readObject;
    return clz;
})();

const Class_Function = (function() {
    var clz = setAlltheInternalMethod("Function", CLASSID_Function);
    clz.GetProperty = default_FastGetProperty;
    clz.Put = default_FastPut;
    clz.Get = Function_Get;
    clz.Call = Function_ClassCall;
    clz.Construct = Function_ClassConstruct;
    clz.HasInstance = Function_HasInstance;
    clz.walkObject = Function_walkObject;
    clz.writeObject = Function_writeObject;
    clz.readObject = Function_readObject;
    return clz;
})();

const Class_BindFunction = (function() {
    var clz = setAlltheInternalMethod("Function", CLASSID_BindFunction);
    clz.GetProperty = default_FastGetProperty;
    clz.Put = default_FastPut;
    clz.Get = Function_Get;
    clz.Call = BindFunction_ClassCall;
    clz.Construct = BindFunction_ClassConstruct;
    clz.HasInstance = BindFunction_HasInstance;
    clz.walkObject = BindFunction_walkObject;
    clz.writeObject = BindFunction_writeObject;
    clz.readObject = BindFunction_readObject;
    return clz;
})();

const Class_Array = (function() {
    var clz = setAlltheInternalMethod("Array", CLASSID_Array);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = Array_FastPut;
    clz.DefineOwnProperty = Array_DefineOwnProperty;
    return clz;
})();

const Class_String = (function() {
    var clz = setAlltheInternalMethod("String", CLASSID_String);
    clz.Get = String_FastGet;
    clz.Put = String_FastPut;
    clz.GetOwnProperty = String_GetOwnProperty;
    clz.enumerator = String_enumerator;
    clz.writeObject = Primitive_writeObject;
    clz.readObject = Primitive_readObject;
    return clz;
})();

const Class_Boolean = (function() {
    var clz = setAlltheInternalMethod("Boolean", CLASSID_Boolean);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    clz.writeObject = Primitive_writeObject;
    clz.readObject = Primitive_readObject;
    return clz;
})();

const Class_Number = (function() {
    var clz = setAlltheInternalMethod("Number", CLASSID_Number);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    clz.writeObject = Primitive_writeObject;
    clz.readObject = Primitive_readObject;
    return clz;
})();

const Class_Date = (function() {
    var clz = setAlltheInternalMethod("Date", CLASSID_Date);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    clz.writeObject = Primitive_writeObject;
    clz.readObject = Primitive_readObject;
    return clz;
})();

const Class_RegExp = (function() {
    var clz = setAlltheInternalMethod("RegExp", CLASSID_RegExp);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    clz.writeObject = RegExp_writeObject;
    clz.readObject = RegExp_readObject;
    return clz;
})();

const Class_Error = (function() {
    var clz = setAlltheInternalMethod("Error", CLASSID_Error);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    clz.walkObject = Error_walkObject;
    clz.writeObject = Error_writeObject;
    clz.readObject = Error_readObject;
    return clz;
})();

const Class_Global = (function() {
    var clz = setAlltheInternalMethod("Global", CLASSID_Global);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    return clz;
})();

const Class_Math = (function() {
    var clz = setAlltheInternalMethod("Math", CLASSID_Math);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    return clz;
})();

const Class_JSON = (function() {
    var clz = setAlltheInternalMethod("JSON", CLASSID_JSON);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    return clz;
})();

const Class_Arguments = (function() {
    var clz = setAlltheInternalMethod("Arguments", CLASSID_Arguments);
    clz.GetOwnProperty = Arguments_GetOwnProperty;
    clz.Get = Arguments_Get;
    clz.Delete = Arguments_Delete;
    clz.DefineOwnProperty = Arguments_DefineOwnProperty;
    clz.walkObject = Arguments_walkObject;
    clz.writeObject = Arguments_writeObject;
    clz.readObject = Arguments_readObject;
    return clz;
})();

const Class_PlainArguments = (function() {
    var clz = setAlltheInternalMethod("Arguments", CLASSID_PlainArguments);
    clz.GetProperty = default_FastGetProperty;
    clz.Get = default_FastGet;
    clz.Put = default_FastPut;
    return clz;
})();

const Class_Buffer = (function() {
    var clz = setAlltheInternalMethod("Buffer", CLASSID_Buffer);
    clz.Get = Buffer_FastGet;
    clz.Put = Buffer_FastPut;
    clz.GetOwnProperty = Buffer_GetOwnProperty;
    clz.enumerator = Buffer_enumerator;
    clz.DefineOwnProperty = Buffer_DefineOwnProperty;
    clz.writeObject = Buffer_writeObject;
    clz.readObject = Buffer_readObject;
    return clz;
})();

function VMObject(ClassID) {
    switch (ClassID) {
        case CLASSID_Object:
            var obj = Object.create(Class_Object);
            break;
        case CLASSID_OpaqueObject:
            var obj = Object.create(Class_OpaqueObject);
            obj.wrapped = undefined;
            obj.opaque = undefined;
            break;
        case CLASSID_OpaqueFunction:
            var obj = Object.create(Class_OpaqueFunction);
            break;
        case CLASSID_BuiltinFunction:
            var obj = Object.create(Class_BuiltinFunction);
            obj.Call = undefined;
            obj.Construct = undefined;
            break;
        case CLASSID_Function:
            var obj = Object.create(Class_Function);
            obj.Scope = undefined;
            obj.Code = undefined;
            break;
        case CLASSID_BindFunction:
            var obj = Object.create(Class_BindFunction);
            obj.TargetFunction = undefined;
            obj.BoundThis = undefined;
            obj.BoundArgs = undefined;
            break;
        case CLASSID_Array:
            var obj = Object.create(Class_Array);
            break;
        case CLASSID_String:
            var obj = Object.create(Class_String);
            obj.PrimitiveValue = undefined;
            break;
        case CLASSID_Boolean:
            var obj = Object.create(Class_Boolean);
            obj.PrimitiveValue = undefined;
            break;
        case CLASSID_Number:
            var obj = Object.create(Class_Number);
            obj.PrimitiveValue = undefined;
            break;
        case CLASSID_Date:
            var obj = Object.create(Class_Date);
            obj.PrimitiveValue = undefined;
            break;
        case CLASSID_RegExp:
            var obj = Object.create(Class_RegExp);
            obj.Match = undefined;
            obj.NCapturingParens = undefined;
            break;
        case CLASSID_Error:
            var obj = Object.create(Class_Error);
            obj.stackTrace = [];
            break;
        case CLASSID_Global:
            var obj = Object.create(Class_Global);
            break;
        case CLASSID_Math:
            var obj = Object.create(Class_Math);
            break;
        case CLASSID_JSON:
            var obj = Object.create(Class_JSON);
            break;
        case CLASSID_Arguments:
            var obj = Object.create(Class_Arguments);
            obj.ParameterMap = undefined;
            obj.ArgumentsScope = undefined;
            break;
        case CLASSID_PlainArguments:
            var obj = Object.create(Class_PlainArguments);
            break;
        case CLASSID_Buffer:
            var obj = Object.create(Class_Buffer);
            obj.wrappedBuffer = undefined;
            break;
        default:
            assert(false, ClassID);
    }
    obj.properties = Object.create(null);
    obj.Prototype = null;
    obj.Extensible = true;
    obj.ID = 0;
    obj.numProps = 0;
    return obj;
}

function ReferenceValue(base, referencedName, strictReference) {
    assert(strictReference !== undefined);
    return ({
        base: base,
        referencedName: referencedName,
        strictReference: strictReference,
    });
}

function HasPrimitiveBase(V) {
    switch (typeof V.base) {
        case "boolean":
        case "string":
        case "number":
            return true;
    }
    return false;
}

function IsPropertyReference(V) {
    if (Type(V.base) === TYPE_Object) return true;
    return HasPrimitiveBase(V);
}

function IsUnresolvableReference(V) {
    if (V.base === undefined) return true;
    return false;
}

function GetValue(V) {
    if (Type(V) !== TYPE_Reference) return V;
    var base = V.base;
    if (IsUnresolvableReference(V)) {
        throw VMReferenceError(V.referencedName + " is not defined");
    }
    if (IsPropertyReference(V)) {
        if (HasPrimitiveBase(V) === false) return base.Get(V.referencedName);
        else return specialGet(base, V.referencedName);
    } else {
        assert(Type(base) === TYPE_EnvironmentRecord, base);
        return base.GetBindingValue(V.referencedName, V.strictReference);
    }
}

function specialGet(base, P) {
    var O = ToObject(base);
    var desc = O.GetProperty(P);
    if (desc === undefined) return undefined;
    if (desc.Value !== absent) return desc.Value;
    else {
        assert(IsAccessorDescriptor(desc), desc);
        var getter = desc.Get;
        if (getter === undefined) return undefined;
        return getter.Call(base, []);
    }
}

function PutValue(V, W) {
    if (Type(V) !== TYPE_Reference) throw VMReferenceError();
    var base = V.base;
    if (IsUnresolvableReference(V)) {
        if (V.strictReference === true) throw VMReferenceError(V.referencedName + " is not defined");
        realm.theGlobalObject.Put(V.referencedName, W, false);
    } else if (IsPropertyReference(V)) {
        if (HasPrimitiveBase(V) === false) {
            base.Put(V.referencedName, W, V.strictReference);
        } else {
            specialPut(base, V.referencedName, W, V.strictReference);
        }
    } else {
        assert(Type(base) === TYPE_EnvironmentRecord, base);
        base.SetMutableBinding(V.referencedName, W, V.strictReference);
    }
    return;
}

function specialPut(base, P, W, Throw) {
    var O = ToObject(base);
    if (O.CanPut(P) === false) {
        if (Throw === true) throw VMTypeError();
        else return;
    }
    var ownDesc = O.GetOwnProperty(P);
    if (IsDataDescriptor(ownDesc) === true) {
        if (Throw === true) throw VMTypeError();
        else return;
    }
    var desc = O.GetProperty(P);
    if (IsAccessorDescriptor(desc) === true) {
        var setter = desc.Set;
        setter.Call(base, [W]);
    } else if (Throw === true) throw VMTypeError();
    return;
}

function CompletionValue(type, value, target) {
    return ({
        type: type,
        value: value,
        target: target,
    });
}

function FullPropertyDescriptor(Value, Writable, Get, Set, Enumerable, Configurable) {
    return ({
        Value: Value,
        Writable: Writable,
        Get: Get,
        Set: Set,
        Enumerable: Enumerable,
        Configurable: Configurable
    });
}

function DataPropertyDescriptor(Value, Writable, Enumerable, Configurable) {
    return ({
        Value: Value,
        Writable: Writable,
        Get: absent,
        Set: absent,
        Enumerable: Enumerable,
        Configurable: Configurable
    });
}

function AccessorPropertyDescriptor(Get, Set, Enumerable, Configurable) {
    return ({
        Value: absent,
        Writable: absent,
        Get: Get,
        Set: Set,
        Enumerable: Enumerable,
        Configurable: Configurable
    });
}

function IsAccessorDescriptor(Desc) {
    if (Desc === undefined) return false;
    if (Desc.Get === absent && Desc.Set === absent) return false;
    return true;
}

function IsDataDescriptor(Desc) {
    if (Desc === undefined) return false;
    if (Desc.Value === absent && Desc.Writable === absent) return false;
    return true;
}

function IsGenericDescriptor(Desc) {
    if (Desc === undefined) return false;
    if (IsAccessorDescriptor(Desc) === false && IsDataDescriptor(Desc) === false) return true;
    return false;
}

function FromPropertyDescriptor(Desc) {
    if (Desc === undefined) return undefined;
    var obj = Object_Construct([]);
    if (IsDataDescriptor(Desc) === true) {
        assert(Desc.Value !== absent, Desc);
        assert(Desc.Writable !== absent, Desc);
        obj.DefineOwnProperty("value", DataPropertyDescriptor(Desc.Value, true, true, true), false);
        obj.DefineOwnProperty("writable", DataPropertyDescriptor(Desc.Writable, true, true, true), false);
    } else {
        assert(IsAccessorDescriptor(Desc), Desc);
        assert(Desc.Get !== absent, Desc);
        assert(Desc.Set !== absent, Desc);
        obj.DefineOwnProperty("get", DataPropertyDescriptor(Desc.Get, true, true, true), false);
        obj.DefineOwnProperty("set", DataPropertyDescriptor(Desc.Set, true, true, true), false);
    }
    assert(Desc.Enumerable !== absent, Desc);
    assert(Desc.Configurable !== absent, Desc);
    obj.DefineOwnProperty("enumerable", DataPropertyDescriptor(Desc.Enumerable, true, true, true), false);
    obj.DefineOwnProperty("configurable", DataPropertyDescriptor(Desc.Configurable, true, true, true), false);
    return obj;
}

function ToPropertyDescriptor(Obj) {
    var Enumerable = absent;
    var Configurable = absent;
    var Value = absent;
    var Writable = absent;
    var Get = absent;
    var Set = absent;
    if (Type(Obj) !== TYPE_Object) throw VMTypeError();
    if (Obj.HasProperty("enumerable") === true) {
        var enum_ = Obj.Get("enumerable");
        var Enumerable = ToBoolean(enum_);
    }
    if (Obj.HasProperty("configurable") === true) {
        var conf = Obj.Get("configurable");
        var Configurable = ToBoolean(conf);
    }
    if (Obj.HasProperty("value") === true) {
        var value = Obj.Get("value");
        var Value = value;
    }
    if (Obj.HasProperty("writable") === true) {
        var writable = Obj.Get("writable");
        var Writable = ToBoolean(writable);
    }
    if (Obj.HasProperty("get") === true) {
        var getter = Obj.Get("get");
        if (IsCallable(getter) === false && getter !== undefined) throw VMTypeError();
        var Get = getter;
    }
    if (Obj.HasProperty("set") === true) {
        var setter = Obj.Get("set");
        if (IsCallable(setter) === false && setter !== undefined) throw VMTypeError();
        var Set = setter;
    }
    if (Get !== absent || Set !== absent) {
        if (Value !== absent || Writable !== absent) throw VMTypeError();
    }
    var desc = FullPropertyDescriptor(Value, Writable, Get, Set, Enumerable, Configurable);
    return desc;
}

function default_GetOwnProperty(P) {
    return this.properties[P];
}

function default_GetProperty(P) {
    var O = this;
    var prop = O.GetOwnProperty(P);
    if (prop !== undefined) return prop;
    var proto = O.Prototype;
    if (proto === null) return undefined;
    return proto.GetProperty(P);
}

function default_FastGetProperty(P) {
    var O = this;
    var prop = O.properties[P];
    if (prop !== undefined) return prop;
    var proto = O.Prototype;
    if (proto === null) return undefined;
    return proto.GetProperty(P);
}

function default_Get(P) {
    var O = this;
    var desc = O.GetProperty(P);
    if (desc === undefined) return undefined;
    if (desc.Value !== absent) return desc.Value;
    else {
        assert(IsAccessorDescriptor(desc), desc);
        var getter = desc.Get;
        if (getter === undefined) return undefined;
        return getter.Call(O, []);
    }
}

function default_FastGet(P) {
    var O = this;
    var desc = O.properties[P];
    if (desc === undefined) {
        var proto = O.Prototype;
        if (proto === null) return undefined;
        var desc = proto.GetProperty(P);
        if (desc === undefined) return undefined;
    }
    if (desc.Value !== absent) return desc.Value;
    else {
        assert(IsAccessorDescriptor(desc), desc);
        var getter = desc.Get;
        if (getter === undefined) return undefined;
        return getter.Call(O, []);
    }
}

function default_CanPut(P) {
    var O = this;
    var desc = O.GetOwnProperty(P);
    if (desc !== undefined) {
        if (IsAccessorDescriptor(desc) === true) {
            if (desc.Set === undefined) return false;
            else return true;
        } else {
            assert(IsDataDescriptor(desc), desc);
        }
        return desc.Writable;
    }
    var proto = O.Prototype;
    if (proto === null) return O.Extensible;
    var inherited = proto.GetProperty(P);
    if (inherited === undefined) return O.Extensible;
    if (IsAccessorDescriptor(inherited) === true) {
        if (inherited.Set === undefined) return false;
        else return true;
    } else {
        assert(IsDataDescriptor(inherited), inherited);
        if (O.Extensible === false) return false;
        else return inherited.Writable;
    }
}

function default_Put(P, V, Throw) {
    var O = this;
    var ownDesc = O.GetOwnProperty(P);
    if (IsDataDescriptor(ownDesc) === true) {
        if (ownDesc.Writable === false) {
            if (Throw === true) throw VMTypeError();
            else return;
        }
        var valueDesc = DataPropertyDescriptor(V, absent, absent, absent);
        O.DefineOwnProperty(P, valueDesc, Throw);
        return;
    }
    if (O.CanPut(P) === false) {
        if (Throw === true) throw VMTypeError();
        else return;
    }
    var desc = O.GetProperty(P);
    if (IsAccessorDescriptor(desc) === true) {
        var setter = desc.Set;
        assert(setter !== undefined, desc);
        setter.Call(O, [V]);
    } else {
        var newDesc = DataPropertyDescriptor(V, true, true, true);
        O.DefineOwnProperty(P, newDesc, Throw);
    }
    return;
}

function default_FastPut(P, V, Throw) {
    var O = this;
    var ownDesc = O.properties[P];
    if (ownDesc) {
        if (ownDesc.Writable === true) {
            ownDesc.Value = V;
            return;
        }
    } else if (O.Extensible) {
        var proto = O.Prototype;
        if (proto === null) {
            intrinsic_createData(O, P, V, true, true, true);
            return;
        }
        var desc = proto.GetProperty(P);
        if (desc === undefined || desc.Writable === true) {
            intrinsic_createData(O, P, V, true, true, true);
            return;
        }
    }
    default_Put.call(O, P, V, Throw);
}

function default_HasProperty(P) {
    var O = this;
    var desc = O.GetProperty(P);
    if (desc === undefined) return false;
    else return true;
}

function default_Delete(P, Throw) {
    var O = this;
    var desc = O.GetOwnProperty(P);
    if (desc === undefined) return true;
    if (desc.Configurable === true) {
        intrinsic_remove(O, P);
        return true;
    } else if (Throw) throw VMTypeError();
    return false;
}

function default_DefaultValue(hint) {
    var O = this;
    if (hint === undefined) {
        if (O.Class === "Date") {
            hint = TYPE_String;
        } else {
            hint = TYPE_Number;
        }
    }
    if (hint === TYPE_String) {
        var toString = O.Get("toString");
        if (IsCallable(toString) === true) {
            var str = toString.Call(O, []);
            if (Type(str) !== TYPE_Object) return str;
        }
        var valueOf = O.Get("valueOf");
        if (IsCallable(valueOf) === true) {
            var val = valueOf.Call(O, []);
            if (Type(val) !== TYPE_Object) return val;
        }
        throw VMTypeError();
    }
    if (hint === TYPE_Number) {
        var valueOf = O.Get("valueOf");
        if (IsCallable(valueOf) === true) {
            var val = valueOf.Call(O, []);
            if (Type(val) !== TYPE_Object) return val;
        }
        var toString = O.Get("toString");
        if (IsCallable(toString) === true) {
            var str = toString.Call(O, []);
            if (Type(str) !== TYPE_Object) return str;
        }
        throw VMTypeError();
    }
}

const emptyPropertyDescriptor = FullPropertyDescriptor(absent, absent, absent, absent, absent, absent);

function default_DefineOwnProperty(P, Desc, Throw) {
    var O = this;
    var current = O.GetOwnProperty(P);
    var extensible = O.Extensible;
    if (current === undefined && extensible === false) {
        if (Throw === true) throw VMTypeError();
        else return false;
    }
    if (current === undefined && extensible === true) {
        if (IsGenericDescriptor(Desc) === true || IsDataDescriptor(Desc) === true) {
            intrinsic_createData(O, P, Desc.Value, Desc.Writable, Desc.Enumerable, Desc.Configurable);
        } else {
            assert(IsAccessorDescriptor(Desc), Desc);
            intrinsic_createAccessor(O, P, Desc.Get, Desc.Set, Desc.Enumerable, Desc.Configurable);
        }
        return true;
    }
    if (isEveryFieldOcurrsAndSameAs(Desc, emptyPropertyDescriptor)) return true;
    if (isEveryFieldOcurrsAndSameAs(Desc, current)) return true;
    if (current.Configurable === false) {
        if (Desc.Configurable === true) {
            if (Throw === true) throw VMTypeError();
            else return false;
        }
        if (Desc.Enumerable !== absent && current.Enumerable !== Desc.Enumerable) {
            if (Throw === true) throw VMTypeError();
            else return false;
        }
    }
    if (IsGenericDescriptor(Desc) === true) {} else if (IsDataDescriptor(current) !== IsDataDescriptor(Desc)) {
        if (current.Configurable === false) {
            if (Throw === true) throw VMTypeError();
            else return false;
        }
        if (IsDataDescriptor(current) === true) {
            intrinsic_createAccessor(O, P, absent, absent, current.Enumerable, current.Configurable);
        } else {
            intrinsic_createData(O, P, absent, absent, current.Enumerable, current.Configurable);
        }
    } else if (IsDataDescriptor(current) === true && IsDataDescriptor(Desc) === true) {
        if (current.Configurable === false) {
            if (current.Writable === false && Desc.Writable === true) {
                if (Throw === true) throw VMTypeError();
                else return false;
            }
            if (current.Writable === false) {
                if (Desc.Value !== absent && SameValue(Desc.Value, current.Value) === false) {
                    if (Throw === true) throw VMTypeError();
                    else return false;
                }
            }
        } else {
            assert(current.Configurable, current);
        }
    } else {
        assert(IsAccessorDescriptor(current), current);
        assert(IsAccessorDescriptor(Desc), Desc);
        if (current.Configurable === false) {
            if (Desc.Set !== absent && Desc.Set !== current.Set) {
                if (Throw === true) throw VMTypeError();
                else return false;
            }
            if (Desc.Get !== absent && Desc.Get !== current.Get) {
                if (Throw === true) throw VMTypeError();
                else return false;
            }
        }
    }
    intrinsic_set(O, P, Desc);
    return true;
}

function isEveryFieldOcurrsAndSameAs(Desc, x) {
    if (Desc.Value !== absent) {
        if (x.Value === absent) return false;
        if (Desc.Value || x.Value) {
            if (Desc.Value !== x.Value) return false;
        } else if (!SameValue(Desc.Value, x.Value)) return false;
    }
    if (Desc.Writable !== absent) {
        if (x.Writable === absent) return false;
        if (Desc.Writable !== x.Writable) return false;
    }
    if (Desc.Get !== absent) {
        if (x.Get === absent) return false;
        if (Desc.Get !== x.Get) return false;
    }
    if (Desc.Set !== absent) {
        if (x.Set === absent) return false;
        if (Desc.Set !== x.Set) return false;
    }
    if (Desc.Configurable !== absent) {
        if (x.Configurable === absent) return false;
        if (Desc.Configurable !== x.Configurable) return false;
    }
    if (Desc.Enumerable !== absent) {
        if (x.Enumerable === absent) return false;
        if (Desc.Enumerable !== x.Enumerable) return false;
    }
    return true;
}

function default_enumerator(ownOnly, enumerableOnly) {
    return intrinsic_enumerator(this, ownOnly, enumerableOnly);
}

function intrinsic_set(O, P, Desc) {
    var x = O.properties[P];
    if (Desc.Value !== absent) x.Value = Desc.Value;
    if (Desc.Writable !== absent) x.Writable = Desc.Writable;
    if (Desc.Get !== absent) x.Get = Desc.Get;
    if (Desc.Set !== absent) x.Set = Desc.Set;
    if (Desc.Configurable !== absent) x.Configurable = Desc.Configurable;
    if (Desc.Enumerable !== absent) x.Enumerable = Desc.Enumerable;
}

function intrinsic_set_value(O, P, V) {
    O.properties[P].Value = V;
}

function intrinsic_remove(O, P) {
    delete O.properties[P] && O.numProps--;
}

function intrinsic_createData(O, P, Value, Writable, Enumerable, Configurable) {
    O.numProps++; // maybe inaccurate
    O.properties[P] = ({
        Value: (Value !== absent) ? Value : undefined,
        Writable: (Writable !== absent) ? Writable : false,
        Get: absent,
        Set: absent,
        Enumerable: (Enumerable !== absent) ? Enumerable : false,
        Configurable: (Configurable !== absent) ? Configurable : false,
    });
}

function intrinsic_createAccessor(O, P, Get, Set, Enumerable, Configurable) {
    O.numProps++; // maybe inaccurate
    O.properties[P] = ({
        Value: absent,
        Writable: absent,
        Get: (Get !== absent) ? Get : undefined,
        Set: (Set !== absent) ? Set : undefined,
        Enumerable: (Enumerable !== absent) ? Enumerable : false,
        Configurable: (Configurable !== absent) ? Configurable : false,
    });
}

function intrinsic_enumerator(O, ownOnly, enumerableOnly) {
    var names = Object.keys(O.properties);
    if (ownOnly !== true) {
        var all = Object.create(null);
        var proto = O;
        while (proto !== null) {
            for (var P in proto.properties) {
                var desc = proto.properties[P];
                if (enumerableOnly === false || desc.Enumerable === true) {
                    all[P] = P;
                }
            }
            proto = proto.Prototype;
        }
        var names = Object.keys(all);
    }
    names.sort(function(x, y) {
        var nx = +(x);
        var ny = +(y);
        if (isFinite(nx)) {
            if (!isFinite(ny)) {
                return -1;
            }
            if (nx < ny) return -1;
            if (nx > ny) return 1;
        } else if (isFinite(ny)) {
            return 1;
        }
        if (x < y) return -1;
        if (x > y) return 1;
        return 0;
    });
    var i = 0;
    var next = function() {
        while (true) {
            var P = names[i++];
            if (P === undefined) return undefined;
            var desc = O.properties[P];
            if (desc === undefined) {
                if (ownOnly === true) {
                    continue;
                }
                var proto = O.Prototype;
                while (proto !== null) {
                    var desc = proto.properties[P];
                    if (desc !== undefined) {
                        break;
                    }
                    proto = proto.Prototype;
                }
                if (desc === undefined) {
                    continue;
                }
            }
            if (enumerableOnly === false || desc.Enumerable === true) return P;
        }
    }
    return next;
}

function define(obj, name, value) {
    intrinsic_createData(obj, name, value, true, false, true);
}

function defineFinal(obj, name, value) {
    intrinsic_createData(obj, name, value, false, false, false);
}

function defineFree(obj, name, value) {
    intrinsic_createData(obj, name, value, true, true, true);
}

function defineWritable(obj, name, value) {
    intrinsic_createData(obj, name, value, true, false, false);
}

function defineCall(obj, func) {
    obj.Call = func;
}

function defineConstruct(obj, func) {
    obj.Construct = func;
}

function defineFunction(obj, name, length, func) {
    var F = VMObject(CLASSID_BuiltinFunction);
    F.Prototype = realm.Function_prototype;
    F.Extensible = true;
    defineCall(F, func);
    defineFinal(F, "length", length);
    defineFinal(F, "name", name);
    define(obj, name, F);
    return F;
}

function defineAccessor(obj, name, get, set) {
    if (get !== undefined) {
        var Get = VMObject(CLASSID_BuiltinFunction);
        Get.Prototype = realm.Function_prototype;
        Get.Extensible = true;
        defineCall(Get, get);
        defineFinal(Get, "length", 0);
        defineFinal(Get, "name", "get " + name);
    }
    if (set !== undefined) {
        var Set = VMObject(CLASSID_BuiltinFunction);
        Set.Prototype = realm.Function_prototype;
        Set.Extensible = true;
        defineCall(Set, set);
        defineFinal(Set, "length", 1);
        defineFinal(Set, "name", "set " + name);
    }
    intrinsic_createAccessor(obj, name, Get, Set, false, true);
}
