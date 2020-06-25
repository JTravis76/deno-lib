/// <reference path="../deno.d.ts" />

/** Converts GraphQL Introspection query to Typescript types
 * Author: Jeremy Travis
 * deno run --allow-read --allow-write --allow-env --allow-net mod.ts
 * OR
 * gql-ts.cmd -f schema.json -o schema.ts -n
 * gql-ts.cmd -e http://localhost:62830/graphql -o schema.ts -c
 * gql-ts -e http://localhost:57225/graphql -o cradle.ts -c -s '[{\"key\":\"char\",\"value\":\"string\"}]'
 */

// import { readFileStr, writeFileStr } from "https://deno.land/std@v1.0.1/fs/mod.ts";
// import { readFileStr, writeFileStr } from "../../deno-1.0.1/std/fs/mod.ts";

// Due to SSL proxy, had to download the github branch with tag: v1.0.1
import { readFileStr } from "../../deno-1.0.1/std/fs/read_file_str.ts";
import { writeFileStr } from "../../deno-1.0.1/std/fs/write_file_str.ts";
import IntrospectionQuery from "./introspection-query.ts";
import { TypeElement } from "./introspection-schema.d.ts";

if (Deno.version.deno !== "1.0.1") console.log(`[WARN] Your DENO version ${Deno.version.deno} may not be supported. Supported version is: 1.0.1.`);

let typeMapping = [] as { key: string, value: string }[];
addCustomScalar("Byte", "number");
addCustomScalar("Decimal", "number");
addCustomScalar("Float", "number");

// == options section
let fileIn = "";
let fileOut = "./schema.ts";
let addNull = false;
let addIPrefix = true;
let buildClasses = false;
let namespace = "";
let endpoint = "";

/**
 * -f   file path to schema.json
 * -o   file path to output
 * -n   include null option on members. Default false
 * -i   prefix interfaces with I. Default true, setting this will turn off!
 * -c   creates classes that implendments interfaces. Default false
 * -e   GraphQL Introspection endpoint
 * -s   adds custom Scalar types
 */
let argIdx = 0;
Deno.args.forEach((arg: string) => {
    switch (arg) {
        case "-f":
            fileIn = Deno.args[argIdx + 1];
            break;
        case "-o":
            fileOut = Deno.args[argIdx + 1];
            break;
        case "-n":
            addNull = true;
            break;
        case "-i":
            addIPrefix = false;
            break;
        case "-c":
            buildClasses = true;
            addNull = true;
            break;
        case "-e":
            endpoint = Deno.args[argIdx + 1];
            break;
        case "-s":
            try {
                //TODO: Only working in this format: "[{\"key\":\"char\",\"value\":\"string\"}]"
                let scalarObj = JSON.parse(Deno.args[argIdx + 1]) as { key:string, value:string }[];

                if (typeof(scalarObj) === "object") {
                    scalarObj.forEach(i => {
                        addCustomScalar(i.key, i.value);
                    });
                }
                
            } catch (error) {
                console.error(error);
            }
            break;
        case "-h":
        case "-?":
            console.log("\nusage: gql-ts.cmd [option]\n");
            console.log("  -f       file path to schema.json");
            console.log("  -o       file path to output");
            console.log("  -n       include null option to members. [default = false]");
            console.log("  -i       prefix interfaces with I. [default = true].");
            console.log("  -c       creates classes that implendments interfaces. [default = false]");
            console.log("  -e       graphql introspection endpoint");
            console.log("  -s       adds custom Scalar types");
            console.log("  -h | -?  help\n");
            console.log( "Examples:\n gql-ts -e http://localhost/graphql -o schema.ts -c\n");
            console.log( " gql-ts -f schema.json -o schema.ts -n\n");
            break;
    }
    argIdx += 1;
});


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
function addCustomScalar(key: string, value: string) {
    typeMapping.push({key, value});
}

/** Builds the Interface and Class types
 * @param introspection Introspection query json object
 * @returns a string output
 */
function TypesBuilder(introspection: any): string {
    let sb = "";
    let tab = "    ";
    let sbClass = "";

    if (namespace.trim() !== "")
        sb += `export declare namespace ${namespace} {\n`

    introspection.data["__schema"].types.forEach((t: TypeElement) => {
        if (t.name.startsWith("Query")) {
            //console.log(t.fields);
            t.fields.forEach(f => {
                //if (f.name === "aboutServer" || f.name === "groupPager") {
                    if (f.type.kind === "OBJECT") {
                        // build class header
                        sbClass += `/**${f.description}*/\n`;
                        sbClass += `export class ${f.name} extends `;
                        sbClass += f.type.name + " {\n";
                        if (f.args.length === 0) {
                            sbClass += tab + "constructor() {\n";
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
                            sbClass += tab + `constructor(${args.join(", ")}) {\n`;
                        }
                        sbClass += tab + tab + "super();\n";
                        sbClass += tab + "}\n}\n";
                    }
                //}
            })
        }

        if (!t.name.startsWith("__", 0)) {// && t.name.indexOf('AboutServer') > -1) {

            // Check for missing Scalar and warn
            if (t.kind === "SCALAR") {
                if (getType(t.name) === "any") 
                    console.warn("[WARN] missing scalar mapping: " + t.name);
            }

            if (t.kind === "OBJECT") {
                // build class header
                sbClass += `/**${t.description}*/\n`;
                sbClass += `export class ${t.name} implements `;
                sbClass += addIPrefix ? "I" : "";
                sbClass += t.name + " {\n";

                //build interface header
                sb += `/**${t.description}*/\n`;
                sb += "export interface ";
                sb += addIPrefix ? "I" : "";
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
                        body += addIPrefix ? ": I" : ": ";
                        body += f.type.name;
                    }
                    else if (f.type.kind === "LIST") {
                        if (f.type.ofType.kind === "SCALAR")
                            body += ": " + getType(f.type.ofType.name) + "[]";
                        if (f.type.ofType.kind === "OBJECT") {
                            body += addIPrefix ? ": I" : ": ";
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

                    if (addNull && f.type.kind !== "NON_NULL")
                        body += " | null";

                    body += ";\n";
                });

                sb += body + "}\n";
                // mend together; header + constructor + body
                sbClass += con + tab + "}\n" + body + "}\n";

                //add class to main stringbuilder
                if (buildClasses) {
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

    if (namespace !== "")
        sb += "}"

    return sb;
}


// == Code begins
typeMapping.push({ key: "ID", value: "string | number" });
typeMapping.push({ key: "String", value: "string" });
typeMapping.push({ key: "DateTime", value: "string | Date" });
typeMapping.push({ key: "Boolean", value: "boolean" });
typeMapping.push({ key: "Int", value: "number" });

if (fileIn.trim() !== "" && fileOut.trim() !== "") {
    //Deno.open(fileIn,).then(file => { });
    readFileStr(fileIn)
        .then((res: string) => {
            let obj = JSON.parse(res);
            let str = TypesBuilder(obj);
            writeFileStr(fileOut, str);
        })
        .catch((err: any) => {
            console.log(err);
        });
}
else if (endpoint.trim() !== "" && fileOut.trim() !== "") {
    let qry = IntrospectionQuery();

    fetch(endpoint, {
        method: "POST",
        cache: "no-cache",
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(qry)
    }).then( async (resp) => { 
        let txt = await resp.text();
        try {
            let obj = JSON.parse(txt);
            let str = TypesBuilder(obj);
            if (fileOut.trim() !== "") {
                writeFileStr(fileOut, str);
            }
        } catch (err) {
            console.error(err);
            console.log(txt);
        }
    }).catch(err => {
        console.error(err);
    });
}