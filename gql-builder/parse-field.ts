import { parse } from "../vendors/acorn/acorn.mjs";

/** Parse fields from expression string
 * @param strExp Expression string to parse; func.toString()
 */
export function parseField(strExp: string): string {
    let stringBuilder = "";

    //remove whitespaces and return feeds to compress string
    strExp = strExp.replace(/(\r\n|\n|\r)/gm,"").replace(/\s+/g,"").trim();

    let ast = parse(strExp, null);

    if (ast.body[0].type === "ExpressionStatement") {
        if (ast.body[0].expression.type === "ArrowFunctionExpression") {
            if (ast.body[0].expression.body.type === "BlockStatement") {
                if (ast.body[0].expression.body.body[0].type === "ReturnStatement") {
                    if (ast.body[0].expression.body.body[0].argument.type === "ObjectExpression") {
                        let activeKey1 = "";
                        ast.body[0].expression.body.body[0].argument.properties.forEach((p: any) => {
                            if (p.value.type === "MemberExpression") {

                                switch (p.value.object.type) {
                                    case "Identifier":
                                        if (stringBuilder.length > 0) stringBuilder += ",";
                                        //= If alias match, just add field name or add both alias and field name
                                        if (p.key.name === p.value.property.name) stringBuilder += p.key.name;
                                        else stringBuilder += p.key.name + ":" + p.value.property.name;
                                        break;
                                    
                                    case "MemberExpression":
                                        // process nested object (one-to-one)
                                        AppendGroup(p.value.object.property.name, p.value.property.name, p.key.name);
                                        activeKey1 = p.value.object.property.name;
                                        break;
                                    default:
                                        break;
                                }
                            }
                            else if (p.value.type === "CallExpression") {
                                if (stringBuilder.length > 0) stringBuilder += ",";

                                if (p.key.name === p.value.callee.object.property.name) stringBuilder += p.key.name;
                                else stringBuilder += p.key.name + ":" + p.value.callee.object.property.name;

                                stringBuilder += "{";

                                //== Process nested objects
                                if (p.value.arguments[0].type === "ArrowFunctionExpression") {
                                    if (p.value.arguments[0].body.body[0].type === "ReturnStatement") {
                                        let activeKey2 = "";
                                        p.value.arguments[0].body.body[0].argument.properties.forEach((p: any) => {
                                            if (p.value.object.type === "MemberExpression" && p.value.property.type === "Identifier") {
                                                // contains both
                                                AppendGroup(p.value.object.property.name, p.value.property.name, p.key.name);
                                                activeKey2 = p.value.object.property.name;
                                            }
                                            else {
                                                if (stringBuilder.length > 0 && !stringBuilder.endsWith("{")) stringBuilder += ",";

                                                if (p.key.name === p.value.property.name) stringBuilder += p.key.name;
                                                else stringBuilder += p.key.name + ":" + p.value.property.name;
                                            }
                                        });
                                        // Add nested one-to-one objects
                                        //console.log(groups);
                                        groups.forEach(i => {
                                            let keys = Object.keys(i);
                                            if (activeKey2 === keys[0]) {
                                                if (stringBuilder.length > 0) stringBuilder += ",";
                                                stringBuilder += keys[0] + "{";
                                                stringBuilder += i[keys[0]].join(",");
                                            
                                                stringBuilder += "}";
                                            }
                                        });
                                        groups = groups.filter((z) => { 
                                            if (z[activeKey2] === undefined) return z;
                                        });
                                    }
                                }

                                // Close query statement
                                stringBuilder += "}";
                            }
                        });
                        // Add nested one-to-one objects
                        //console.log(groups);
                        groups.forEach(i => {
                            let keys = Object.keys(i);
                            if (activeKey1 === keys[0]) {
                                if (stringBuilder.length > 0) stringBuilder += ",";
                                stringBuilder += keys[0] + "{";
                                stringBuilder += i[keys[0]].join(",");
                            
                                stringBuilder += "}";
                            }
                        });
                        groups = groups.filter((z) => { 
                            if (z[activeKey1] === undefined) return z;
                        });
                        // Close query statement
                        stringBuilder += "}";
                    }
                }
            }
        }
    }
    return stringBuilder;
}

let groups = [] as any[];
/** Append field to group */
function AppendGroup(name: string, value: string, alias?: string) {
    if (alias !== undefined && alias !== null && alias !== value)
        value = alias + ":" + value;

    let f = groups.find((a, b) => {
        let o = Object.keys(a);
        return o.indexOf(name) > -1;
    });

    if (f === undefined) {
        let obj = {} as any;
        obj[name] = [];
        obj[name].push(value);
        groups.push(obj);
    }
    else {
        f[name].push(value);
    }        
}