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

const Parser = (function() {
    return ({
        readCode: readCode,
        locateDebugInfo: locateDebugInfo,
        SyntaxError: SyntaxError,
        ReferenceError: ReferenceError,
    });

    var current;
    var token;
    var value;
    var isNumericLiteral;
    var isStringLiteral;
    var isIdentifierName;
    var isEscaped;
    var isLineSeparatedAhead;
    var isLineSeparatedBehind;
    var prevTokenPos;
    var tokenPos;
    var tokenEndPos;
    var currentPos;
    /*
     *     token    current
     * <--> isLineSeparatedAhead
     *     ^ tokenPos
     *          ^ tokenEndPos
     *          <--> isLineSeparatedBehind
     *              ^ currentPos
     */

    var source;
    var strict;
    var subcodes;
    var sourceObject;
    var code;
    var stack;
    var lastLeftHandSide;
    var lastReference;
    var lastIdentifierReference;
    var lastIdentifier;
    var varEnv;
    var lexEnv;

    function setup(type, parameterText, codeText, strictMode, subc, filename) {
        assert(strictMode !== undefined);
        source = codeText;
        strict = strictMode;
        subcodes = subc;
        sourceObject = NewSourceObject(type, parameterText, codeText, strictMode, filename);
        code = undefined;
        stack = undefined;
        lastLeftHandSide = undefined;
        lastReference = undefined;
        lastIdentifierReference = undefined;
        lastIdentifier = undefined;
        varEnv = null;
        lexEnv = null;
        setPosition(0);
        skipSpaces();
        proceedToken();
    }

    function Code(type) {
        var code = ({
            strict: strict,
            type: type,
            functions: [],
            variables: [],
            existsDirectEval: false,
            existsArgumentsRef: false,
            existsWithStatement: false,
            sourceElements: undefined,
            evaluate: undefined,
            sourceObject: sourceObject,
            index: subcodes.length,
            startPos: undefined,
            endPos: undefined,
            functionName: undefined,
            varEnv: undefined,
        });
        subcodes.push(code);
        return code;
    }

    function Stack() {
        return ({
            labelStack: [],
            iterableLabelStack: [],
            iterables: 0,
            switches: 0,
        });
    }

    function Env(type, outer) {
        var env = ({
            type: type,
            outer: outer,
            code: code,
            inners: [],
            defs: [],
            refs: [],
            inboundRefs: [],
            locals: [],
            bindings: Object.create(null),
            existsDirectEval: false,
            existsOuterFunction: false,
            collapsed: false,
        });
        if (outer) {
            outer.inners.push(env);
        }
        return env;
    }

    function readCode(type, parameterText, codeText, strictMode, subcodes, filename) {
        if (type === "global" || type === "eval") {
            setup(type, parameterText, codeText, strictMode, subcodes, filename);
            code = Code(type);
            stack = Stack();
            varEnv = Env(type, null);
            lexEnv = varEnv;
            var sourceElements = readSourceElements();
            if (token !== undefined) throw SyntaxError(tokenPos);
            code.strict = strict;
            code.evaluate = Program(sourceElements);
            code.varEnv = varEnv;
        } else {
            assert(type === "function", type);
            source = parameterText;
            setPosition(0);
            skipSpaces();
            proceedToken();
            var parameters = [];
            if (token !== undefined) {
                while (true) {
                    parameters.push(expectingIdentifier());
                    if (token === undefined) {
                        break;
                    }
                    expectingToken(',');
                }
            }
            setup(type, parameterText, codeText, strictMode, subcodes, filename);
            code = readFunctionBody(undefined, parameters, null);
            if (code.strict) {
                disallowDuplicated(parameters);
                parameters.forEach(disallowEvalOrArguments);
            }
        }
        analyzeStaticEnv(code.varEnv);
        return code;
    }

    function readFunctionBody(name, parameters, scope) {
        var outerStrict = strict;
        var outerCode = code;
        var outerStack = stack;
        var outerVarEnv = varEnv;
        var outerLexEnv = lexEnv;
        code = Code("function");
        stack = Stack();
        varEnv = Env("function", scope);
        lexEnv = varEnv;
        setIncluded(parameters, varEnv.defs);
        setIncluded("arguments", varEnv.defs);
        var body = code;
        body.functionName = name;
        body.parameters = parameters;
        body.sourceElements = readSourceElements();
        body.strict = strict;
        body.evaluate = delayedFunctionBody;
        body.varEnv = varEnv;
        strict = outerStrict;
        code = outerCode;
        stack = outerStack;
        varEnv = outerVarEnv;
        lexEnv = outerLexEnv;
        return body;
    }

    function readSourceElements() {
        code.startPos = tokenPos;
        while (isStringLiteral) {
            if (!(isLineSeparatedBehind || current === ';' || current === '}')) {
                break;
            }
            if (value === "use strict") {
                var text = source.substring(tokenPos, tokenEndPos);
                if (text === '"use strict"' || text === "'use strict'") {
                    strict = true;
                }
            }
            readStatement();
        }
        if (code.startPos !== tokenPos) {
            setPosition(code.startPos);
            proceedToken();
        }
        var statements = [];
        while (token !== undefined && token !== '}') {
            if (token === "function") {
                code.functions.push(readFunctionDeclaration());
            } else {
                statements.push(readStatement());
            }
        }
        code.endPos = tokenPos;
        return SourceElements(statements);
    }

    function readFunctionDeclaration() {
        proceedToken();
        var name = expectingIdentifier();
        expectingToken('(');
        var parameters = [];
        if (!testToken(')')) {
            while (true) {
                parameters.push(expectingIdentifier());
                if (testToken(')')) {
                    break;
                }
                expectingToken(',');
            }
        }
        expectingToken('{');
        setIncluded(name, varEnv.defs);
        var body = readFunctionBody(name, parameters, varEnv);
        expectingToken('}');
        if (body.strict) {
            disallowEvalOrArguments(name);
            disallowDuplicated(parameters);
            parameters.forEach(disallowEvalOrArguments);
        }
        var func = FunctionDeclaration(body);
        return func;
    }

    function readStatement(labelset) {
        switch (token) {
            case '{': // '}'
                return readBlockStatement();
            case ';':
                proceedToken();
                return EmptyStatement();
            case "var":
                return readVariableStatement();
            case "if":
                return readIfStatement();
            case "do":
                stack.iterables++;
                var statement = readDoWhileStatement(labelset);
                stack.iterables--;
                return statement;
            case "while":
                stack.iterables++;
                var statement = readWhileStatement(labelset);
                stack.iterables--;
                return statement;
            case "for":
                stack.iterables++;
                var statement = readForStatement(labelset);
                stack.iterables--;
                return statement;
            case "continue":
                return readContinueStatement();
            case "break":
                return readBreakStatement();
            case "return":
                return readReturnStatement();
            case "with":
                code.existsWithStatement = true;
                return readWithStatement();
            case "switch":
                stack.switches++;
                var statement = readSwitchStatement(labelset);
                stack.switches--;
                return statement;
            case "throw":
                return readThrowStatement();
            case "try":
                return readTryStatement();
            case "debugger":
                return readDebuggerStatement();
            case "function":
                return readFunctionStatement();
            default:
                if (isIdentifierName && current === ':') return readLabelledStatement();
                else return readExpressionStatement();
        }
    }

    function readLabelledStatement() {
        var labelset = [];
        stack.labelStack.push(labelset);
        while (isIdentifierName && current === ':') {
            var identifier = expectingIdentifier();
            if (findLabel(stack.labelStack, identifier) !== undefined) throw SyntaxError(prevTokenPos);
            expectingToken(':');
            labelset.push(identifier);
        }
        switch (token) {
            case "do":
            case "while":
            case "for":
                var iterable = true;
        }
        if (iterable) {
            stack.iterableLabelStack.push(labelset);
        }
        var statement = readStatement(labelset);
        stack.labelStack.pop();
        if (iterable) {
            stack.iterableLabelStack.pop();
        }
        var i = labelset.length;
        while (i-- !== 0) {
            statement = LabelledStatement(labelset[i], statement, iterable);
        }
        return statement;
    }

    function readExpressionStatement() {
        var pos = tokenPos;
        var expression = readExpression();
        expectingAutoSemicolon();
        return ExpressionStatement(expression, pos);
    }

    function readBlockStatement() {
        expectingToken('{');
        var statements = [];
        while (true) {
            if (testToken('}')) {
                break;
            }
            statements.push(readStatement());
        }
        return BlockStatement(StatementList(statements));
    }

    function readVariableStatement() {
        proceedToken();
        var variableDeclarationList = readVariableDeclarationList();
        expectingAutoSemicolon();
        return VariableStatement(variableDeclarationList);
    }

    function readVariableDeclarationList(isNoIn) {
        var variableDeclarationList = [];
        while (true) {
            var variableDeclaration = readVariableDeclaration(isNoIn);
            variableDeclarationList.push(variableDeclaration);
            if (!testToken(',')) {
                break;
            }
        }
        return variableDeclarationList;
    }

    function readVariableDeclaration(isNoIn) {
        var identifier = expectingIdentifier();
        if (strict) {
            disallowEvalOrArguments(identifier);
        }
        var pos = tokenPos;
        if (testToken('=')) {
            var initialiser = readAssignmentExpression(isNoIn);
        }
        setIncluded(identifier, code.variables);
        setIncluded(identifier, varEnv.defs);
        setIncluded(identifier, lexEnv.refs);
        return VariableDeclaration(lexEnv, identifier, initialiser, strict, pos);
    }

    function readIfStatement() {
        proceedToken();
        expectingToken('(');
        var pos = tokenPos;
        var expression = readExpression();
        expectingToken(')');
        var statement = readStatement();
        if (testToken("else")) {
            var elseStatement = readStatement();
        }
        return IfStatement(expression, statement, elseStatement, pos);
    }

    function readDoWhileStatement(labelset) {
        proceedToken();
        var statement = readStatement();
        expectingToken("while");
        expectingToken('(');
        var pos = tokenPos;
        var expression = readExpression();
        expectingToken(')');
        expectingAutoSemicolon();
        return DoWhileStatement(statement, expression, labelset, pos);
    }

    function readWhileStatement(labelset) {
        proceedToken();
        expectingToken('(');
        var pos = tokenPos;
        var expression = readExpression();
        expectingToken(')');
        var statement = readStatement();
        return WhileStatement(expression, statement, labelset, pos);
    }

    function readForStatement(labelset) {
        proceedToken();
        expectingToken('(');
        if (testToken("var")) {
            var variableDeclarationList = readVariableDeclarationList(true); // NoIn
            var pos1 = tokenPos;
            if (testToken("in")) {
                if (variableDeclarationList.length !== 1) throw SyntaxError(prevTokenPos);
                var expression = readExpression();
                var pos2 = tokenPos;
                expectingToken(')');
                var statement = readStatement();
                return ForVarInStatement(variableDeclarationList[0], expression, statement, labelset, strict, pos1, pos2);
            }
            expectingToken(';');
            if (!testToken(';')) {
                var pos1 = tokenPos;
                var testExpression = readExpression();
                expectingToken(';');
            }
            if (!testToken(')')) {
                var pos2 = tokenPos;
                var postExpression = readExpression();
                expectingToken(')');
            }
            var statement = readStatement();
            return ForVarStatement(variableDeclarationList, testExpression, postExpression, statement, labelset, pos1, pos2);
        }
        if (!testToken(';')) {
            var pos1 = tokenPos;
            var expressionNoIn = readExpression(true); // NoIn
            if (testToken("in")) {
                if (expressionNoIn !== lastLeftHandSide) throw SyntaxError(prevTokenPos);
                if (expressionNoIn !== lastReference) throw ReferenceError(prevTokenPos);
                if (strict && expressionNoIn === lastIdentifierReference) {
                    disallowEvalOrArguments(lastIdentifier);
                }
                var pos2 = tokenPos;
                var expression = readExpression();
                expectingToken(')');
                var statement = readStatement();
                return ForInStatement(expressionNoIn, expression, statement, labelset, pos1, pos2);
            }
            expectingToken(';');
        }
        if (!testToken(';')) {
            var pos2 = tokenPos;
            var testExpression = readExpression();
            expectingToken(';');
        }
        if (!testToken(')')) {
            var pos3 = tokenPos;
            var postExpression = readExpression();
            expectingToken(')');
        }
        var statement = readStatement();
        return ForStatement(expressionNoIn, testExpression, postExpression, statement, labelset, pos1, pos2, pos3);
    }

    function readContinueStatement() {
        proceedToken();
        if (isIdentifierName && !isLineSeparatedAhead) {
            var identifier = expectingIdentifier();
            var labelset = findLabel(stack.iterableLabelStack, identifier);
            if (labelset === undefined) throw SyntaxError(prevTokenPos);
        } else if (stack.iterables === 0) throw SyntaxError(prevTokenPos);
        expectingAutoSemicolon();
        return ContinueStatement(identifier);
    }

    function readBreakStatement() {
        proceedToken();
        if (isIdentifierName && !isLineSeparatedAhead) {
            var identifier = expectingIdentifier();
            var labelset = findLabel(stack.labelStack, identifier);
            if (labelset === undefined) throw SyntaxError(prevTokenPos);
        } else if (stack.iterables === 0 && stack.switches === 0) throw SyntaxError(prevTokenPos);
        expectingAutoSemicolon();
        return BreakStatement(identifier);
    }

    function readReturnStatement() {
        proceedToken();
        if (code.type !== "function") throw SyntaxError(prevTokenPos);
        if (!(isLineSeparatedAhead || token === ';' || token === '}')) {
            var pos = tokenPos;
            var expression = readExpression();
        }
        expectingAutoSemicolon();
        return ReturnStatement(expression, pos);
    }

    function readWithStatement() {
        proceedToken();
        if (strict) throw SyntaxError(prevTokenPos);
        expectingToken('(');
        var pos = tokenPos;
        var expression = readExpression();
        expectingToken(')');
        var outerLexEnv = lexEnv;
        lexEnv = Env("with", lexEnv);
        var statement = readStatement();
        lexEnv = outerLexEnv;
        return WithStatement(expression, statement, pos);
    }

    function readSwitchStatement(labelset) {
        proceedToken();
        expectingToken('(');
        var pos1 = tokenPos;
        var expression = readExpression();
        expectingToken(')');
        var firstClauses = [];
        var secondClauses = [];
        expectingToken('{');
        while (!testToken('}')) {
            if (testToken("default")) {
                if (defaultClause !== undefined) throw SyntaxError(prevTokenPos);
                expectingToken(':');
                var statements = [];
                while (token !== '}' && token !== "case" && token !== "default") {
                    statements.push(readStatement());
                }
                var defaultClause = StatementList(statements);
                continue;
            }
            expectingToken("case");
            var pos2 = tokenPos;
            var caseExpression = readExpression();
            expectingToken(':');
            var statements = [];
            while (token !== '}' && token !== "case" && token !== "default") {
                statements.push(readStatement());
            }
            var clause = CaseClause(caseExpression, StatementList(statements), pos2);
            if (defaultClause === undefined) {
                firstClauses.push(clause);
            } else {
                secondClauses.push(clause);
            }
        }
        return SwitchStatement(expression, CaseBlock(firstClauses, defaultClause, secondClauses), labelset, pos1);
    }

    function readThrowStatement() {
        proceedToken();
        if (isLineSeparatedAhead) throw SyntaxError(prevTokenPos);
        var pos = tokenPos;
        var expression = readExpression();
        expectingAutoSemicolon();
        return ThrowStatement(expression, pos);
    }

    function readTryStatement() {
        proceedToken();
        var block = readBlockStatement();
        if (testToken("catch")) {
            expectingToken('(');
            var identifier = expectingIdentifier();
            if (strict) {
                disallowEvalOrArguments(identifier);
            }
            expectingToken(')');
            var outerLexEnv = lexEnv;
            lexEnv = Env("catch", lexEnv);
            setIncluded(identifier, lexEnv.defs);
            var catchBlock = CatchBlock(lexEnv, identifier, readBlockStatement());
            lexEnv = outerLexEnv;
            if (testToken("finally")) {
                var finallyBlock = readBlockStatement();
            }
        } else {
            expectingToken("finally");
            var finallyBlock = readBlockStatement();
        }
        return TryStatement(block, catchBlock, finallyBlock);
    }

    function readDebuggerStatement() {
        var pos = tokenPos;
        proceedToken();
        expectingAutoSemicolon();
        return DebuggerStatement(pos);
    }

    function readFunctionStatement() {
        if (strict) throw SyntaxError(tokenPos);
        code.functions.push(readFunctionDeclaration());
        return EmptyStatement();
    }

    function findLabel(labelStack, identifier) {
        var i = labelStack.length;
        while (i-- !== 0) {
            var labelset = labelStack[i];
            if (isIncluded(identifier, labelset)) return labelset;
        }
        return undefined;
    }

    function readExpression(isNoIn) {
        var expression = readAssignmentExpression(isNoIn);
        while (testToken(',')) {
            var rightExpression = readAssignmentExpression(isNoIn);
            expression = CommaOperator(expression, rightExpression);
        }
        return expression;
    }

    function readAssignmentExpression(isNoIn) {
        var expression = readConditionalExpression(isNoIn);
        var operator = token;
        switch (operator) {
            case '=':
            case '*=':
            case '/=':
            case '%=':
            case '+=':
            case '-=':
            case '<<=':
            case '>>=':
            case '>>>=':
            case '&=':
            case '|=':
            case '^=':
                proceedToken();
                if (expression !== lastLeftHandSide) throw SyntaxError(prevTokenPos);
                if (expression !== lastReference) throw ReferenceError(prevTokenPos);
                if (strict && expression === lastIdentifierReference) {
                    disallowEvalOrArguments(lastIdentifier);
                }
                var rightExpression = readAssignmentExpression(isNoIn);
                if (operator === '=') return SimpleAssignment(expression, rightExpression);
                else return CompoundAssignment(operator, expression, rightExpression);
        }
        return expression;
    }

    function readConditionalExpression(isNoIn) {
        var expression = readBinaryExpression('', isNoIn);
        if (testToken('?')) {
            var firstExpression = readAssignmentExpression();
            expectingToken(':');
            var secondExpression = readAssignmentExpression(isNoIn);
            return ConditionalOperator(expression, firstExpression, secondExpression);
        }
        return expression;
    }

    function readBinaryExpression(leadingOperator, isNoIn) {
        var expression = readUnaryExpression();
        while (true) {
            var operator = token;
            if (isNoIn && operator === "in") {
                break;
            }
            if (getOperatorPriority(leadingOperator) <= getOperatorPriority(operator)) {
                break;
            }
            proceedToken();
            var rightExpression = readBinaryExpression(operator, isNoIn);
            switch (operator) {
                case '*':
                case '/':
                case '%':
                    expression = MultiplicativeOperator(operator, expression, rightExpression);
                    break;
                case '+':
                    expression = AdditionOperator(expression, rightExpression);
                    break;
                case '-':
                    expression = SubtractionOperator(expression, rightExpression);
                    break;
                case '<<':
                    expression = LeftShiftOperator(expression, rightExpression);
                    break;
                case '>>':
                    expression = SignedRightShiftOperator(expression, rightExpression);
                    break;
                case '>>>':
                    expression = UnsignedRightShiftOperator(expression, rightExpression);
                    break;
                case '<':
                    expression = LessThanOperator(expression, rightExpression);
                    break;
                case '>':
                    expression = GreaterThanOperator(expression, rightExpression);
                    break;
                case '<=':
                    expression = LessThanOrEqualOperator(expression, rightExpression);
                    break;
                case '>=':
                    expression = GreaterThanOrEqualOperator(expression, rightExpression);
                    break;
                case "instanceof":
                    expression = instanceofOperator(expression, rightExpression);
                    break;
                case "in":
                    expression = inOperator(expression, rightExpression);
                    break;
                case '==':
                    expression = EqualsOperator(expression, rightExpression);
                    break;
                case '!=':
                    expression = DoesNotEqualOperator(expression, rightExpression);
                    break;
                case '===':
                    expression = StrictEqualsOperator(expression, rightExpression);
                    break;
                case '!==':
                    expression = StrictDoesNotEqualOperator(expression, rightExpression);
                    break;
                case '&':
                case '^':
                case '|':
                    expression = BinaryBitwiseOperator(operator, expression, rightExpression);
                    break;
                case '&&':
                    expression = LogicalAndOperator(expression, rightExpression);
                    break;
                case '||':
                    expression = LogicalOrOperator(expression, rightExpression);
                    break;
            }
        }
        return expression;
    }

    function getOperatorPriority(operator) {
        switch (operator) {
            case '*':
            case '/':
            case '%':
                return 1;
            case '+':
            case '-':
                return 2;
            case '<<':
            case '>>':
            case '>>>':
                return 3;
            case '<':
            case '>':
            case '<=':
            case '>=':
            case "instanceof":
            case "in":
                return 4;
            case '==':
            case '!=':
            case '===':
            case '!==':
                return 5;
            case '&':
                return 6;
            case '^':
                return 7;
            case '|':
                return 8;
            case '&&':
                return 9;
            case '||':
                return 10;
        }
        return 99;
    }

    function readUnaryExpression() {
        var operator = token;
        switch (operator) {
            case "delete":
                proceedToken();
                var expression = readUnaryExpression();
                if (strict && expression === lastIdentifierReference) throw SyntaxError(prevTokenPos);
                return deleteOperator(expression);
            case "void":
                proceedToken();
                var expression = readUnaryExpression();
                return voidOperator(expression);
            case "typeof":
                proceedToken();
                var expression = readUnaryExpression();
                return typeofOperator(expression);
            case '++':
                proceedToken();
                var expression = readUnaryExpression();
                if (strict && expression === lastIdentifierReference) {
                    disallowEvalOrArguments(lastIdentifier);
                }
                if (expression !== lastReference) throw ReferenceError(prevTokenPos);
                return PrefixIncrementOperator(expression);
            case '--':
                proceedToken();
                var expression = readUnaryExpression();
                if (strict && expression === lastIdentifierReference) {
                    disallowEvalOrArguments(lastIdentifier);
                }
                if (expression !== lastReference) throw ReferenceError(prevTokenPos);
                return PrefixDecrementOperator(expression);
            case '+':
                proceedToken();
                var expression = readUnaryExpression();
                return PlusOperator(expression);
            case '-':
                proceedToken();
                var expression = readUnaryExpression();
                return MinusOperator(expression);
            case '~':
                proceedToken();
                var expression = readUnaryExpression();
                return BitwiseNOTOperator(expression);
            case '!':
                proceedToken();
                var expression = readUnaryExpression();
                return LogicalNOTOperator(expression);
        }
        var expression = readLeftHandSideExpression();
        if (isLineSeparatedAhead) return expression;
        var operator = token;
        switch (operator) {
            case '++':
                if (strict && expression === lastIdentifierReference) {
                    disallowEvalOrArguments(lastIdentifier);
                }
                if (expression !== lastReference) throw ReferenceError(tokenPos);
                proceedToken();
                return PostfixIncrementOperator(expression);
            case '--':
                if (strict && expression === lastIdentifierReference) {
                    disallowEvalOrArguments(lastIdentifier);
                }
                if (expression !== lastReference) throw ReferenceError(tokenPos);
                proceedToken();
                return PostfixDecrementOperator(expression);
        }
        return expression;
    }

    function readLeftHandSideExpression() {
        var newOperators = 0;
        while (testToken("new")) {
            newOperators++;
        }
        if (token === "function") {
            var expression = readFunctionExpression();
        } else {
            var expression = readPrimaryExpression();
        }
        while (true) {
            switch (token) {
                case '[':
                    proceedToken();
                    var indexExpression = readExpression();
                    expectingToken(']');
                    expression = PropertyAccessor(expression, indexExpression, strict);
                    lastReference = expression;
                    continue;
                case '.':
                    proceedToken();
                    var name = expectingIdentifierName();
                    expression = PropertyAccessor(expression, Literal(name), strict);
                    lastReference = expression;
                    continue;
                case '(':
                    if (expression === lastIdentifierReference && lastIdentifier === "eval" && newOperators === 0) {
                        code.existsDirectEval = true;
                        lexEnv.existsDirectEval = true;
                    }
                    var args = readArguments();
                    if (newOperators !== 0) {
                        newOperators--;
                        expression = NewOperator(expression, args);
                    } else {
                        expression = FunctionCall(expression, args, strict);
                    }
                    continue;
            }
            break;
        }
        while (newOperators-- !== 0) {
            expression = NewOperator(expression, []);
        }
        lastLeftHandSide = expression;
        return expression;
    }

    function readArguments() {
        var args = [];
        proceedToken();
        if (!testToken(')')) {
            while (true) {
                args.push(readAssignmentExpression());
                if (testToken(')')) {
                    break;
                }
                expectingToken(',');
            }
        }
        return args;
    }

    function readFunctionExpression() {
        proceedToken();
        if (!testToken('(')) {
            var name = expectingIdentifier();
            expectingToken('(');
        }
        var parameters = [];
        if (!testToken(')')) {
            while (true) {
                parameters.push(expectingIdentifier());
                if (testToken(')')) {
                    break;
                }
                expectingToken(',');
            }
        }
        expectingToken('{');
        var outerLexEnv = lexEnv;
        if (name) {
            lexEnv = Env("named-function", lexEnv);
            setIncluded(name, lexEnv.defs);
        }
        var body = readFunctionBody(name, parameters, lexEnv);
        var expression = FunctionExpression(lexEnv, body);
        lexEnv = outerLexEnv;
        expectingToken('}');
        if (body.strict) {
            disallowEvalOrArguments(name);
            disallowDuplicated(parameters);
            parameters.forEach(disallowEvalOrArguments);
        }
        return expression;
    }

    function readPrimaryExpression() {
        if (isNumericLiteral || isStringLiteral) {
            var expression = Literal(value);
            proceedToken();
            return expression;
        }
        if (isIdentifierName && !isReservedWord(token)) {
            var identifier = proceedToken();
            var expression = IdentifierReference(lexEnv, identifier, strict);
            lastIdentifierReference = expression;
            lastIdentifier = identifier;
            lastReference = expression;
            if (identifier === "arguments") {
                code.existsArgumentsRef = true;
            }
            setIncluded(identifier, lexEnv.refs);
            return expression;
        }
        if (token === '/' || token === '/=') {
            setPosition(tokenPos);
            value = readRegExpLiteral();
            skipSpaces();
            proceedToken();
            return RegExpLiteral(value);
        }
        switch (proceedToken()) {
            case "this":
                return ThisExpression();
            case "null":
                return Literal(null);
            case "false":
                return Literal(false);
            case "true":
                return Literal(true);
            case '[':
                var elements = [];
                while (true) {
                    while (testToken(',')) {
                        elements.push(empty);
                    }
                    if (testToken(']')) {
                        elements.push(empty);
                        break;
                    }
                    elements.push(readAssignmentExpression());
                    if (testToken(']')) {
                        break;
                    }
                    expectingToken(',');
                }
                return ArrayInitialiser(elements);
            case '{':
                var elements = [];
                var previous = ({
                    data: [],
                    get: [],
                    set: [],
                });
                while (true) {
                    if (testToken('}')) {
                        break;
                    }
                    elements.push(readPropertyAssignment(previous));
                    if (testToken('}')) {
                        break;
                    }
                    expectingToken(',');
                }
                return ObjectInitialiser(elements);
            case '(':
                var expression = readExpression();
                expectingToken(')');
                return expression;
        }
        throw SyntaxError(prevTokenPos);
    }

    function readPropertyAssignment(previous) {
        var name = expectingPropertyName();
        if (token === ':') {
            if (strict && isIncluded(name, previous.data)) throw SyntaxError(prevTokenPos);
            if (isIncluded(name, previous.get)) throw SyntaxError(prevTokenPos);
            if (isIncluded(name, previous.set)) throw SyntaxError(prevTokenPos);
            previous.data.push(name);
            proceedToken();
            var expression = readAssignmentExpression();
            var a = PropertyAssignment(name, expression);
        } else if (name === "get") {
            name = expectingPropertyName();
            if (isIncluded(name, previous.data)) throw SyntaxError(prevTokenPos);
            if (isIncluded(name, previous.get)) throw SyntaxError(prevTokenPos);
            previous.get.push(name);
            expectingToken('(');
            expectingToken(')');
            expectingToken('{');
            var body = readFunctionBody("get_" + name, [], lexEnv);
            expectingToken('}');
            var a = PropertyAssignmentGet(name, body);
        } else if (name === "set") {
            name = expectingPropertyName();
            if (isIncluded(name, previous.data)) throw SyntaxError(prevTokenPos);
            if (isIncluded(name, previous.set)) throw SyntaxError(prevTokenPos);
            previous.set.push(name);
            expectingToken('(');
            var identifier = expectingIdentifier();
            expectingToken(')');
            expectingToken('{');
            var body = readFunctionBody("set_" + name, [identifier], lexEnv);
            expectingToken('}');
            if (body.strict) {
                disallowEvalOrArguments(identifier);
            }
            var a = PropertyAssignmentSet(name, body);
        } else {
            expectingToken(':');
        }
        return a;
    }

    function disallowDuplicated(parameters) {
        for (var i = 0; i < parameters.length; i++) {
            for (var j = 0; j < i; j++) {
                if (parameters[i] === parameters[j]) throw SyntaxError(prevTokenPos);
            }
        }
    }

    function disallowEvalOrArguments(identifier) {
        if (identifier === "eval" || identifier === "arguments") throw SyntaxError(prevTokenPos);
    }

    function testToken(t) {
        if (token === t) {
            proceedToken();
            return true;
        }
        return false;
    }

    function expectingToken(t) {
        if (proceedToken() === t) {
            return;
        }
        throw SyntaxError(prevTokenPos);
    }

    function expectingAutoSemicolon() {
        if (token === ';') {
            proceedToken();
            return;
        }
        if (isLineSeparatedAhead || token === '}') return;
        throw SyntaxError(tokenPos);
    }

    function expectingIdentifier() {
        if (isIdentifierName && !isReservedWord(token)) return proceedToken();
        throw SyntaxError(tokenPos);
    }

    function expectingIdentifierName() {
        if (isIdentifierName) return proceedToken();
        throw SyntaxError(tokenPos);
    }

    function expectingPropertyName() {
        if (isIdentifierName) return proceedToken();
        if (isStringLiteral) {
            var name = value;
            proceedToken();
            return name;
        }
        if (isNumericLiteral) {
            var name = ToString(value);
            proceedToken();
            return name;
        }
        throw SyntaxError(tokenPos);
    }

    function isReservedWord(v) {
        switch (v) {
            case "null":
            case "true":
            case "false":
            case "break":
            case "case":
            case "catch":
            case "continue":
            case "debugger":
            case "default":
            case "delete":
            case "do":
            case "else":
            case "finally":
            case "for":
            case "function":
            case "if":
            case "in":
            case "instanceof":
            case "new":
            case "return":
            case "switch":
            case "this":
            case "throw":
            case "try":
            case "typeof":
            case "var":
            case "void":
            case "while":
            case "with":
            case "class":
            case "const":
            case "enum":
            case "export":
            case "extends":
            case "import":
            case "super":
                return true;
        }
        if (strict) {
            switch (v) {
                case "implements":
                case "interface":
                case "let":
                case "package":
                case "private":
                case "protected":
                case "public":
                case "static":
                case "yield":
                    return true;
            }
        }
        return false;
    }

    function proceedToken() {
        var t = token;
        isLineSeparatedAhead = isLineSeparatedBehind;
        prevTokenPos = tokenPos;
        tokenPos = currentPos;
        token = readToken();
        tokenEndPos = currentPos;
        skipSpaces();
        return t;
    }

    function skipSpaces() {
        isLineSeparatedBehind = false;
        while (true) {
            if (isWhiteSpace(current)) {
                proceed();
                continue;
            }
            if (current === undefined) {
                isLineSeparatedBehind = true;
                break;
            }
            if (isLineTerminator(current)) {
                proceed();
                isLineSeparatedBehind = true;
                continue;
            }
            if (current === '/') {
                var pos = currentPos;
                proceed();
                if (current === '/') {
                    while (true) {
                        var c = proceed();
                        if (c === undefined || isLineTerminator(c)) {
                            isLineSeparatedBehind = true;
                            break;
                        }
                    }
                    continue;
                }
                if (current === '*') {
                    proceed();
                    while (true) {
                        if (current === undefined) throw SyntaxError();
                        var c = proceed();
                        if (isLineTerminator(c)) {
                            isLineSeparatedBehind = true;
                        }
                        if (c === '*' && current === '/') {
                            proceed();
                            break;
                        }
                    }
                    continue;
                }
                setPosition(pos);
            }
            break;
        }
    }

    function readToken() {
        isNumericLiteral = false;
        isStringLiteral = false;
        isIdentifierName = false;
        isEscaped = false;
        if (current === undefined) return undefined;
        var c = proceed();
        switch (c) {
            case '{':
            case '}':
            case '(':
            case ')':
            case '[':
            case ']':
            case ';':
            case ',':
            case '~':
            case '?':
            case ':':
                break;
            case '.':
                if (isDecimalDigitChar(current)) {
                    isNumericLiteral = true;
                    setPosition(tokenPos);
                    value = readNumericLiteral();
                    if (current === '\\' || isIdentifierStart(current)) throw SyntaxError();
                    return '';
                }
                break;
            case '<':
                current === '<' && proceed();
                current === '=' && proceed();
                break;
            case '>':
                current === '>' && proceed();
                current === '>' && proceed();
                current === '=' && proceed();
                break;
            case '=':
            case '!':
                current === '=' && proceed();
                current === '=' && proceed();
                break;
            case '+':
            case '-':
            case '&':
            case '|':
                if (current === c) {
                    proceed();
                    break;
                }
                current === '=' && proceed();
                break;
            case '*':
            case '%':
            case '^':
            case '/':
                current === '=' && proceed();
                break;
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                isNumericLiteral = true;
                setPosition(tokenPos);
                value = readNumericLiteral();
                if (current === '\\' || isIdentifierStart(current)) throw SyntaxError();
                return '';
            case '"':
            case "'":
                isStringLiteral = true;
                var t = c;
                while (true) {
                    if (current === undefined || isLineTerminator(current)) throw SyntaxError();
                    var c = proceed();
                    if (c === t) {
                        value = source.substring(tokenPos + 1, currentPos - 1);
                        break;
                    }
                    if (c === '\\') {
                        isEscaped = true;
                        setPosition(tokenPos);
                        value = readEscapedStringLiteral();
                        break;
                    }
                }
                return '';
            default:
                isIdentifierName = true;
                if (c === '\\') {
                    isEscaped = true;
                    setPosition(tokenPos);
                    return readEscapedIdentifierName();
                }
                if (!isIdentifierStart(c)) throw SyntaxError();
                while (true) {
                    if (current === '\\') {
                        isEscaped = true;
                        setPosition(tokenPos);
                        return readEscapedIdentifierName();
                    }
                    if (!isIdentifierPart(current)) {
                        break;
                    }
                    proceed();
                }
                break;
        }
        return source.substring(tokenPos, currentPos);
    }

    function readNumericLiteral() {
        var startPos = currentPos;
        if (current === '0') {
            proceed();
            if (current === 'X' || current === 'x') {
                proceed();
                if (!isHexDigitChar(current)) throw SyntaxError();
                while (isHexDigitChar(current)) {
                    proceed();
                }
                return Number(source.substring(startPos, currentPos));
            }
            if (isOctalDigitChar(current)) {
                if (strict) throw SyntaxError();
                var x = mvDigitChar(proceed());
                while (isOctalDigitChar(current)) {
                    x = (x << 3) + mvDigitChar(proceed());
                }
                return x;
            }
            if (current === '8' || current === '9') throw SyntaxError();
        }
        while (isDecimalDigitChar(current)) {
            proceed();
        }
        if (current === '.') {
            proceed();
            while (isDecimalDigitChar(current)) {
                proceed();
            }
        }
        if (current === 'E' || current === 'e') {
            proceed();
            if (current === '+' || current === '-') {
                proceed();
            }
            if (!isDecimalDigitChar(current)) throw SyntaxError();
            while (isDecimalDigitChar(current)) {
                proceed();
            }
        }
        return Number(source.substring(startPos, currentPos));
    }

    function readRegExpLiteral() {
        var pos = currentPos;
        proceed();
        while (true) {
            if (current === undefined || isLineTerminator(current)) throw SyntaxError();
            var c = proceed();
            if (c === '/') {
                break;
            }
            if (c === '\\') {
                if (current === undefined || isLineTerminator(current)) throw SyntaxError();
                proceed();
            }
            if (c === '[') {
                while (true) {
                    if (current === undefined || isLineTerminator(current)) throw SyntaxError();
                    var c = proceed();
                    if (c === ']') {
                        break;
                    }
                    if (c === '\\') {
                        proceed();
                    }
                }
            }
        }
        var pattern = source.substring(pos + 1, currentPos - 1);
        var pos = currentPos;
        while (true) {
            c = readIdentifierPart();
            if (c === undefined) {
                break;
            }
        }
        var flags = source.substring(pos, currentPos);
        try {
            var regexp = RegExpFactory.compile(pattern, flags);
        } catch (e) {
            if (e instanceof RegExpFactory.SyntaxError) {
                throw SyntaxError(tokenPos + e.pos);
            }
            throw e;
        }
        return regexp;
    }

    function readEscapedStringLiteral() {
        var buffer = [];
        var t = proceed();
        while (true) {
            if (current === undefined || isLineTerminator(current)) throw SyntaxError();
            var c = proceed();
            if (c === t) {
                break;
            }
            if (c === '\\') {
                if (current === undefined || isLineTerminator(current)) {
                    var c = proceed();
                    if (c === '\r' && current === '\n') {
                        proceed();
                    }
                    continue;
                }
                var c = proceed();
                switch (c) {
                    case 'b':
                        c = '\b';
                        break;
                    case 'f':
                        c = '\f';
                        break;
                    case 'n':
                        c = '\n';
                        break;
                    case 'r':
                        c = '\r';
                        break;
                    case 't':
                        c = '\t';
                        break;
                    case 'v':
                        c = '\v';
                        break;
                    case 'x':
                        var x = 0;
                        for (var i = 0; i < 2; i++) {
                            if (!isHexDigitChar(current)) throw SyntaxError();
                            x = (x << 4) + mvDigitChar(proceed());
                        }
                        c = charCode2String(x);
                        break;
                    case 'u':
                        var x = 0;
                        for (var i = 0; i < 4; i++) {
                            if (!isHexDigitChar(current)) throw SyntaxError();
                            x = (x << 4) + mvDigitChar(proceed());
                        }
                        c = charCode2String(x);
                        break;
                    case '0':
                    case '1':
                    case '2':
                    case '3':
                        if (strict) {
                            if (c === '0' && isDecimalDigitChar(current) !== true) {
                                c = '\0';
                                break;
                            }
                            throw SyntaxError();
                        }
                        var x = mvDigitChar(c);
                        if (current === '8' || current === '9') throw SyntaxError();
                        if (isOctalDigitChar(current)) {
                            x = (x << 3) + mvDigitChar(proceed());
                            if (current === '8' || current === '9') throw SyntaxError();
                            if (isOctalDigitChar(current)) {
                                x = (x << 3) + mvDigitChar(proceed());
                            }
                        }
                        c = charCode2String(x);
                        break;
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                        if (strict) throw SyntaxError();
                        var x = mvDigitChar(c);
                        if (current === '8' || current === '9') throw SyntaxError();
                        if (isOctalDigitChar(current)) {
                            x = (x << 3) + mvDigitChar(proceed());
                        }
                        c = charCode2String(x);
                        break;
                    case '8':
                    case '9':
                        throw SyntaxError();
                }
            }
            buffer.push(c);
        }
        return buffer.join('');
    }

    function readEscapedIdentifierName() {
        var buffer = [];
        var c = readIdentifierPart();
        if (!isIdentifierStart(c)) throw SyntaxError();
        buffer.push(c);
        while (true) {
            c = readIdentifierPart();
            if (c === undefined) {
                break;
            }
            buffer.push(c);
        }
        return buffer.join('');
    }

    function readIdentifierPart() {
        if (current === '\\') {
            proceed();
            if (current !== 'u') throw SyntaxError();
            proceed();
            var x = 0;
            for (var i = 0; i < 4; i++) {
                if (!isHexDigitChar(current)) throw SyntaxError();
                x = (x << 4) + mvDigitChar(proceed());
            }
            var c = charCode2String(x);
            if (!isIdentifierPart(c)) throw SyntaxError();
            return c;
        }
        if (!isIdentifierPart(current)) return undefined;
        return proceed();
    }

    function proceed() {
        var c = current;
        if (c !== undefined) {
            current = source[++currentPos];
        }
        return c;
    }

    function setPosition(pos) {
        currentPos = pos;
        current = source[currentPos];
    }

    function convertToLineColumn(source, pos, info) {
        var lineNumber = 1;
        var lineHeadPos = 0;
        var i = 0;
        while (i < pos) {
            var c = source[i++];
            if (!isLineTerminator(c)) {
                continue;
            }
            if (c === '\r' && source[i] === '\n') {
                i++;
            }
            lineNumber++;
            lineHeadPos = i;
        }
        info.lineNumber = lineNumber;
        info.columnNumber = pos - lineHeadPos + 1;
    }

    function locateDebugInfo(code, pos, info) {
        var sourceObject = code.sourceObject;
        var source = sourceObject.source;
        convertToLineColumn(source, pos, info);
        info.filename = sourceObject.filename;
        info.functionName = undefined;
        if (code.type === "function") {
            info.functionName = code.functionName;
        }
    }

    function SyntaxError(pos) {
        if (!(this instanceof SyntaxError)) {
            return new SyntaxError(pos);
        }
        if (pos === undefined) {
            pos = currentPos;
        }
        if (pos >= source.length) {
            this.message = "Unexpected end of input: " + sourceObject.filename;
            return;
        }
        var info = {};
        convertToLineColumn(source, pos, info);
        this.message = sourceObject.filename + ":" + info.lineNumber + ":" + info.columnNumber;
    }

    function ReferenceError(pos) {
        if (!(this instanceof ReferenceError)) {
            return new ReferenceError(pos);
        }
        var info = {};
        convertToLineColumn(source, pos, info);
        this.message = sourceObject.filename + ":" + info.lineNumber + ":" + info.columnNumber;
    }

})();
