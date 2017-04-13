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

// ECMAScript 5.1: 15.10 RegExp Objects

const RegExpFactory = (function() {
    return ({
        compile: compile,
        recompile: recompile,
        createRegExpObject: createRegExpObject,
        SyntaxError: SyntaxError,
    });

    var source;
    var current;
    var lookahead;
    var lookahead2;
    var currentPos;

    function setPattern(pattern) {
        source = pattern;
        currentPos = 0;
        current = source[0];
        lookahead = source[1];
        lookahead2 = source[2];
    }

    function expecting(c) {
        if (c !== current) throw SyntaxError();
        proceed();
    }

    function proceed(count) {
        var c = current;
        if (count === undefined) {
            count = 1;
        }
        for (var i = 0; i < count; i++) {
            if (current === undefined) throw SyntaxError();
            currentPos++;
            current = lookahead;
            lookahead = lookahead2;
            lookahead2 = source[currentPos + 2];
        }
        return c;
    }

    var leftCapturingParentheses;
    var oneCharacterOfCharSet;
    var NCapturingParens;
    var IgnoreCase;
    var Multiline;

    function evaluatePattern(regexp, dynamic) {
        IgnoreCase = regexp.ignoreCase;
        Multiline = regexp.multiline;
        NCapturingParens = regexp.NCapturingParens;

        setPattern(regexp.source);
        leftCapturingParentheses = 0;
        var m = evaluateDisjunction();
        if (current !== undefined) throw SyntaxError();
        assert(NCapturingParens === leftCapturingParentheses);
        /* original code
        regexp.Match = function(str, index) {
            Input = str;
            InputLength = Input.length;
            IgnoreCase = regexp.ignoreCase; // executing time
            Multiline = regexp.multiline; // executing time
            var x = State(index, []);
            return unpending(m(x, noContinuation));
        };
        */
        var ctx = new RegExpCompilerContext("Input, index");
        ctx.text("var InputLength = Input.length;");
        ctx.text("var x = State(index, []);");
        ctx.text("var stack=[['Exit']];");
        ctx.text("var swidx=2;");
        ctx.text("Lwh:while(true){");
        ctx.text("Lsw:switch(swidx){");
        ctx.text("case 2:");
        ctx.compileMatcher(m, 0);
        ctx.text("default:assert(false,'must not reach here');");
        ctx.text("}");
        ctx.text("while(true){");
        ctx.text("var f=stack.pop()");
        ctx.text("if(f[0]==='Failure'&&x===failure){swidx=f[1];break;}");
        ctx.text("if(f[0]==='Exit'){return x;}");
        ctx.text("if(f[0]==='Return'){swidx=f[1];break;}");
        ctx.text("}");
        ctx.text("}");
        regexp.Match = ctx.finish();
        //if(!dynamic) console.log(ctx.texts.join('\n'));
    }

    function evaluateDisjunction() {
        var m1 = evaluateAlternative();
        if (current !== '|') return m1;
        proceed();
        var m2 = evaluateDisjunction();
        /* original code
        return function(x, c) {
            var r = unpending(m1(x, c));
            if (r !== failure) return r;
            return m2(x, c);
        };
        */
        return RegExpCompilerContext.matcher(function(ctx, c) {
            var L = ctx.newEntry("x");
            ctx.setFailureHandler(L);
            ctx.compileMatcher(m1, c);
            ctx.entry(L, "x");
            ctx.compileMatcher(m2, c);
        });
    }

    /* original code
    function evaluateAlternative() {
        function defaultMatcher(x, c) {
            return pending(c, x);
        }
        function concat(m1, m2) {
            return function(x, c) {
                var d = function(y) {
                    return m2(y, c);
                };
                return m1(x, d);
            };
        }
        var m1 = defaultMatcher;
        while (true) {
            var m2 = evaluateTerm();
            if (m2 === undefined) break;
            var m1 = concat(m1, m2);
        }
        return m1;
    }
    */

    function evaluateAlternative() {
        var chain = [];
        while (true) {
            var m = evaluateTerm();
            if (m === undefined) break;
            chain.push(m);
        }
        if (chain.length === 0) {
            return RegExpCompilerContext.matcher(function(ctx, c) {
                ctx.jump(c);
            });
        }
        if (chain.length === 1) {
            return chain[0];
        }
        return RegExpCompilerContext.matcher(function(ctx, c) {
            for (var i = 0; i < chain.length - 1; i++) {
                var L = ctx.newEntry();
                ctx.compileMatcher(chain[i], L);
                ctx.entry(L);
            }
            ctx.compileMatcher(chain[i], c);
        });
    }

    function evaluateTerm() {
        var parenIndex = leftCapturingParentheses;
        var t = evaluateAssertionTester();
        if (t !== undefined) {
            /* original code
            return function(x, c) {
                var r = t(x);
                if (r === false) return failure;
                return pending(c, x);
            };
            */
            return RegExpCompilerContext.matcher(function(ctx, c) {
                ctx.compileTester(t);
                ctx.failure_if("r === false");
                ctx.jump(c);
            });
        }
        var m = evaluateAssertion();
        if (m !== undefined) return m;
        var m = evaluateAtom();
        if (m === undefined) return undefined;
        var q = evaluateQuantifier();
        if (q === undefined) {
            return m;
        }
        var parenCount = leftCapturingParentheses - parenIndex;
        /* original code
        return function(x, c) {
            return RepeatMatcher(m, q.min, q.max, q.greedy, x, c, parenIndex, parenCount);
        };
        */
        return RegExpCompilerContext.matcher(function(ctx, c) {
            ctx.text("var min=" + q.min + ";");
            ctx.text("var max=" + q.max + ";");
            var loop = ctx.loop();
            ctx.jump_if("max <= 0", c);
            var d = ctx.newEntry("x", "min", "max");
            if (parenCount === 0) {
                ctx.text("var xr = x;");
            } else {
                ctx.text("var cap = arraycopy(x.captures);");
                for (var k = parenIndex + 1; k <= parenIndex + parenCount; k++) {
                    ctx.text("cap[" + k + "] = undefined;");
                }
                ctx.text("var xr = State(x.endIndex, cap);");
            }
            if (q.greedy === false) {
                var L = ctx.newEntry("xr");
                ctx.jump_if("min > 0", L);
                ctx.setFailureHandler(L);
                ctx.jump(c);
                ctx.entry(L, "x");
                ctx.compileMatcher(m, d);
            } else {
                ctx.text("if (min <= 0) {");
                var L = ctx.newEntry("x");
                ctx.setFailureHandler(L);
                ctx.text("}");
                ctx.text("x = xr;");
                ctx.compileMatcher(m, d);
                ctx.entry(L, "x");
                ctx.jump(c);
            }
            ctx.entry(d, "y", "min", "max");
            ctx.failure_if("min === 0 && x.endIndex === y.endIndex");
            ctx.text("var min= min-1;");
            ctx.text("var max= max-1;");
            ctx.jump(loop);
        });
    }

    /* original code
    function RepeatMatcher(m, min, max, greedy, x, c, parenIndex, parenCount) {
        if (max === 0) return pending(c, x);
        if (min === 0 && greedy === true) return RepeatMatcher0Greedy(m, max, x, c, parenIndex, parenCount);
        var d = function(y) {
            if (min === 0 && y.endIndex === x.endIndex) return failure;
            if (min === 0) {
                var min2 = 0;
            }
            else {
                var min2 = min - 1;
            }
            if (max === Infinity) {
                var max2 = Infinity;
            }
            else {
                var max2 = max - 1;
            }
            return RepeatMatcher(m, min2, max2, greedy, y, c, parenIndex, parenCount);
        };
        var cap = arraycopy(x.captures);
        for (var k = parenIndex + 1; k <= parenIndex + parenCount; k++) {
            cap[k] = undefined;
        }
        var e = x.endIndex;
        var xr = State(e, cap);
        if (min !== 0) return m(xr, d);
        if (greedy === false) {
            var z = unpending(c(x));
            if (z !== failure) return z;
            return m(xr, d);
        }
        var z = unpending(m(xr, d));
        if (z !== failure) return z;
        return pending(c, x);
    }
    */

    /* original code
    // optimized loop version
    function RepeatMatcher0Greedy(m, max, x, c, parenIndex, parenCount) {
        var stack = [];
        while (true) {
            if (max === 0) break;
            var d = function(y) {
                if (y.endIndex === x.endIndex) return failure;
                return RepeatMatcher0Greedy(m, max - 1, y, c, parenIndex, parenCount);
            };
            var cap = arraycopy(x.captures);
            for (var k = parenIndex + 1; k <= parenIndex + parenCount; k++) {
                cap[k] = undefined;
            }
            var e = x.endIndex;
            var xr = State(e, cap);
            var y = m(xr, d);
            if (y.pendingContinuation !== d) {
                var z = unpending(y);
                if (z !== failure) return z;
                break;
            }
            y.pendingContinuation = undefined;
            if (y.endIndex === x.endIndex) break;
            stack.push(x);
            x = y;
            max = max - 1;
        }
        while (stack.length > 0) {
            var z = unpending(c(x));
            if (z !== failure) return z;
            x = stack.pop();
        }
        return pending(c, x);
    }
    */

    /* original code
    function IsWordChar(e) {
        if (e === -1 || e === InputLength) return false;
        var c = Input[e];
        if (c === '_' || isDigitChar(c)) return true;
        return false;
    }
    */

    function evaluateAssertionTester() {
        if (current === '^') {
            proceed();
            /* original code
            return function(x) {
                var e = x.endIndex;
                if (e === 0) return true;
                if (Multiline === false) return false;
                if (isLineTerminator(Input[e - 1])) return true;
                return false;
            };
            */
            return RegExpCompilerContext.tester(function(ctx) {
                ctx.text("var e = x.endIndex;");
                ctx.text("var r = (e === 0);");
                if (Multiline) {
                    ctx.text("r = r || isLineTerminator(Input[e - 1]);");
                }
            });
        }
        if (current === '$') {
            proceed();
            /* original code
            return function(x) {
                var e = x.endIndex;
                if (e === InputLength) return true;
                if (Multiline === false) return false;
                if (isLineTerminator(Input[e])) return true;
                return false;
            };
            */
            return RegExpCompilerContext.tester(function(ctx) {
                ctx.text("var e = x.endIndex;");
                ctx.text("var r = (e === InputLength);");
                if (Multiline) {
                    ctx.text("r = r || isLineTerminator(Input[e]);");
                }
            });
        }
        if (current === '\\' && lookahead === 'b') {
            proceed(2);
            /* original code
            return function(x) {
                var e = x.endIndex;
                var a = IsWordChar(e - 1);
                var b = IsWordChar(e);
                if (a === true && b === false) return true;
                if (a === false && b === true) return true;
                return false;
            };
            */
            return RegExpCompilerContext.tester(function(ctx) {
                ctx.text("var e = x.endIndex;");
                ctx.text("var a = (e !== 0 && ((r=Input[e-1]) === '_' || isDigitChar(r)))");
                ctx.text("var b = (e !== InputLength && ((r=Input[e]) === '_' || isDigitChar(r)))");
                ctx.text("var r= (a !== b);");
            });
        }
        if (current === '\\' && lookahead === 'B') {
            proceed(2);
            /* original code
            return function(x) {
                var e = x.endIndex;
                var a = IsWordChar(e - 1);
                var b = IsWordChar(e);
                if (a === true && b === false) return false;
                if (a === false && b === true) return false;
                return true;
            };
            */
            return RegExpCompilerContext.tester(function(ctx) {
                ctx.text("var e = x.endIndex;");
                ctx.text("var a = (e !== 0 && ((r=Input[e-1]) === '_' || isDigitChar(r)))");
                ctx.text("var b = (e !== InputLength && ((r=Input[e]) === '_' || isDigitChar(r)))");
                ctx.text("var r= (a === b);");
            });
        }
        return undefined;
    }

    function evaluateAssertion() {
        if (current === '(' && lookahead === '?' && lookahead2 === '=') {
            proceed(3);
            var m = evaluateDisjunction();
            expecting(')');
            /* original code
            return function(x, c) {
                var r = unpending(m(x, noContinuation));
                if (r === failure) return failure;
                var y = r;
                var cap = y.captures;
                var xe = x.endIndex;
                var z = State(xe, cap);
                return pending(c, z);
            };
            */
            return RegExpCompilerContext.matcher(function(ctx, c) {
                var L = ctx.newEntry("x");
                ctx.setReturnHandler(L);
                ctx.compileMatcher(m, 0);
                ctx.entry(L, "y");
                ctx.failure_if("x === failure");
                ctx.text("x = State(y.endIndex, x.captures);");
                ctx.jump(c);
            });
        }
        if (current === '(' && lookahead === '?' && lookahead2 === '!') {
            proceed(3);
            var m = evaluateDisjunction();
            expecting(')');
            /* original code
            return function(x, c) {
                var r = unpending(m(x, noContinuation));
                if (r !== failure) return failure;
                return pending(c, x);
            };
            */
            return RegExpCompilerContext.matcher(function(ctx, c) {
                var L = ctx.newEntry("x");
                ctx.setReturnHandler(L);
                ctx.compileMatcher(m, 0);
                ctx.entry(L, "y");
                ctx.failure_if("x !== failure");
                ctx.text("x = y;");
                ctx.jump(c);
            });
        }
        return undefined;
    }

    function evaluateQuantifier() {
        var min, max, greedy;
        if (current === '*') {
            proceed();
            min = 0;
            max = Infinity;
        } else if (current === '+') {
            proceed();
            min = 1;
            max = Infinity;
        } else if (current === '?') {
            proceed();
            min = 0;
            max = 1;
        } else if (current === '{') {
            proceed();
            min = evaluateDecimalDigits();
            if (current === '}') {
                proceed();
                max = min;
            } else if (current === ',' && lookahead === '}') { // '{'
                proceed(2);
                max = Infinity;
            } else if (current === ',') {
                proceed();
                max = evaluateDecimalDigits();
                expecting('}'); // '{'
            } else throw SyntaxError();
        } else return undefined;
        var greedy = true;
        if (current === '?') {
            proceed();
            var greedy = false;
        }
        if (isFinite(max) && (max < min)) throw SyntaxError();
        if (isIncluded(current, "{}")) throw SyntaxError();
        return {
            min: min,
            max: max,
            greedy: greedy
        };
    }

    function evaluateDecimalDigits() {
        if (isDecimalDigitChar(current) === false) throw SyntaxError();
        var x = 0;
        while (isDecimalDigitChar(current)) {
            x = x * 10 + mvDigitChar(current);
            proceed();
        }
        return x;
    }

    function evaluateAtom() {
        if (current === undefined) return undefined;
        if (current === '.') {
            proceed();
            /* original code
            var A = function(cc) {
                if (isLineTerminator(cc)) return false;
                return true;
            };
            */
            var A = RegExpCompilerContext.charset(function(ctx) {
                ctx.text("var r = !isLineTerminator(cc);");
            });
            return CharacterSetMatcher(A, false);
        }
        if (current === '\\') {
            proceed();
            return evaluateAtomEscape();
        }
        if (current === '[') {
            proceed();
            return evaluateCharacterClassMatcher();
        }
        if (current === '(' && lookahead === '?' && lookahead2 === ':') {
            proceed(3);
            var m = evaluateDisjunction();
            expecting(')');
            return m;
        }
        if (current === '(') {
            proceed();
            var parenIndex = leftCapturingParentheses++;
            var m = evaluateDisjunction();
            expecting(')');
            /* original code
            return function(x, c) {
                var d = function(y) {
                    var cap = arraycopy(y.captures);
                    var xe = x.endIndex;
                    var ye = y.endIndex;
                    var s = Input.substring(xe, ye);
                    cap[parenIndex + 1] = s;
                    var z = State(ye, cap);
                    return pending(c, z);
                };
                return m(x, d);
            };
            */
            return RegExpCompilerContext.matcher(function(ctx, c) {
                var d = ctx.newEntry("x");
                ctx.compileMatcher(m, d);
                ctx.entry(d, "z");
                ctx.text("var cap = arraycopy(x.captures);");
                ctx.text("cap[" + (parenIndex + 1) + "] = Input.substring(z.endIndex, x.endIndex);");
                ctx.text("x = State(x.endIndex, cap);");
                ctx.jump(c);
            });
        }
        if (isIncluded(current, "*+?)|")) return undefined;
        var A = oneElementCharSet(proceed());
        return CharacterSetMatcher(A, false);
    }

    function oneElementCharSet(ch) {
        oneCharacterOfCharSet = ch;
        if (IgnoreCase) var cch = Canonicalize(ch);
        if (!IgnoreCase) var cch = ch;
        /* original code
        return function(cc) {
            return cch === cc;
        };
        */
        return RegExpCompilerContext.charset(function(ctx) {
            ctx.text("var r = " + ctx.quote(cch) + " === cc;");
        });
    }

    function CharacterSetMatcher(A, invert) {
        /* original code
        return function(x, c) {
            var e = x.endIndex;
            if (e === InputLength) return failure;
            var ch = Input[e];
            var cc = CanonicalizeI(ch);
            if (invert === false) {
                if (A(cc) === false) return failure;
            }
            else if (A(cc) === true) return failure;
            var cap = x.captures;
            var y = State(e + 1, cap);
            return pending(c, y);
        };
        */
        return RegExpCompilerContext.matcher(function(ctx, c) {
            ctx.text("var e = x.endIndex;");
            ctx.failure_if("e === InputLength");
            if (IgnoreCase) ctx.text("var cc = Canonicalize(Input[e]);");
            if (!IgnoreCase) ctx.text("var cc = Input[e];");
            ctx.compileCharSet(A);
            if (invert === false) ctx.failure_if("r === false");
            else ctx.failure_if("r === true");
            ctx.text("x = State(e + 1, x.captures);");
            ctx.jump(c);
        });
    }

    function evaluateAtomEscape() {
        var E = evaluateDecimalEscape();
        if (E !== undefined) {
            if (Type(E) === TYPE_String) {
                var ch = E;
                var A = oneElementCharSet(ch);
                return CharacterSetMatcher(A, false);
            }
            var n = E;
            if (n > NCapturingParens) {
                /* original code
                return function(x, c) {
                    return failure;
                };
                */
                return RegExpCompilerContext.matcher(function(ctx, c) {
                    ctx.failure();
                });
            }

            /* original code
            return function(x, c) {
                var cap = x.captures;
                var s = cap[n];
                if (s === undefined) return pending(c, x);
                var e = x.endIndex;
                var len = s.length;
                var f = e + len;
                if (f > InputLength) return failure;
                for (var i = 0; i < len; i++) {
                    if (CanonicalizeI(s[i]) !== CanonicalizeI(Input[e + i])) return failure;
                }
                var y = State(f, cap);
                return pending(c, y);
            };
            */
            return RegExpCompilerContext.matcher(function(ctx, c) {
                ctx.text("var cap = x.captures;");
                ctx.text("var s = cap[" + n + "];");
                ctx.jump_if("s === undefined", c);
                ctx.text("var e = x.endIndex;");
                ctx.text("var len = s.length;");
                ctx.text("var f = e + len;");
                ctx.failure_if("f > InputLength");
                ctx.text("for (var i = 0; i < len; i++) {");
                if (IgnoreCase) ctx.failure_if("Canonicalize(s[i]) !== Canonicalize(Input[e + i])");
                if (!IgnoreCase) ctx.failure_if("s[i] !== Input[e + i]");
                ctx.text("}");
                ctx.text("x = State(f, cap);");
                ctx.jump(c);
            });
        }
        if (isIncluded(current, "dDsSwW")) {
            var A = evaluateCharacterClassEscape();
            return CharacterSetMatcher(A, false);
        }
        var ch = evaluateCharacterEscape();
        if (ch === undefined) {
            /* original code
            return function(x, c) {
                return failure;
            };
            */
            return RegExpCompilerContext.matcher(function(ctx, c) {
                ctx.failure();
            });
        }
        var A = oneElementCharSet(ch);
        return CharacterSetMatcher(A, false);
    }

    function evaluateCharacterEscape() {
        var c = proceed();
        switch (c) {
            case 't':
                return '\u0009';
            case 'n':
                return '\u000A';
            case 'v':
                return '\u000B';
            case 'f':
                return '\u000C';
            case 'r':
                return '\u000D';
            case 'c':
                if ((mvDigitChar(current) >= 10) === false) {
                    if (isIncluded(current, "/^$\\.*+?()[]{}|")) throw SyntaxError();
                    return undefined;
                }
                var ch = proceed();
                var i = toCharCode(ch);
                var j = i % 32;
                return charCode2String(j);
            case 'x':
                var x = 0;
                for (var i = 0; i < 2; i++) {
                    if (!isHexDigitChar(current)) {
                        return undefined;
                    }
                    x = (x << 4) + mvDigitChar(current);
                    proceed();
                }
                return charCode2String(x);
            case 'u':
                var x = 0;
                for (var i = 0; i < 4; i++) {
                    if (!isHexDigitChar(current)) {
                        return undefined;
                    }
                    x = (x << 4) + mvDigitChar(current);
                    proceed();
                }
                return charCode2String(x);
            case '\u200d': // <ZWJ>
            case '\u200c': // <ZWNJ>
                return c;
        }
        return c;
    }

    function evaluateDecimalEscape() {
        if (isDecimalDigitChar(current) === false) return undefined;
        if (current === '0') {
            proceed();
            if (isDecimalDigitChar(current)) throw SyntaxError();
            return '\u0000';
        }
        var x = 0;
        while (isDecimalDigitChar(current)) {
            x = x * 10 + mvDigitChar(current);
            proceed();
        }
        return x;
    }

    function evaluateOctalEscape() {
        if (isDecimalDigitChar(current) === false) return undefined;
        if (current === '0') {
            proceed();
            if (isDecimalDigitChar(current)) throw SyntaxError();
            return '\u0000';
        }
        var x = 0;
        while (isDecimalDigitChar(current)) {
            if (current === '8' || current === '9') throw SyntaxError();
            x = x * 8 + mvDigitChar(current);
            proceed();
        }
        return charCode2String(x);
    }

    function evaluateCharacterClassEscape() {
        switch (proceed()) {
            case 'd':
                /* original code
                return function(cc) {
                    if (isDecimalDigitChar(cc)) return true;
                    return false;
                };
                */
                return RegExpCompilerContext.charset(function(ctx) {
                    ctx.text("var r = isDecimalDigitChar(cc);");
                });
            case 'D':
                /* original code
                return function(cc) {
                    if (isDecimalDigitChar(cc)) return false;
                    return true;
                };
                */
                return RegExpCompilerContext.charset(function(ctx) {
                    ctx.text("var r = !isDecimalDigitChar(cc);");
                });
            case 's':
                /* original code
                return function(cc) {
                    if (isWhiteSpace(cc) || isLineTerminator(cc)) return true;
                    return false;
                };
                */
                return RegExpCompilerContext.charset(function(ctx) {
                    ctx.text("var r = (isWhiteSpace(cc) || isLineTerminator(cc));");
                });
            case 'S':
                /* original code
                return function(cc) {
                    if (isWhiteSpace(cc) || isLineTerminator(cc)) return false;
                    return true;
                };
                */
                return RegExpCompilerContext.charset(function(ctx) {
                    ctx.text("var r = !(isWhiteSpace(cc) || isLineTerminator(cc));");
                });
            case 'w':
                /* original code
                return function(cc) {
                    if (cc === '_' || isDigitChar(cc)) return true;
                    return false;
                };
                */
                return RegExpCompilerContext.charset(function(ctx) {
                    ctx.text("var r = (cc === '_' || isDigitChar(cc));");
                });
            case 'W':
                /* original code
                return function(cc) {
                    if (cc === '_' || isDigitChar(cc)) return false;
                    return true;
                };
                */
                return RegExpCompilerContext.charset(function(ctx) {
                    ctx.text("var r = !(cc === '_' || isDigitChar(cc));");
                });
        }
        return false;
    }

    function evaluateCharacterClassMatcher() {
        if (current === '^') {
            proceed();
            var A = evaluateClassRanges();
            return CharacterSetMatcher(A, true);
        }
        var A = evaluateClassRanges();
        return CharacterSetMatcher(A, false);
    }

    function evaluateClassRanges() {
        var charSets = [];
        while (current !== ']') {
            var A = evaluateClassAtom();
            var a = oneCharacterOfCharSet;
            if (current === '-') {
                proceed();
                if (current === ']') {
                    charSets.push(A);
                    charSets.push(oneElementCharSet('-'));
                } else {
                    var B = evaluateClassAtom();
                    var b = oneCharacterOfCharSet;
                    if (a === undefined || b === undefined) {
                        charSets.push(A);
                        charSets.push(oneElementCharSet('-'));
                        charSets.push(B);
                    } else {
                        var i = toCharCode(a);
                        var j = toCharCode(b);
                        if (i > j) throw SyntaxError();
                        var D = rangeCharSet(i, j);
                        charSets.push(D);
                    }
                }
            } else {
                charSets.push(A);
            }
        }
        proceed();
        return unionCharSet(charSets);
    }

    function rangeCharSet(i, j) {
        /* original code
        return function(cc) {
            if (IgnoreCase === false) {
                var k = toCharCode(cc);
                if ((i <= k) && (k <= j)) return true;
                return false;
            }
            else {
                for (var k = i; k <= j; k++) {
                    var ch = charCode2String(k);
                    if (Canonicalize(ch) === cc) return true;
                }
                return false;
            }
        };
        */
        return RegExpCompilerContext.charset(function(ctx) {
            if (IgnoreCase === false) {
                ctx.text("var k = toCharCode(cc);");
                ctx.text("if ((" + i + " <= k) && (k <= " + j + ")) var r= true;");
                ctx.text("else var r= false;");
            } else {
                ctx.text("var r= false;");
                ctx.text("for (var k = " + i + "; k <= " + j + "; k++) {");
                ctx.text("var ch = charCode2String(k);");
                ctx.text("if (Canonicalize(ch) === cc) var r= true;");
                ctx.text("}");
            }
        });
    }

    function unionCharSet(charSets) {
        /* original code
        return function(cc) {
            for (var i = 0; i < charSets.length; i++) {
                var A = charSets[i];
                if (A(cc) === true) return true;
            }
            return false;
        };
        */
        return RegExpCompilerContext.charset(function(ctx) {
            ctx.text("Lu:{");
            for (var i = 0; i < charSets.length; i++) {
                var A = charSets[i];
                ctx.compileCharSet(A);
                ctx.text("if(r)break Lu;");
            }
            ctx.text("var r= false;");
            ctx.text("}");
        });
    }

    function evaluateClassAtom() {
        oneCharacterOfCharSet = undefined;
        if (current === '-') {
            proceed();
            return oneElementCharSet('-');
        }
        if (current === '\\') {
            proceed();
            var E = evaluateOctalEscape();
            if (E !== undefined) {
                var ch = E;
                return oneElementCharSet(ch);
            }
            if (current === 'b') {
                proceed();
                return oneElementCharSet('\u0008');
            }
            if (current === 'B') throw SyntaxError();
            if (isIncluded(current, "dDsSwW")) return evaluateCharacterClassEscape();
            var ch = evaluateCharacterEscape();
            if (ch === undefined) {
                /* original code
                return function(cc) {
                    return false;
                };
                */
                return RegExpCompilerContext.charset(function(ctx) {
                    ctx.text("var r=false;");
                });
            }
            var A = oneElementCharSet(ch);
            return A;
        }
        var ch = proceed();
        return oneElementCharSet(ch);
    }

    function countNCapturingParens(P) {
        setPattern(P);
        var nCapturingParens = 0;
        var buffer = [];
        while (current !== undefined) {
            if (current === '(' && lookahead !== '?') {
                nCapturingParens++;
                proceed();
            } else if (current === '\\' && lookahead !== undefined) {
                proceed(2);
            } else if (current === '[') {
                proceed();
                while (current !== ']') {
                    if (current === '\\' && lookahead !== undefined) {
                        proceed(2);
                    } else {
                        proceed();
                    }
                }
            } else {
                proceed();
            }
        }
        return nCapturingParens;
    }

    function escapePattern(P) {
        setPattern(P);
        if (current === undefined) return "(?:)";
        var buffer = [];
        while (current !== undefined) {
            if (current === '/') {
                buffer.push('\\');
                buffer.push(current);
                proceed();
            } else if (current === '\\' && lookahead !== undefined) {
                buffer.push(current);
                buffer.push(lookahead);
                proceed(2);
            } else if (current === '[') {
                buffer.push(current);
                proceed();
                while (current !== ']') {
                    if (current === '\\' && lookahead !== undefined) {
                        buffer.push(current);
                        buffer.push(lookahead);
                        proceed(2);
                    } else {
                        buffer.push(proceed());
                    }
                }
            } else {
                buffer.push(proceed());
            }
        }
        return buffer.join('');
    }

    function compile(P, F, dynamic) {
        var ignoreCase = false;
        var multiline = false;
        var global = false;
        for (var i = 0; i !== F.length; i++) {
            var f = F[i];
            if (f === 'g') {
                if (global) throw SyntaxError();
                global = true;
            } else if (f === 'i') {
                if (ignoreCase) throw SyntaxError();
                ignoreCase = true;
            } else if (f === 'm') {
                if (multiline) throw SyntaxError();
                multiline = true;
            } else throw SyntaxError();
        }
        var regexp = ({
            source: escapePattern(P),
            global: global,
            ignoreCase: ignoreCase,
            multiline: multiline,
        });
        regexp.NCapturingParens = countNCapturingParens(regexp.source);
        evaluatePattern(regexp, dynamic);
        return regexp;
    }

    function recompile(obj) {
        var regexp = ({
            source: obj.Get("source"),
            global: obj.Get("global"),
            ignoreCase: obj.Get("ignoreCase"),
            multiline: obj.Get("multiline"),
        });
        regexp.NCapturingParens = countNCapturingParens(regexp.source);
        evaluatePattern(regexp, true);
        obj.NCapturingParens = regexp.NCapturingParens;
        obj.Match = regexp.Match;
    }

    function createRegExpObject(regexp) {
        var obj = VMObject(CLASSID_RegExp);
        obj.Prototype = realm.RegExp_prototype;
        obj.Extensible = true;
        defineFinal(obj, "source", regexp.source);
        defineFinal(obj, "global", regexp.global);
        defineFinal(obj, "ignoreCase", regexp.ignoreCase);
        defineFinal(obj, "multiline", regexp.multiline);
        defineWritable(obj, "lastIndex", 0);
        obj.NCapturingParens = regexp.NCapturingParens;
        obj.Match = regexp.Match;
        return obj;
    }

    function SyntaxError() {
        if (!(this instanceof SyntaxError)) {
            return new SyntaxError();
        }
        this.message = "at " + currentPos;
        this.pos = currentPos;
    }

    /* original code
    function noContinuation(x) {
        return x;
    }
    */

    /* original code
    function pending(c, x) {
        assert(x.pendingContinuation === undefined, x);
        if (c !== noContinuation) {
            x.pendingContinuation = c;
        }
        return x;
    }
    */

    /* original code
    function unpending(x) {
        while (true) {
            var c = x.pendingContinuation;
            if (c === undefined) {
                return x;
            }
            x.pendingContinuation = undefined;
            x = c(x);
        }
    }
    */

})();

function RegExp_Call(thisValue, argumentsList) {
    var pattern = argumentsList[0];
    var flags = argumentsList[1];
    var R = pattern;
    if (Type(R) === TYPE_Object && R.Class === "RegExp" && flags === undefined) return R;
    return RegExp_Construct([pattern, flags]);
}

function RegExp_Construct(argumentsList) {
    var pattern = argumentsList[0];
    var flags = argumentsList[1];
    var R = pattern;
    if (Type(R) === TYPE_Object && R.Class === "RegExp") {
        if (flags !== undefined) throw VMTypeError();
        var obj = VMObject(CLASSID_RegExp);
        obj.Prototype = realm.RegExp_prototype;
        obj.Extensible = true;
        defineFinal(obj, "source", R.Get("source"));
        defineFinal(obj, "global", R.Get("global"));
        defineFinal(obj, "ignoreCase", R.Get("ignoreCase"));
        defineFinal(obj, "multiline", R.Get("multiline"));
        defineWritable(obj, "lastIndex", 0);
        obj.NCapturingParens = R.NCapturingParens;
        obj.Match = R.Match;
        return obj;
    }
    if (pattern === undefined) {
        var P = "";
    } else {
        var P = ToString(pattern);
    }
    if (flags === undefined) {
        var F = "";
    } else {
        var F = ToString(flags);
    }
    try {
        var regexp = RegExpFactory.compile(P, F, true);
    } catch (e) {
        if (e instanceof RegExpFactory.SyntaxError) {
            throw VMSyntaxError(e.message);
        }
        throw e;
    }
    return RegExpFactory.createRegExpObject(regexp);
}

function RegExp_prototype_exec(thisValue, argumentsList) {
    var string = argumentsList[0];
    var R = thisValue;
    if (Type(R) !== TYPE_Object || R.Class !== "RegExp") throw VMTypeError();
    var S = ToString(string);
    var length = S.length;
    var lastIndex = R.Get("lastIndex");
    var i = ToInteger(lastIndex);
    var global = R.Get("global");
    if (global === false) {
        var i = 0;
    }
    var matchSucceeded = false;
    while (matchSucceeded === false) {
        if ((i < 0) || (i > length)) {
            R.Put("lastIndex", 0, true);
            return null;
        }
        var r = R.Match(S, i);
        if (r === failure) {
            var i = i + 1;
        } else {
            matchSucceeded = true;
        }
    }
    var e = r.endIndex;
    if (global === true) {
        R.Put("lastIndex", e, true);
    }
    var n = R.NCapturingParens;
    var A = Array_Construct([]);
    var matchIndex = i;
    defineFree(A, "index", matchIndex);
    defineFree(A, "input", S);
    intrinsic_set_value(A, "length", n + 1);
    var matchedSubstr = S.substring(i, e);
    defineFree(A, "0", matchedSubstr);
    for (var i = 1; i <= n; i++) {
        var captureI = r.captures[i];
        defineFree(A, i, captureI);
    }
    return A;
}

function RegExp_prototype_test(thisValue, argumentsList) {
    var match = RegExp_prototype_exec(thisValue, argumentsList);
    if (match !== null) return true;
    return false;
}

function RegExp_prototype_toString(thisValue, argumentsList) {
    var R = thisValue;
    if (Type(R) !== TYPE_Object || R.Class !== "RegExp") throw VMTypeError();
    return "/" + R.Get("source") + "/" + (R.Get("global") ? "g" : "") + (R.Get("ignoreCase") ? "i" : "") +
        (R.Get("multiline") ? "m" : "");
}

function State(endIndex, captures) {
    return ({
        endIndex: endIndex,
        captures: captures,
    });
}

function Canonicalize(ch) {
    var u = ch.toUpperCase();
    if (u.length !== 1) return ch;
    var cu = u;
    if ((toCharCode(ch) >= 128) && (toCharCode(cu) < 128)) return ch;
    return cu;
}
