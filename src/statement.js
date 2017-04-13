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

// ECMAScript 5.1: 12 Statements

function BlockStatement(statementList) {
    var evaluate = function() {
        if (statementList === undefined) return CompletionValue("normal", empty, empty);
        return statementList();
    };
    evaluate.statementList = statementList;

    return CompilerContext.statement(evaluate, function(ctx) {
        if (statementList === undefined) return;
        ctx.compileStatement(statementList);
    });
}

function StatementList(statements) {
    if (statements.length === 0) return undefined;
    if (statements.length === 1) var evaluate = function() {
        try {
            var s = statements[0]();
        } catch (V) {
            if (isInternalError(V)) throw V;
            return CompletionValue("throw", V, empty);
        }
        return s;
    };

    else var evaluate = function() {
        try {
            var sl = statements[0]();
        } catch (V) {
            if (isInternalError(V)) throw V;
            return CompletionValue("throw", V, empty);
        }
        for (var i = 1; i < statements.length; i++) {
            if (sl.type !== "normal") return sl;
            try {
                var s = statements[i]();
            } catch (V) {
                if (isInternalError(V)) throw V;
                return CompletionValue("throw", V, empty);
            }
            if (s.value === empty) {
                var V = sl.value;
            } else {
                var V = s.value;
            }
            sl = CompletionValue(s.type, V, s.target);
        }
        return sl;
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        for (var i = 0; i < statements.length; i++) {
            ctx.compileStatement(statements[i]);
        }
    });
}

function VariableStatement(variableDeclarationList) {
    var evaluate = function() {
        for (var i = 0; i !== variableDeclarationList.length; i++) {
            variableDeclarationList[i]();
        }
        return CompletionValue("normal", empty, empty);
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        for (var i = 0; i !== variableDeclarationList.length; i++) {
            variableDeclarationList[i].compile(ctx);
        }
    });
}

function VariableDeclaration(staticEnv, identifier, initialiser, strict, pos) {
    var evaluate = function() {
        if (initialiser !== undefined) {
            runningSourcePos = pos;
            var env = LexicalEnvironment;
            var lhs = GetIdentifierReference(env, identifier, strict);
            var rhs = initialiser();
            var value = GetValue(rhs);
            PutValue(lhs, value);
        }
        return identifier;
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        if (initialiser !== undefined) {
            ctx.compileRunningPos(pos);
            var lhs = ctx.compileGetIdentifierReferece(staticEnv, identifier, strict);
            var rhs = ctx.compileExpression(initialiser);
            var value = ctx.compileGetValue(rhs);
            ctx.compilePutValue(lhs, value);
        }
        return {
            env: staticEnv,
            name: identifier,
        };
    });
}

function EmptyStatement() {
    var evaluate = function() {
        return CompletionValue("normal", empty, empty);
    };

    return CompilerContext.statement(evaluate, function(ctx) {});
}

function ExpressionStatement(expression, pos) {
    var evaluate = function() {
        runningSourcePos = pos;
        var exprRef = expression();
        return CompletionValue("normal", GetValue(exprRef), empty);
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.compileRunningPos(pos);
        var exprRef = ctx.compileExpression(expression);
        ctx.compileGetValue(exprRef);
    });
}

function IfStatement(expression, firstStatement, secondStatement, pos) {
    var evaluate = function() {
        runningSourcePos = pos;
        var exprRef = expression();
        if (ToBoolean(GetValue(exprRef)) === true) return firstStatement();
        else {
            if (secondStatement === undefined) return CompletionValue("normal", empty, empty);
            return secondStatement();
        }
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.compileRunningPos(pos);
        var exprRef = ctx.compileExpression(expression);
        var val = ctx.compileGetValue(exprRef);
        ctx.text("if(" + val.name + "){");
        ctx.compileStatement(firstStatement);
        if (secondStatement) {
            ctx.text("}else{");
            ctx.compileStatement(secondStatement);
        }
        ctx.text("}");
    });
}

function DoWhileStatement(statement, expression, labelset, pos) {
    var evaluate = function() {
        var V = empty;
        while (true) {
            var stmt = statement();
            if (stmt.value !== empty) {
                V = stmt.value;
            }
            if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
                if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true)
                    return CompletionValue("normal", V, empty);
                if (stmt.type !== "normal") return stmt;
            }
            runningSourcePos = pos;
            var exprRef = expression();
            if (ToBoolean(GetValue(exprRef)) === false) {
                break;
            }
        }
        return CompletionValue("normal", V, empty);
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.iterables++;
        var i = ctx.defineBoolean("false");
        ctx.compileLabelset(labelset);
        ctx.text("for(;; " + i.name + " =true){");
        ctx.text("if(" + i.name + "){");
        ctx.compileRunningPos(pos);
        var exprRef = ctx.compileExpression(expression);
        var val = ctx.compileGetValue(exprRef);
        ctx.text("if(! " + val.name + ")break;");
        ctx.text("}");
        ctx.compileStatement(statement);
        ctx.text("}");
        ctx.iterables--;
    });
}

function WhileStatement(expression, statement, labelset, pos) {
    var evaluate = function() {
        var V = empty;
        while (true) {
            runningSourcePos = pos;
            var exprRef = expression();
            if (ToBoolean(GetValue(exprRef)) === false) {
                break;
            }
            var stmt = statement();
            if (stmt.value !== empty) {
                V = stmt.value;
            }
            if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
                if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true)
                    return CompletionValue("normal", V, empty);
                if (stmt.type !== "normal") return stmt;
            }
        }
        return CompletionValue("normal", V, empty);
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.iterables++;
        ctx.compileLabelset(labelset);
        ctx.text("while(true){");
        ctx.compileRunningPos(pos);
        var exprRef = ctx.compileExpression(expression);
        var val = ctx.compileGetValue(exprRef);
        ctx.text("if(! " + val.name + ")break;");
        ctx.compileStatement(statement);
        ctx.text("}");
        ctx.iterables--;
    });
}

function ForStatement(expressionNoIn, firstExpression, secondExpression, statement, labelset, pos1, pos2, pos3) {
    var evaluate = function() {
        if (expressionNoIn !== undefined) {
            runningSourcePos = pos1;
            var exprRef = expressionNoIn();
            GetValue(exprRef);
        }
        var V = empty;
        while (true) {
            if (firstExpression !== undefined) {
                runningSourcePos = pos2;
                var testExprRef = firstExpression();
                if (ToBoolean(GetValue(testExprRef)) === false) return CompletionValue("normal", V, empty);
            }
            var stmt = statement();
            if (stmt.value !== empty) {
                V = stmt.value;
            }
            if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true)
                return CompletionValue("normal", V, empty);
            if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
                if (stmt.type !== "normal") return stmt;
            }
            if (secondExpression !== undefined) {
                runningSourcePos = pos3;
                var incExprRef = secondExpression();
                GetValue(incExprRef);
            }
        }
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.iterables++;
        if (expressionNoIn !== undefined) {
            ctx.compileRunningPos(pos1);
            var exprRef = ctx.compileExpression(expressionNoIn);
            ctx.compileGetValue(exprRef);
        }
        var i = ctx.defineBoolean("false");
        ctx.compileLabelset(labelset);
        ctx.text("for(;; " + i.name + " =true){");
        if (secondExpression !== undefined) {
            ctx.text("if(" + i.name + "){");
            ctx.compileRunningPos(pos3);
            var incExprRef = ctx.compileExpression(secondExpression);
            ctx.compileGetValue(incExprRef);
            ctx.text("}");
        }
        if (firstExpression !== undefined) {
            ctx.compileRunningPos(pos2);
            var testExprRef = ctx.compileExpression(firstExpression);
            var val = ctx.compileGetValue(testExprRef);
            ctx.text("if(! " + val.name + ")break;");
        }
        ctx.compileStatement(statement);
        ctx.text("}");
        ctx.iterables--;
    });
}

function ForVarStatement(variableDeclarationList, firstExpression, secondExpression, statement, labelset, pos1, pos2) {
    var evaluate = function() {
        for (var i = 0; i < variableDeclarationList.length; i++) {
            variableDeclarationList[i]();
        }
        var V = empty;
        while (true) {
            if (firstExpression !== undefined) {
                runningSourcePos = pos1;
                var testExprRef = firstExpression();
                if (ToBoolean(GetValue(testExprRef)) === false) return CompletionValue("normal", V, empty);
            }
            var stmt = statement();
            if (stmt.value !== empty) {
                V = stmt.value;
            }
            if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true)
                return CompletionValue("normal", V, empty);
            if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
                if (stmt.type !== "normal") return stmt;
            }
            if (secondExpression !== undefined) {
                runningSourcePos = pos2;
                var incExprRef = secondExpression();
                GetValue(incExprRef);
            }
        }
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.iterables++;
        for (var i = 0; i < variableDeclarationList.length; i++) {
            variableDeclarationList[i].compile(ctx);
        }
        var i = ctx.defineBoolean("false");
        ctx.compileLabelset(labelset);
        ctx.text("for(;; " + i.name + " =true){");
        if (secondExpression !== undefined) {
            ctx.text("if(" + i.name + "){");
            ctx.compileRunningPos(pos2);
            var incExprRef = ctx.compileExpression(secondExpression);
            ctx.compileGetValue(incExprRef);
            ctx.text("}");
        }
        if (firstExpression !== undefined) {
            ctx.compileRunningPos(pos1);
            var testExprRef = ctx.compileExpression(firstExpression);
            var val = ctx.compileGetValue(testExprRef);
            ctx.text("if(! " + val.name + ")break;");
        }
        ctx.compileStatement(statement);
        ctx.text("}");
        ctx.iterables--;
    });
}

function ForInStatement(leftHandSideExpression, expression, statement, labelset, pos1, pos2) {
    var evaluate = function() {
        runningSourcePos = pos2;
        var exprRef = expression();
        var experValue = GetValue(exprRef);
        if (experValue === null || experValue === undefined) return CompletionValue("normal", empty, empty);
        var obj = ToObject(experValue);
        var V = empty;
        var next = obj.enumerator(false, true);
        while (true) {
            var P = next();
            if (P === undefined) return CompletionValue("normal", V, empty);
            runningSourcePos = pos1;
            var lhsRef = leftHandSideExpression();
            PutValue(lhsRef, P);
            var stmt = statement();
            if (stmt.value !== empty) {
                V = stmt.value;
            }
            if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true)
                return CompletionValue("normal", V, empty);
            if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
                if (stmt.type !== "normal") return stmt;
            }
        }
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.iterables++;
        ctx.compileRunningPos(pos2);
        var exprRef = ctx.compileExpression(expression);
        var experValue = ctx.compileGetValue(exprRef);
        experValue = ctx.unify(experValue);
        ctx.text("if(!(" + experValue.name + " ===null|| " + experValue.name + " ===undefined)){");
        var obj = ctx.compileToObject(experValue);
        var next = ctx.defineAny(obj.name + " .enumerator(false,true)");
        ctx.compileLabelset(labelset);
        ctx.text("while(true){");
        var P = ctx.defineString(next.name + "()");
        ctx.text("if(" + P.name + " ===undefined)break;");
        ctx.compileRunningPos(pos1);
        var lhsRef = ctx.compileExpression(leftHandSideExpression);
        ctx.compilePutValue(lhsRef, P);
        ctx.compileStatement(statement);
        ctx.text("}");
        ctx.text("}");
        ctx.iterables--;
    });
}

function ForVarInStatement(variableDeclarationNoIn, expression, statement, labelset, strict, pos1, pos2) {
    var evaluate = function() {
        var varName = variableDeclarationNoIn();
        runningSourcePos = pos2;
        var exprRef = expression();
        var experValue = GetValue(exprRef);
        if (experValue === null || experValue === undefined) return CompletionValue("normal", empty, empty);
        var obj = ToObject(experValue);
        var V = empty;
        var next = obj.enumerator(false, true);
        while (true) {
            var P = next();
            if (P === undefined) return CompletionValue("normal", V, empty);
            runningSourcePos = pos1;
            var env = LexicalEnvironment;
            var varRef = GetIdentifierReference(env, varName, strict);
            PutValue(varRef, P);
            var stmt = statement();
            if (stmt.value !== empty) {
                V = stmt.value;
            }
            if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true)
                return CompletionValue("normal", V, empty);
            if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
                if (stmt.type !== "normal") return stmt;
            }
        }
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.iterables++;
        var varRef = variableDeclarationNoIn.compile(ctx);
        ctx.compileRunningPos(pos2);
        var exprRef = ctx.compileExpression(expression);
        var experValue = ctx.compileGetValue(exprRef);
        experValue = ctx.unify(experValue);
        ctx.text("if(!(" + experValue.name + " ===null|| " + experValue.name + " ===undefined)){");
        var obj = ctx.compileToObject(experValue);
        var next = ctx.defineAny(obj.name + " .enumerator(false,true)");
        ctx.compileLabelset(labelset);
        ctx.text("while(true){");
        var P = ctx.defineString(next.name + "()");
        ctx.text("if(" + P.name + " ===undefined)break;");
        ctx.compileRunningPos(pos1);
        var varRef = ctx.compileGetIdentifierReferece(varRef.env, varRef.name, strict);
        ctx.compilePutValue(varRef, P);
        ctx.compileStatement(statement);
        ctx.text("}");
        ctx.text("}");
        ctx.iterables--;
    });
}

function ContinueStatement(identifier) {
    var evaluate = function() {
        if (identifier === undefined) return CompletionValue("continue", empty, empty);
        else return CompletionValue("continue", empty, identifier);
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        if (!identifier) {
            ctx.text("continue;");
            return;
        }
        ctx.text("continue " + ctx.findLabel(identifier) + ";");
    });
}

function BreakStatement(identifier) {
    var evaluate = function() {
        if (identifier === undefined) return CompletionValue("break", empty, empty);
        else return CompletionValue("break", empty, identifier);
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        if (!identifier) {
            ctx.text("break;");
            return;
        }
        ctx.text("break " + ctx.findLabel(identifier) + ";");
    });
}

function ReturnStatement(expression, pos) {
    var evaluate = function() {
        if (expression === undefined) return CompletionValue("return", undefined, empty);
        runningSourcePos = pos;
        var exprRef = expression();
        return CompletionValue("return", GetValue(exprRef), empty);
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        if (expression === undefined) return ctx.compileReturn(COMPILER_UNDEFINED_VALUE);
        ctx.compileRunningPos(pos);
        var exprRef = ctx.compileExpression(expression);
        ctx.compileReturn(ctx.compileGetValue(exprRef));
    });
}

function WithStatement(expression, statement, pos) {
    var evaluate = function() {
        runningSourcePos = pos;
        var val = expression();
        var obj = ToObject(GetValue(val));
        var oldEnv = LexicalEnvironment;
        var newEnv = NewObjectEnvironment(obj, oldEnv);
        newEnv.provideThis = true;
        LexicalEnvironment = newEnv;
        try {
            var C = statement();
        } catch (V) {
            if (isInternalError(V)) throw V;
            C = CompletionValue("throw", V, empty);
        }
        LexicalEnvironment = oldEnv;
        return C;
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.compileRunningPos(pos);
        var val = ctx.compileExpression(expression);
        var obj = ctx.compileToObject(ctx.compileGetValue(val));
        var oldEnv = ctx.defineAny("LexicalEnvironment");
        ctx.text("LexicalEnvironment=NewObjectEnvironment(" + obj.name + "," + oldEnv.name + ");");
        ctx.text("LexicalEnvironment.provideThis=true;");
        ctx.text("try{");
        ctx.compileStatement(statement);
        ctx.text("}finally{");
        ctx.text("LexicalEnvironment= " + oldEnv.name + ";");
        ctx.text("}");
    });
}

function SwitchStatement(expression, caseBlock, labelset, pos) {
    var evaluate = function() {
        runningSourcePos = pos;
        var exprRef = expression();
        var R = caseBlock(GetValue(exprRef));
        if (R.type === "break" && isInLabelSet(R.target, labelset) === true) return CompletionValue("normal", R.value, empty);
        return R;
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.switches++;
        ctx.compileRunningPos(pos);
        var exprRef = ctx.compileExpression(expression);
        caseBlock.compile(ctx, ctx.compileGetValue(exprRef));
        ctx.switches--;
    });
}

function CaseBlock(A, defaultClause, B) {
    if (defaultClause === undefined) var evaluate = function(input) {
        var V = empty;
        var searching = true;
        for (var i = 0; searching && (i < A.length); i++) {
            var C = A[i];
            var clauseSelector = C();
            if (input === clauseSelector) {
                searching = false;
                if (C.statementList !== undefined) {
                    var R = C.statementList();
                    if (R.type !== "normal") return R;
                    V = R.value;
                }
            }
        }
        for (; i < A.length; i++) {
            var C = A[i];
            if (C.statementList !== undefined) {
                var R = C.statementList();
                if (R.value !== empty) {
                    V = R.value;
                }
                if (R.type !== "normal") return CompletionValue(R.type, V, R.target);
            }
        }
        return CompletionValue("normal", V, empty);
    };

    else var evaluate = function(input) {
        var V = empty;
        var found = false;
        for (var i = 0; i < A.length; i++) {
            var C = A[i];
            if (found === false) {
                var clauseSelector = C();
                if (input === clauseSelector) {
                    found = true;
                }
            }
            if (found === true) {
                if (C.statementList !== undefined) {
                    var R = C.statementList();
                    if (R.value !== empty) {
                        V = R.value;
                    }
                    if (R.type !== "normal") return CompletionValue(R.type, V, R.target);
                }
            }
        }
        var foundInB = false;
        if (found === false) {
            for (var j = 0; foundInB === false && (j < B.length); j++) {
                var C = B[j];
                var clauseSelector = C();
                if (input === clauseSelector) {
                    foundInB = true;
                    if (C.statementList !== undefined) {
                        var R = C.statementList();
                        if (R.value !== empty) {
                            V = R.value;
                        }
                        if (R.type !== "normal") return CompletionValue(R.type, V, R.target);
                    }
                }
            }
        }
        if (foundInB === false && defaultClause !== undefined) {
            var R = defaultClause();
            if (R.value !== empty) {
                V = R.value;
            }
            if (R.type !== "normal") return CompletionValue(R.type, V, R.target);
        }
        // specification Bug 345
        if (foundInB === false) {
            j = 0;
        }
        // end of bug fix
        for (; j < B.length; j++) {
            var C = B[j];
            if (C.statementList !== undefined) {
                var R = C.statementList();
                if (R.value !== empty) {
                    V = R.value;
                }
                if (R.type !== "normal") return CompletionValue(R.type, V, R.target);
            }
        }
        return CompletionValue("normal", V, empty);
    };

    return CompilerContext.statement(evaluate, function(ctx, input) {
        input = ctx.unify(input);
        var mark = ctx.texts.length;
        var selectors = [];
        var direct = true;
        ctx.text("Lcases:{");
        for (var i = 0; i < A.length; i++) {
            var C = A[i];
            var l = ctx.texts.length;
            var clauseSelector = ctx.compileExpression(C);
            direct = clauseSelector.isLiteral ? direct : false;
            selectors[i] = clauseSelector;
            ctx.text("if(" + input.name + " === " + clauseSelector.name + "){");
            ctx.text("var swidx= " + i + ";");
            ctx.text("break Lcases;");
            ctx.text("}");
        }
        for (var j = 0; j < B.length; j++) {
            var C = B[j];
            var clauseSelector = ctx.compileExpression(C);
            direct = clauseSelector.isLiteral ? direct : false;
            selectors[i + j] = clauseSelector;
            ctx.text("if(" + input.name + " === " + clauseSelector.name + "){");
            ctx.text("var swidx= " + (i + j) + ";");
            ctx.text("break Lcases;");
            ctx.text("}");
        }
        ctx.text("var swidx =-1;");
        ctx.text("}");
        direct = (ctx.texts.length === mark + (i + j) * 4 + 3) ? direct : false;
        if (direct) {
            ctx.texts.length = mark;
            ctx.text("switch(" + input.name + "){");
        } else ctx.text("switch(swidx){");
        for (var i = 0; i < A.length; i++) {
            var C = A[i];
            if (direct) ctx.text("case " + selectors[i].name + ":");
            else ctx.text("case " + i + ":");
            if (C.statementList) {
                ctx.compileStatement(C.statementList);
            }
        }
        if (defaultClause) {
            ctx.text("default:");
            ctx.compileStatement(defaultClause);
        }
        for (var j = 0; j < B.length; j++) {
            var C = B[j];
            if (direct) ctx.text("case " + selectors[i + j].name + ":");
            else ctx.text("case " + (i + j) + ":");
            if (C.statementList) {
                ctx.compileStatement(C.statementList);
            }
        }
        ctx.text("}");
    });
}

function CaseClause(expression, statementList, pos) {
    var evaluate = CompilerContext.expression(function(ctx) {
        var exprRef = ctx.compileExpression(expression);
        return ctx.compileGetValue(exprRef);
    });
    evaluate.statementList = statementList;
    return evaluate;
}

function isInLabelSet(target, labelset) {
    if (target === empty) return true;
    if (labelset === undefined) return false;
    if (isIncluded(target, labelset)) return true;
    return false;
}

function LabelledStatement(identifier, statement, iterable) {
    var evaluate = function() {
        var stmt = statement();
        if (stmt.type === "break" && stmt.target === identifier) return CompletionValue("normal", stmt.value, empty);
        return stmt;
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        var label = ctx.openLabel(identifier);
        if (!iterable) ctx.text(label + ":{");
        ctx.compileStatement(statement);
        if (!iterable) ctx.text("}");
        ctx.closeLabel(identifier);
    });
}

function ThrowStatement(expression, pos) {
    var evaluate = function() {
        runningSourcePos = pos;
        var exprRef = expression();
        return CompletionValue("throw", GetValue(exprRef), empty);
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.compileRunningPos(pos);
        var exprRef = ctx.compileExpression(expression);
        var val = ctx.compileGetValue(exprRef);
        ctx.text("throw " + val.name + ";");
    });
}

function TryStatement(block, catchBlock, finallyBlock) {
    if (finallyBlock === undefined) var evaluate = function() {
        var B = block();
        if (B.type !== "throw") return B;
        return catchBlock(B.value);
    };

    else if (catchBlock === undefined) var evaluate = function() {
        var B = block();
        var F = finallyBlock();
        if (F.type === "normal") return B;
        return F;
    };

    else var evaluate = function() {
        var B = block();
        if (B.type === "throw") {
            var C = catchBlock(B.value);
        } else {
            var C = B;
        }
        var F = finallyBlock();
        if (F.type === "normal") return C;
        return F;
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.text("try{");
        ctx.compileStatement(block);
        if (catchBlock) {
            ctx.text("}catch(err){");
            ctx.text("if(isInternalError(err))throw err;");
            catchBlock.compile(ctx);
        }
        if (finallyBlock) {
            ctx.text("}finally{");
            ctx.compileStatement(finallyBlock);
        }
        ctx.text("}");
    });
}

function CatchBlock(staticEnv, identifier, block) {
    var evaluate = function(C) {
        var oldEnv = LexicalEnvironment;
        var catchEnv = NewDeclarativeEnvironment(oldEnv);
        var envRec = catchEnv;
        envRec.CreateMutableBinding(identifier);
        envRec.SetMutableBinding(identifier, C, false);
        LexicalEnvironment = catchEnv;
        var B = block();
        LexicalEnvironment = oldEnv;
        return B;
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        if (!block.statementList) return;
        var oldEnv = ctx.compileNewDeclarativeEnvironment(staticEnv);
        ctx.compileCreateMutableBinding(staticEnv, identifier);
        ctx.compileSetMutableBinding(staticEnv, identifier, ctx.defineValue("err"), false);
        if (!oldEnv) {
            ctx.compileStatement(block);
            return;
        }
        ctx.text("try{");
        ctx.compileStatement(block);
        ctx.text("}finally{");
        ctx.text("LexicalEnvironment= " + oldEnv.name + ";");
        ctx.text("}");
    });
}

function DebuggerStatement(pos) {
    var evaluate = function() {
        runningSourcePos = pos;
        debugger;
        return CompletionValue("normal", empty, empty);
    };

    return CompilerContext.statement(evaluate, function(ctx) {
        ctx.compileRunningPos(pos);
        ctx.text("debugger;");
    });
}
