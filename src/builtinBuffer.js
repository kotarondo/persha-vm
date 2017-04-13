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

// Node.js Buffer

function Buffer_Call(thisValue, argumentsList) {
    return Buffer_Construct(argumentsList);
}

function Buffer_Construct(argumentsList) {
    var subject = argumentsList[0];
    if (Type(subject) === TYPE_Number) {
        try {
            var buf = new Buffer(subject);
        } catch (e) {
            redirectException(e);
        }
        buf.fill(0); // for deterministic behavior
    } else if (Type(subject) === TYPE_String) {
        var encoding = ToPrimitive(argumentsList[1]);
        try {
            var buf = new Buffer(subject, encoding);
        } catch (e) {
            redirectException(e);
        }
    } else if (Type(subject) === TYPE_Object && subject.Class === "Buffer") {
        try {
            var buf = new Buffer(subject.wrappedBuffer);
        } catch (e) {
            redirectException(e);
        }
    } else if (Type(subject) === TYPE_Object) {
        if (subject.Get("type") === "Buffer") {
            var data = subject.Get("data");
            if (Type(data) === TYPE_Object && data.Class === "Array") {
                subject = data;
            }
        }
        var len = ToNumber(subject.Get("length"));
        try {
            var buf = new Buffer(len);
        } catch (e) {
            redirectException(e);
        }
        var k = 0;
        while (k < len) {
            var P = ToString(k);
            var b = subject.Get(P);
            buf[k] = ToPrimitive(b);
            k++;
        }
    } else {
        throw VMTypeError();
    }
    var obj = VMObject(CLASSID_Buffer);
    obj.Prototype = realm.Buffer_prototype;
    obj.Extensible = true;
    obj.wrappedBuffer = buf;
    defineFinal(obj, "length", buf.length);
    defineFinal(obj, "parent", obj);
    return obj;
}

function Buffer_isEncoding(thisValue, argumentsList) {
    var encoding = ToPrimitive(argumentsList[0]);
    try {
        return Buffer.isEncoding(encoding);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_isBuffer(thisValue, argumentsList) {
    var obj = argumentsList[0];
    if (Type(obj) !== TYPE_Object || obj.Class !== "Buffer") return false;
    return true;
}

function Buffer_byteLength(thisValue, argumentsList) {
    var string = ToString(argumentsList[0]);
    var encoding = ToPrimitive(argumentsList[1]);
    try {
        return Buffer.byteLength(string, encoding);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_concat(thisValue, argumentsList) {
    var list = argumentsList[0];
    var totalLength = ToPrimitive(argumentsList[1]);
    if (Type(list) !== TYPE_Object) throw VMTypeError();
    var len = list.Get("length");
    if (len === 0) {
        return Buffer_Construct([0]);
    }
    if (len === 1) {
        return list.Get("0");
    }
    var A = [];
    var k = 0;
    while (k < len) {
        var P = ToString(k);
        var b = list.Get(P);
        if (Type(b) !== TYPE_Object || b.Class !== "Buffer") throw VMTypeError();
        A[k] = b.wrappedBuffer;
        k++;
    }
    try {
        var buf = Buffer.concat(A, totalLength);
    } catch (e) {
        redirectException(e);
    }
    var obj = VMObject(CLASSID_Buffer);
    obj.Prototype = realm.Buffer_prototype;
    obj.Extensible = true;
    obj.wrappedBuffer = buf;
    defineFinal(obj, "length", buf.length);
    defineFinal(obj, "parent", obj);
    return obj;
}

function Buffer_compare(thisValue, argumentsList) {
    var buf1 = argumentsList[0];
    var buf2 = argumentsList[1];
    if (Type(buf1) !== TYPE_Object || buf1.Class !== "Buffer") throw VMTypeError();
    if (Type(buf2) !== TYPE_Object || buf2.Class !== "Buffer") throw VMTypeError();
    try {
        return Buffer.compare(buf1.wrappedBuffer, buf2.wrappedBuffer);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_write(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var string = ToPrimitive(argumentsList[0]);
    var offset = ToPrimitive(argumentsList[1]);
    var length = ToPrimitive(argumentsList[2]);
    var encoding = ToPrimitive(argumentsList[3]);
    try {
        return thisValue.wrappedBuffer.write(string, offset, length, encoding);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeUIntLE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var byteLength = ToNumber(argumentsList[2]);
    var noAssert = ToBoolean(argumentsList[3]);
    try {
        return thisValue.wrappedBuffer.writeUIntLE(value, offset, byteLength, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeUIntBE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var byteLength = ToNumber(argumentsList[2]);
    var noAssert = ToBoolean(argumentsList[3]);
    try {
        return thisValue.wrappedBuffer.writeUIntBE(value, offset, byteLength, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeIntLE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var byteLength = ToNumber(argumentsList[2]);
    var noAssert = ToBoolean(argumentsList[3]);
    try {
        return thisValue.wrappedBuffer.writeIntLE(value, offset, byteLength, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeIntBE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var byteLength = ToNumber(argumentsList[2]);
    var noAssert = ToBoolean(argumentsList[3]);
    try {
        return thisValue.wrappedBuffer.writeIntBE(value, offset, byteLength, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readUIntLE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var byteLength = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.readUIntLE(offset, byteLength, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readUIntBE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var byteLength = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.readUIntBE(offset, byteLength, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readIntLE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var byteLength = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.readIntLE(offset, byteLength, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readIntBE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var byteLength = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.readIntBE(offset, byteLength, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_toString(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var encoding = ToPrimitive(argumentsList[0]);
    var start = ToPrimitive(argumentsList[1]);
    var end = ToPrimitive(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.toString(encoding, start, end);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_toJSON(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var buf = thisValue.wrappedBuffer;
    var len = buf.length;
    var A = Array_Construct([len]);
    for (var i = 0; i < len; i++) {
        A.Put(ToString(i), buf[i]);
    }
    var O = Object_Construct([]);
    O.Put("type", "Buffer");
    O.Put("data", A);
    return O;
}

function Buffer_prototype_equals(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var otherBuffer = argumentsList[0];
    if (Type(otherBuffer) !== TYPE_Object || otherBuffer.Class !== "Buffer") throw VMTypeError();
    try {
        return thisValue.wrappedBuffer.equals(otherBuffer.wrappedBuffer);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_compare(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var otherBuffer = argumentsList[0];
    if (Type(otherBuffer) !== TYPE_Object || otherBuffer.Class !== "Buffer") throw VMTypeError();
    try {
        return thisValue.wrappedBuffer.compare(otherBuffer.wrappedBuffer);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_copy(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var targetBuffer = argumentsList[0];
    var targetStart = ToPrimitive(argumentsList[1]);
    var sourceStart = ToPrimitive(argumentsList[2]);
    var sourceEnd = ToPrimitive(argumentsList[3]);
    if (Type(targetBuffer) !== TYPE_Object || targetBuffer.Class !== "Buffer") throw VMTypeError();
    try {
        return thisValue.wrappedBuffer.copy(targetBuffer.wrappedBuffer, targetStart, sourceStart, sourceEnd);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_slice(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var start = ToPrimitive(argumentsList[0]);
    var end = ToPrimitive(argumentsList[1]);
    try {
        var buf = thisValue.wrappedBuffer.slice(start, end);
    } catch (e) {
        redirectException(e);
    }
    var obj = VMObject(CLASSID_Buffer);
    obj.Prototype = realm.Buffer_prototype;
    obj.Extensible = true;
    obj.wrappedBuffer = buf;
    defineFinal(obj, "length", buf.length);
    if (buf.length > 0) {
        defineFinal(obj, "parent", thisValue.Get("parent"));
    }
    return obj;
}

function Buffer_prototype_readUInt8(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readUInt8(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readUInt16LE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readUInt16LE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readUInt16BE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readUInt16BE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readUInt32LE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readUInt32LE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readUInt32BE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readUInt32BE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readInt8(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readInt8(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readInt16LE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readInt16LE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readInt16BE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readInt16BE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readInt32LE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readInt32LE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readInt32BE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readInt32BE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readFloatLE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readFloatLE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readFloatBE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readFloatBE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readDoubleLE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readDoubleLE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_readDoubleBE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var offset = ToNumber(argumentsList[0]);
    var noAssert = ToBoolean(argumentsList[1]);
    try {
        return thisValue.wrappedBuffer.readDoubleBE(offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeUInt8(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeUInt8(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeUInt16LE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeUInt16LE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeUInt16BE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeUInt16BE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeUInt32LE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeUInt32LE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeUInt32BE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeUInt32BE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeInt8(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeInt8(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeInt16LE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeInt16LE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeInt16BE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeInt16BE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeInt32LE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeInt32LE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeInt32BE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeInt32BE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeFloatLE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeFloatLE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeFloatBE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeFloatBE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeDoubleLE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeDoubleLE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_writeDoubleBE(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToNumber(argumentsList[0]);
    var offset = ToNumber(argumentsList[1]);
    var noAssert = ToBoolean(argumentsList[2]);
    try {
        return thisValue.wrappedBuffer.writeDoubleBE(value, offset, noAssert);
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_prototype_fill(thisValue, argumentsList) {
    if (Type(thisValue) !== TYPE_Object || thisValue.Class !== "Buffer") throw VMTypeError();
    var value = ToPrimitive(argumentsList[0]);
    var offset = ToPrimitive(argumentsList[1]);
    var end = ToPrimitive(argumentsList[2]);
    try {
        thisValue.wrappedBuffer.fill(value, offset, end);
        return thisValue;
    } catch (e) {
        redirectException(e);
    }
}

function Buffer_GetOwnProperty(P) {
    var B = this;
    var index = ToArrayIndex(P);
    if (index < 0) {
        return default_GetOwnProperty.call(B, P);
    }
    var buf = B.wrappedBuffer;
    var len = buf.length;
    if (len <= index) return undefined;
    var result = buf[index];
    return DataPropertyDescriptor(result, true, true, false);
}

function Buffer_enumerator(ownOnly, enumerableOnly) {
    var B = this;
    var next = intrinsic_enumerator(B, ownOnly, enumerableOnly);
    var buf = B.wrappedBuffer;
    var i = 0;
    var len = buf.length;
    return function() {
        if (i < len) return ToString(i++);
        return next();
    };
}

function Buffer_DefineOwnProperty(P, Desc, Throw) {
    var B = this;
    var index = ToArrayIndex(P);
    if (index < 0) {
        return default_DefineOwnProperty.call(B, P, Desc, Throw);
    }
    var buf = B.wrappedBuffer;
    var len = buf.length;
    if (len <= index) return false;
    if (IsAccessorDescriptor(Desc) === true) {
        if (Throw === true) throw VMTypeError();
        else return false;
    }
    if (Desc.Configurable === true) {
        if (Throw === true) throw VMTypeError();
        else return false;
    }
    if (Desc.Enumerable === false) {
        if (Throw === true) throw VMTypeError();
        else return false;
    }
    if (Desc.Writable === false) {
        if (Throw === true) throw VMTypeError();
        else return false;
    }
    if (Desc.Value !== absent) {
        var value = ToUint32(Desc.Value);
        buf[index] = value;
    }
    return true;
}

function Buffer_FastGet(P) {
    var O = this;
    var index = ToArrayIndex(P);
    if (0 <= index) {
        var buf = O.wrappedBuffer;
        var len = buf.length;
        if (index < len) return buf[index];
    }
    return default_Get.call(O, P);
}

function Buffer_FastPut(P, V, Throw) {
    var O = this;
    var index = ToArrayIndex(P);
    if (0 <= index) {
        var buf = O.wrappedBuffer;
        var len = buf.length;
        if (index < len) buf[index] = ToUint32(V);
    }
    return default_Put.call(O, P, V, Throw);
}

function redirectException(e) {
    if (e instanceof TypeError) {
        throw VMTypeError(e.message);
    }
    if (e instanceof RangeError) {
        throw VMRangeError(e.message);
    }
    if (e instanceof ReferenceError) {
        throw VMReferenceError(e.message);
    }
    assert(false, e);
}
