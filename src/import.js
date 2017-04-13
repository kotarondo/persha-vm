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

function classof_importing_object(a) {
    switch (Object.prototype.toString.call(a)) {
        case '[object Number]':
            return 'Number';
        case '[object String]':
            return 'String';
        case '[object Boolean]':
            return 'Boolean';
        case '[object Date]':
            return 'Date';
        case '[object RegExp]':
            return 'RegExp';
        case '[object Error]':
            return 'Error';
        case '[object Function]':
            return 'Function';
        case '[object Array]':
            return 'Array';
    }
    if (Buffer.isBuffer(a)) return 'Buffer';
}

function create_imported_object(type, arg1, arg2) {
    switch (type) {
        case 'Number':
            return Number_Construct([arg1]);
        case 'String':
            return String_Construct([arg1]);
        case 'Boolean':
            return Boolean_Construct([arg1]);
        case 'Date':
            return Date_Construct([arg1]);
        case 'Buffer':
            var obj = VMObject(CLASSID_Buffer);
            obj.Prototype = realm.Buffer_prototype;
            obj.Extensible = true;
            obj.wrappedBuffer = arg1;
            defineFinal(obj, "length", arg1.length);
            defineFinal(obj, "parent", obj);
            return obj;
        case 'RegExp':
            var regexp = RegExpFactory.compile(arg1, arg2, true);
            return RegExpFactory.createRegExpObject(regexp);
        case 'Error':
            switch (arg1) {
                case 'TypeError':
                    return TypeError_Construct([arg2]);
                case 'ReferenceError':
                    return ReferenceError_Construct([arg2]);
                case 'RangeError':
                    return RangeError_Construct([arg2]);
                case 'SyntaxError':
                    return SyntaxError_Construct([arg2]);
                case 'URIError':
                    return URIError_Construct([arg2]);
                case 'EvalError':
                    return EvalError_Construct([arg2]);
                case 'Error':
                    return Error_Construct([arg2]);
            }
            var err = Error_Construct([arg2]);
            define(err, "name", arg1);
            return err;
        case 'Array':
            return Array_Construct([]);
        case 'OpaqueObject':
            var obj = VMObject(CLASSID_OpaqueObject);
            obj.Prototype = realm.Object_prototype;
            obj.Extensible = true;
            obj.wrapped = ToBoolean(arg1.wrapped);
            obj.opaque = arg1.opaque;
            if (arg1.serializer) {
                define(obj, "serializer", String(arg1.serializer));
            }
            return obj;
    }
    return Object_Construct([]);
}

function importValue(a, index) {
    if (isPrimitiveValue(a)) {
        return a;
    }
    if (!index) {
        var index = new WeakMap();
    }
    if (index.has(a)) {
        return index.get(a);
    }
    switch (classof_importing_object(a)) {
        case 'Number':
            var v = Number(a.valueOf());
            var A = create_imported_object('Number', v);
            break;
        case 'String':
            var v = String(a.valueOf());
            var A = create_imported_object('String', v);
            break;
        case 'Boolean':
            var v = Boolean(a.valueOf());
            var A = create_imported_object('Boolean', v);
            break;
        case 'Date':
            var v = Number(a.getTime());
            var A = create_imported_object('Date', v);
            break;
        case 'Buffer':
            var v = new Buffer(a); // copy the buffer
            var A = create_imported_object('Buffer', v);
            break;
        case 'RegExp':
            var source = String(a.source);
            var flags = (a.global ? "g" : "") + (a.ignoreCase ? "i" : "") + (a.multiline ? "m" : "");
            var A = create_imported_object('RegExp', source, flags);
            break;
        case 'Error':
            var name = String(a.name);
            var message = String(a.message);
            var A = create_imported_object('Error', name, message);
            break;
        case 'Function':
            var A = undefined;
            break;
        case 'Array':
            var A = create_imported_object('Array');
            var dump_contents = true;
            break;
        default:
            if (a instanceof ExternalObject) {
                var A = create_imported_object('OpaqueObject', a);
                break;
            }
            var A = create_imported_object('Object');
            var dump_contents = true;
            break;
    }
    index.set(a, A);
    if (dump_contents) {
        var names = Object.getOwnPropertyNames(a);
        for (var i = 0; i < names.length; i++) {
            var P = names[i];
            var desc = Object.getOwnPropertyDescriptor(a, P);
            if (!desc.hasOwnProperty("value")) continue;
            var v = importValue(desc.value, index);
            intrinsic_createData(A, P, v, desc.writable, desc.enumerable, desc.configurable);
        }
    }
    return A;
}

function importArguments(args) {
    var index = new WeakMap();
    var argumentsList = [];
    for (var i = 0; i < args.length; i++) {
        argumentsList[i] = importValue(args[i], index);
    }
    return argumentsList;
}

function ExternalObject(opaque, serializer, wrapped) {
    this.opaque = opaque;
    this.serializer = serializer && String(serializer);
    this.wrapped = Boolean(wrapped);
}
