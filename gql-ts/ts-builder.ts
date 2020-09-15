import { Introspection } from "./introspection-schema.d.ts";

let typeMapping = [] as { key: string, value: string }[];

/** Checks Scalar type and returns Typescript type 
 * @param name name to search on
 * @returns TypeScript equivalent type, or type; any
*/
function getType(name: string): string {
    let v = typeMapping.find(x => {
        return x.key === name;
    });
    if (v === undefined)
        v = { key: "", value: "any" };
    return v.value
}

/** Add a custom scalar type to mappings
 * @param key custom type name to bind, normally a C# type
 * @param value Typescript equivalent type
 */
export function addScalar(key: string, value: string) {
    if (getType(key) !== "any")
        throw `Key ${key} already exist!`;

    typeMapping.push({key, value});
}

/** Builds the Interface and Class types
 * @param introspection Introspection query object
 * @returns a string output
 */
export function TypesBuilder(introspection: Introspection, opt: { namespace: string, buildClasses: boolean, addIPrefix: boolean, addNull: boolean }): string {
    let sb = "";            // main string builder
    let tab = "    ";       // set the indented spaces
    let queryClass = "";    // string builder for the query classes
    let sbClass = "";       // string builder for the class object
    let argumentClass = ""  // string builder for the argument class;

    if (opt.namespace.trim() !== "")
        sb += `export declare namespace ${opt.namespace} {\n`

    introspection.data["__schema"].types.forEach(t => {
        if (t.name.startsWith("Query")) {
            //console.log(t.fields);
            t.fields.forEach(f => {
                //console.log(f.name);
                //if (f.name === "groupPager") {
                    if (f.type.kind === "OBJECT") {
                        // build class header
                        queryClass += `/**${f.description}*/\nexport class ${f.name} extends ${f.type.name} {\n`;
                    }
                    if (f.type.kind === "LIST") {
                        queryClass += `/**${f.description}*/\nexport class ${f.name} extends ${f.type.ofType.name} {\n`;
                    }

                    if (f.args.length === 0) {
                        queryClass += tab + "constructor() {\n";
                    }
                    else {
                        //process args
                        let args = new Array<string>();
                        f.args.forEach(a => {
                            //console.log(a.type);
                            if (a.type.kind === "SCALAR") {
                                args.push(a.name + ": " + getType(a.type.name) + " | null");
                            }
                            else {
                                args.push(a.name + ": any");
                            }
                        });
                        queryClass += tab + `constructor(${args.join(", ")}) {\n`;
                        // Build an argument class to assist with strong-typing
                        // also this will start a NEW string
                        argumentClass = `/**Arguments for the ${f.name}*/\n`;
                        argumentClass += `export class ${f.name}Arguments {\n${tab}constructor() {\n`;
                        f.args.forEach(a => {
                            argumentClass += `${tab}${tab}this.${a.name} = null;\n`;
                        });
                        argumentClass += `${tab}}\n`;
                        args.forEach(a => {
                            argumentClass += `${tab}${a};\n`;
                        });
                        argumentClass += "}\n";
                    }
                    queryClass += tab + tab + "super();\n";
                    queryClass += tab + "}\n}\n";
                    //add argument class to main string builder
                    queryClass += argumentClass;
                    argumentClass = ""; //flush it so we don't keep writing it
                //}
            })
        }

        if (!t.name.startsWith("__", 0)) { // && t.name.indexOf('GroupPagination') > -1) {
            // Check for missing Scalar and warn
            if (t.kind === "SCALAR") {
                if (getType(t.name) === "any") 
                    console.warn("[WARN] missing scalar mapping: " + t.name);
            }

            if (t.kind === "OBJECT") {
                // build class header
                sbClass += `/**${t.description}*/\nexport class ${t.name} implements `;
                sbClass += opt.addIPrefix ? "I" : "";
                sbClass += t.name + " {\n";

                //build interface header
                sb += `/**${t.description}*/\nexport interface `;
                sb += opt.addIPrefix ? "I" : "";
                sb += t.name + " {\n";

                let body = "";
                let con = tab + "constructor() {\n"; //<- class constructor() {} 
                t.fields.forEach(f => {
                    if (f.description !== "")
                        body += tab + `/**${f.description}*/\n`;

                    body += tab + f.name;
                    con += `${tab}${tab}this.${f.name} = `;

                    //TODO: need more work, could be a non-nullable string or object :?
                    if (f.type.kind !== "NON_NULL")
                        con += `null;\n`;
                    else {
                        con += `0;\n`;
                    }

                    // Assign object types
                    if (f.type.kind === "SCALAR") {
                        body += `: ${getType(f.type.name)}`;
                    }
                    else if (f.type.kind === "OBJECT") {
                        body += opt.addIPrefix ? ": I" : ": ";
                        body += f.type.name;
                    }
                    else if (f.type.kind === "LIST") {
                        if (f.type.ofType.kind === "SCALAR")
                            body += ": " + getType(f.type.ofType.name) + "[]";
                        if (f.type.ofType.kind === "OBJECT") {
                            body += opt.addIPrefix ? ": I" : ": ";
                            body += f.type.ofType.name + "[]";
                        }
                    }
                    else if (f.type.kind === "NON_NULL") {
                        if (f.type.ofType.kind === "SCALAR")
                            body += ": " + getType(f.type.ofType.name);
                        if (f.type.ofType.kind === "OBJECT") {
                            // TODO: bug when Introspection query results in nuget EntityGraphQL v0.60.0
                            // Seems that all NON_NULL is a object type, where could be a scalar
                            // commented prefix code for now and replace with scalar type function
                            //body += addIPrefix ? ": I" : ": ";
                            //body += f.type.ofType.name;
                            body += ": " + getType(f.type.ofType.name); //<- add temporary until schema is fixed
                        }
                    }

                    if (opt.addNull && f.type.kind !== "NON_NULL")
                        body += " | null";

                    body += ";\n";
                });

                sb += body + "}\n";
                // mend together; header + constructor + body
                sbClass += con + tab + "}\n" + body + "}\n";

                //add class to main stringbuilder
                if (opt.buildClasses) {
                    sb += sbClass;
                    sbClass = ""; //<- reset
                }
            }

            // TODO: Input objects
            // if (t.kind === "INPUT_OBJECT") {
            //     if (t.name.indexOf('result') > -1) {
            //         console.log(t);
            //     }
            // }
        }

    });

    // insert the query class last so the classes are added BEFORE we start using them
    sb += queryClass;

    if (opt.namespace !== "")
        sb += "}"

    return sb;
}