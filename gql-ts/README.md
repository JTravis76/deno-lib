# GraphQL Introspection to Typescript Types
GQL-TS is a GraphQL to TypeScript conversion. Reads directly from a `schema.json` or from a GraphQL endpoint. 


> **NOTE:** this is for Introspection Query _ONLY_!!

## Permissions
* --allow-read
* --allow-write
* --allow-env
* --allow-net

## Deno Example
If you like to use the GQL-TS CLI, see next section.

First, create a Typescript file in your project and copy the content below. Be sure to adjust the properties to your spec.

```ts
import GQLTS from "https://raw.githubusercontent.com/JTravis76/deno-lib/master/gql-ts/mod.ts";

let gqlts = new GQLTS();
gqlts.Endpoint = "http://localhost:57225/graphql";
gqlts.SchemaFile = "";
gqlts.Class = true;
gqlts.Interface = true;
gqlts.Nullable = true;
gqlts.OutFile = "C:\\WebApp1\\src\\schema.ts";
gqlts.AddScalar("char", "string");
gqlts.AddScalar("Float", "number");

gqlts.Execute();
```

## Running the CLI
```
deno run --allow-read --allow-write --allow-env --allow-net cli.ts

deno run --allow-read --allow-write --allow-env --allow-net cli.ts -f schema.json -o schema.ts
```

Or use the CLI

```cmd
usage: gql-ts.cmd [option]

  -f  file path to schema.json
  -o  file path to output
  -n  include null option to members. [default = false]
  -i  prefix interfaces with I. [default = true].
  -c  creates classes that implendments interfaces. [default = false]
  -e  graphql introspection endpoint
  -h  help

Examples:
 gql-ts -e http://localhost/graphql -o schema.ts -c

 gql-ts -f schema.json -o schema.ts -n
```

## Issues & Bugs

When using nuget EntityGraph v0.60, the generated introspection schema has a bug.

> !! This was corrected in version 0.64.0 as of 2020-09-15

The following schema snippet, the introspection is showing a `NON_NULL` type for sdgCount. The problem is that the sub type; `FLOAT` is not considered an `OBJECT` but a `SCALAR`.  


```json
{
    "name":"sdgCount",
    "description":"",
    "args":[],
    "type":
    {
        "kind":"NON_NULL",
        "name":null,
        "ofType":
        {
            "kind":"OBJECT",
            "name":"Float",
            "ofType":null
        }
    },
    "isDeprecated":false,
    "deprecationReason":""
}
```