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

/*
const IMPORT_OBJID_BASE = 20;

function importValueAndWriteToStream(a, stream, index, allObjs) {
    if (isPrimitiveValue(a)) {
        switch (typeof a) {
            case "undefined":
                stream.writeInt(1);
                return a;
            case "boolean":
                stream.writeInt((a === true) ? 2 : 3);
                return a;
            case "number":
                stream.writeInt(4);
                stream.writeNumber(a);
                return a;
            case "string":
                stream.writeInt(5);
                stream.writeString(a);
                return a;
        }
        if (a === null) {
            stream.writeInt(6);
            return a;
        }
    }
    if (index.has(a)) {
        var id = index.get(a);
        stream.writeInt(id);
        return allObjs[id];
    }
    switch (classof_importing_object(a)) {
        case 'Number':
            var v = Number(a.valueOf());
            stream.writeInt(7);
            stream.writeNumber(v);
            var A = create_imported_object('Number', v);
            break;
        case 'String':
            var v = String(a.valueOf());
            stream.writeInt(8);
            stream.writeString(v);
            var A = create_imported_object('String', v);
            break;
        case 'Boolean':
            var v = Boolean(a.valueOf());
            stream.writeInt((v === true) ? 9 : 10);
            var A = create_imported_object('Boolean', v);
            break;
        case 'Date':
            var v = Number(a.getTime());
            stream.writeInt(11);
            stream.writeNumber(v);
            var A = create_imported_object('Date', v);
            break;
        case 'Buffer':
            stream.writeInt(12);
            stream.writeBuffer(a);
            var A = create_imported_object('Buffer', new Buffer(a)); // copy the buffer
            break;
        case 'RegExp':
            var source = String(a.source);
            var flags = (a.global ? "g" : "") + (a.ignoreCase ? "i" : "") + (a.multiline ? "m" : "");
            stream.writeInt(13);
            stream.writeString(source);
            stream.writeString(flags);
            var A = create_imported_object('RegExp', source, flags);
            break;
        case 'Error':
            var name = String(a.name);
            var message = String(a.message);
            stream.writeInt(14);
            stream.writeString(name);
            stream.writeString(message);
            var A = create_imported_object('Error', name, message);
            break;
        case 'Function':
            stream.writeInt(15);
            var A = create_imported_object('Function', a);
            break;
        case 'Array':
            stream.writeInt(16);
            var A = create_imported_object('Array');
            var contents = true;
            break;
        default:
            stream.writeInt(17);
            var A = create_imported_object('Object');
            var contents = true;
            break;
    }
    index.set(a, allObjs.length);
    allObjs.push(A);
    if (contents) {
        var names = Object.getOwnPropertyNames(a);
        for (var i = 0; i < names.length; i++) {
            var P = names[i];
            var desc = Object.getOwnPropertyDescriptor(a, P);
            var value = desc.value;
            if (value === undefined) continue;
            var flags = (desc.writable ? 1 : 0) + (desc.enumerable ? 2 : 0) + (desc.configurable ? 4 : 0);
            stream.writeString(P);
            stream.writeInt(flags);
            var v = importValueAndWriteToStream(value, stream, index, allObjs);
            intrinsic_createData(A, P, v, (flags & 1) === 1, (flags & 2) === 2, (flags & 4) === 4);
        }
    }
    return A;
}

function importArgumentsAndWriteToStream(args, stream) {
    var index = new WeakMap();
    var allObjs = [];
    allObjs.length = IMPORT_OBJID_BASE;
    var argumentsList = [];
    for (var i = 0; i < args.length; i++) {
        argumentsList[i] = importValueAndWriteToStream(args[i], stream, index, allObjs);
    }
    stream.writeInt(0);
    return argumentsList;
}

function importArgumentsFromStream(stream) {
    //TODO
}
*/
