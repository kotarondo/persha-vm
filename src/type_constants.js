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

const TYPE_Undefined = 1;
const TYPE_Boolean = 2;
const TYPE_Number = 3;
const TYPE_String = 4;
const TYPE_Null = 5;
const TYPE_Object = 6;
const TYPE_Reference = 7;
const TYPE_EnvironmentRecord = 8;

const CLASSID_Object = 1;
const CLASSID_Function = 2;
const CLASSID_BuiltinFunction = 3;
const CLASSID_BindFunction = 4;
const CLASSID_Array = 5;
const CLASSID_String = 6;
const CLASSID_Boolean = 7;
const CLASSID_Number = 8;
const CLASSID_Date = 9;
const CLASSID_RegExp = 10;
const CLASSID_Error = 11;
const CLASSID_Global = 12;
const CLASSID_Math = 13;
const CLASSID_JSON = 14;
const CLASSID_Arguments = 15;
const CLASSID_PlainArguments = 16;
const CLASSID_DeclarativeEnvironment = 17;
const CLASSID_ObjectEnvironment = 18;
const CLASSID_SourceObject = 19; // pseudo class
const CLASSID_Buffer = 20;
const CLASSID_OpaqueFunction = 21;
const CLASSID_OpaqueObject = 22;
