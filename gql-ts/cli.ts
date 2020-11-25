/** Converts GraphQL Introspection query to Typescript types
 * Author: Jeremy Travis
 * deno run --allow-read --allow-write --allow-env --allow-net mod.ts
 * OR
 * gql-ts.cmd -f schema.json -o schema.ts -n
 * gql-ts.cmd -e http://localhost:62830/graphql -o schema.ts -c
 * gql-ts -e http://localhost:57225/graphql -o foo.ts -c -s '[{\"key\":\"char\",\"value\":\"string\"}]'
 */

import IntrospectionQuery from "./introspection-query.ts";
import { addScalar, TypesBuilder } from "./ts-builder.ts";

if (Deno.version.deno !== "1.3.3") console.log(`[WARN] Your DENO version ${Deno.version.deno} may not be supported. Supported version is: 1.3.3.`);

// == options section
let fileIn = "";
let fileOut = "./schema.ts";
let addNull = false;
let addIPrefix = true;
let buildClasses = false;
let endpoint = "";
const namespace = "";

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
                const scalarObj = JSON.parse(Deno.args[argIdx + 1]) as { key:string, value:string }[];

                if (typeof(scalarObj) === "object") {
                    scalarObj.forEach(i => {
                        addScalar(i.key, i.value);
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




// == Code begins
addScalar("ID", "string | number");
addScalar("String", "string");
addScalar("DateTime", "string | Date");
addScalar("Boolean", "boolean");
addScalar("Int", "number");

if (fileIn.trim() !== "" && fileOut.trim() !== "") {
    Deno.readTextFile(fileIn)
        .then((res: string) => {
            const opt = {
                namespace: namespace,
                buildClasses: buildClasses,
                addIPrefix: addIPrefix,
                addNull: addNull
            };
            const obj = JSON.parse(res);
            const str = TypesBuilder(obj, opt);
            Deno.writeTextFile(fileOut, str);
        })
        // deno-lint-ignore no-explicit-any
        .catch((err: any) => {
            console.log(err);
        });
}
else if (endpoint.trim() !== "" && fileOut.trim() !== "") {
    const qry = IntrospectionQuery();

    fetch(endpoint, {
        method: "POST",
        cache: "no-cache",
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(qry)
    }).then( async (resp) => { 
        const txt = await resp.text();
        try {
            const opt = {
                namespace: namespace,
                buildClasses: buildClasses,
                addIPrefix: addIPrefix,
                addNull: addNull
            };
            const obj = JSON.parse(txt);
            const str = TypesBuilder(obj, opt);
            if (fileOut.trim() !== "") {
                Deno.writeTextFile(fileOut, str);
            }
        } catch (err) {
            console.error(err);
            console.log(txt);
        }
    }).catch(err => {
        console.error(err);
    });
}