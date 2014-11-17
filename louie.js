(function() {

    var Lua = {
        _g: {},
        run: function(){}
    };

    var Louie = function(scope) {
        var blFunctions = null;
        functions = {};
        variables = {};
        this._g = {player:{}, level:{}};
        Lua._g = this._g;
        this.stack = [];
    };
    var p = Louie.prototype;

    p.isBlacklistedFunction = function(name) {

    }

    p.call = function(scope, name, args){
        //this._s = scope;
        //console.log(this._g[scope]);
        var f = this._g[scope][name];
        var body = f.body;
        var parameters = f.parameters;
        var arguments = {}
        for(var i in args) {
            arguments[parameters[i].identifier.name] = this.interpretValue(args[i]);
        }
        this.interpretBody(body, this._g[scope], arguments);
        //this._s = null;

        /*stack.push({})
        var value;
        for(var i in body) {
            value = this.interpretStatement(body[i]);
            if(value != null) break;
        }
        stack.pop()
        if (value!= null) return value
        return null;*/
    }

    p.parse = function(code) {
        try {
            this.interpretBody(luaparse.parse(code).body);
        } catch (exception) {
            console.log("Error", exception)
        }
    }

    p.compile = function(tree) {
        functions = {}
        for(var i in tree) {
            var node = tree[i];
            if (node.type == "FunctionAssignment"){
                var name = interpretFunctionName(node.identifier)
                functions[name] = node.body;
            }
        }
    }

    p.setFunction = function(scope, name, code, args) {
        try {
            var p = [];
            for(var i in args){
                var id = {
                    type: "Identifier",
                    name: args[i]
                }
                p.push(id);
            } 

            var f = {
                type: "FunctionDeclaration",
                body: luaparse.parse(code).body,
                identifier: {
                    type: "Identifier",
                    name: name
                },
                parameters: p
            }
            //console.log(body);
            this._g[scope][name] = f
        } catch (exception) {
            console.log("Error", exception)
        }
    }

    p.interpretBody = function(body, scope, args) {
        var context;
        if(scope != null){
            context = scope;
        } else {
            context = {};
        }

        if(args != null) {
            for (var name in args) {
                context[name] = args[name]
            }
        }
        console.log("c", context);
        this.stack.push(context);
        //if(this.stack.length > 1) console.log(this.stack.length, this.stack[0], context);
        var value;
        for(var i in body) {
            value = this.interpretStatement(body[i]);
            if(value != null) break;
        }
        this.stack.pop()

        if (value!= null) {
            console.log("??",value);
            return value;
        }
        return null;
    }

    p.interpretFunction = function(f) {
        var name = this.interpretFunctionName(f.identifier);
        //console.log("name");
        if(name != null) {
            this._g[name] = f.body
            return null
        } else {
            return f.body 
        }
    }

    p.interpretCall = function(call){
        //console.log(call);
        var identifier = call.base || call.expression.base;
        var type = identifier.type;
        var sourceArgs = call.arguments || call.expression.arguments;
        if (type == "Identifier"){
            var functionBody = null;
            var arguments = {};
            for (var i = this.stack.length-1; i>=0; i--){
                //console.log(this.stack.length-1, i, this.stack[i], this.stack);
                if(identifier.name in this.stack[i]) {
                    functionBody = this.stack[i][identifier.name].body;
                    var args = this.stack[i][identifier.name].parameters;
                   // console.log(args);
                    for(var j in args) {
                        arguments[args[j].name] = this.interpretValue(sourceArgs[j]);
                    }
                }
            }
            return this.interpretBody(functionBody, null, arguments);
        } else if (type == "MemberExpression") {
            return this._g[identifier.base.name][identifier.identifier.name]();
        }
    }

    p.interpretFunctionName = function(identifier) {
        var type = identifier.type;
        if (type == "Identifier"){
            return identifier.name;
        } else if (type == "MemberExpression") {
            return indentifier.base.name;
        }
    }



    p.interpretStatement = function(statement) {
        var type = statement.type;
        switch(type) {
            case "AssignmentStatement":
                this.interpretAssignment(statement);
                break;
            case "LocalStatement":
                this.interpretLocal(statement);
                break;
            case "FunctionDeclaration":
                this.interpretFunction(statement);
                break;
            case "CallStatement":
                this.interpretCall(statement);
                break;
            case "IfStatement":
                return this.interpretCondition(statement);
                break;
            case "ReturnStatement":
                return this.interpretReturn(statement);
            default:
                return null;
        }
    }

    p.interpretLocal = function(statement) {
        var type = statement.variables[0].type;
        var identifier = statement.variables[0];
        var value = this.interpretValue(statement.init[0]);
        if (type == "Identifier"){
            this.stack[this.stack.length-1][identifier.name] = value;
        } else if (type == "MemberExpression") {
            this._g[identifier.base.name][identifier.identifier.name] = value;
        }
    }

    p.interpretReturn = function(statement) {
        console.log("r",statement,this.interpretValue(statement.arguments[0]));
        return this.interpretValue(statement.arguments[0]);
    }

    p.interpretCondition = function(condition) {
        var clauses = condition.clauses;
        for(var i in clauses) {
            var clause = clauses[i];
            var type = clause.type;
            if (type == "IfClause" || type == "ElseifClause" ){
                if(this.interpretValue(clause.condition)) {
                    console.log("!i",this.interpretBody(clause.body));
                    return this.interpretBody(clause.body);
                }
            } else {
                console.log("!e",this.interpretBody(clause.body), clause);
                return this.interpretBody(clause.body);
            }
        }
    }

    p.interpretClause = function(clause) {
        var type = clause.type;
        if (type == "IfClause" || type == "ElseIfClause" ){
            if(this.interpretValue(clause.condition))
                return this.interpretBody(clause.body);
        } else {
                return this.interpretBody(clause.body);
        }
    }

    p.interpretIdentifier = function(identifier) {
        var type = identifier.type;
        if (type == "Identifier"){
            //if(this._s) {
             //   return this._g[this._s][identifier.name];
            //} else {
             //   for() {
             //   return this._g[identifier.name];                }
            //}
            for (var i = this.stack.length-1; i>=0; i--){
                if(identifier.name in this.stack[i]) {
                    return this.stack[i][identifier.name];
                }
            }
            return null;
        } else if (type == "MemberExpression") {
            return this._g[identifier.base.name][identifier.identifier.name];
        }
    }

    p.interpretAssignment = function(statement) {
        var type = statement.variables[0].type;
        var identifier = statement.variables[0];
        var value = this.interpretValue(statement.init[0]);
        if (type == "Identifier"){
            this.stack[0][identifier.name] = value;
        } else if (type == "MemberExpression") {
            this._g[identifier.base.name][identifier.identifier.name] = value;
        }
    }

    p.interpretValue = function(value) {
        var type = value.type;
        switch(type) {
            case "BinaryExpression":
                var operator = value.operator;
                //console.log(value.operator);
                return this.interpretBinaryExpression(operator, this.interpretValue(value.left), this.interpretValue(value.right));
            case "NumericLiteral":
            case "StringLiteral":
            case "BooleanLiteral":
                //console.log(value.value);
                return value.value;
            case "UnaryExpression":
                var op = value.operator;
                if(op == "-") return -1 * this.interpretValue(value.argument);
                else if (op == "not") return !(this.interpretValue(value.argument));
            case "Identifier":
            case "MemberExpression":
                return this.interpretIdentifier(value);
            case "CallExpression":
                return this.interpretCall(value);
            default:
                return null;
        }

    }

    p.interpretCallExpression = function(value) {
        var identifier = call.base;
        var type = identifier.type;
        if (type == "Identifier"){
            var functionBody = null;
            for (var i = this.stack.length-1; i>=0; i--){
                if(identifier.name in this.stack[i]) {
                    functionBody = this.stack[i][identifier.name];
                }
            }
            console.log(functionBody);
            returnthis.interpretBody(functionBody);
        } else if (type == "MemberExpression") {
            this._g[identifier.base.name][identifier.identifier.name]();
        }
    }

    p.interpretBinaryExpression = function(operator, left, right) {
       // console.log("!" +operator)
        switch(operator) {
            case ">": return left > right;
            case "<": return left < right;
            case "<=": return left <= right;
            case ">=": return left >= right;
            case "~=": return left != right;
            case "==": return left == right;
            case "+": return left + right;
            case "-": return left - right;
            case "*": return left * right;
            case "/": return left / right;
            case "..": return left.toString() + right.toString();
            case "^": return Math.pow(left, right);
            case "and": return left && right;
            case "or": return left || right;
            default: return null;
        }
    }

    window.Louie = Louie; 
    window.Lua = Lua;
}(window));
