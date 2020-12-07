import IntrospectionQuery from "./introspection-query.ts";
import { addScalar, TypesBuilder } from "./ts-builder.ts";

/** GraphQL to Typescript conversion class */
export class GQLTS {
    constructor() {
        this.Class = false;
        this.Endpoint = "";
        this.Headers = {};
        this.Interface = true;
        this.Nullable = false;
        this.OutFile = "./schema.ts";
        this.SchemaFile = "";
        this.Namespace = "";
    }
    public Headers: { [key: string]: string }
    public OutFile: string;
    public Endpoint: string;
    public SchemaFile: string;
    public Interface: boolean;
    public Class: boolean;
    public Nullable: boolean;
    public Namespace: string;

    // deno-lint-ignore no-explicit-any
    public AddScalar(name: any, value: any): void {
        addScalar(name, value);
    }
    public Execute(): void {
        addScalar("ID", "string | number");
        addScalar("String", "string");
        addScalar("DateTime", "string | Date");
        addScalar("Boolean", "boolean");
        addScalar("Int", "number");

        if (this.SchemaFile === null) this.SchemaFile = "";
        if (this.OutFile === null) this.OutFile = "";
        if (this.Endpoint === null) this.Endpoint = "";

        if (this.SchemaFile.trim() !== "" && this.OutFile.trim() !== "") {
            Deno.readTextFile(this.SchemaFile)
                .then((res: string) => {
                    const opt = {
                        namespace: this.Namespace,
                        buildClasses: this.Class,
                        addIPrefix: this.Interface,
                        addNull: this.Nullable
                    };
                    const obj = JSON.parse(res);
                    const str = TypesBuilder(obj, opt);
                    Deno.writeTextFile(this.OutFile, str);
                })
                // deno-lint-ignore no-explicit-any
                .catch((err: any) => {
                    console.log(err);
                });
        }
        else if (this.Endpoint.trim() !== "" && this.OutFile.trim() !== "") {
            const qry = IntrospectionQuery();

            fetch(this.Endpoint, {
                method: "POST",
                cache: "no-cache",
                headers: {
                    'Content-Type': 'application/json',
                    ...this.Headers
                },
                credentials: 'include',
                body: JSON.stringify(qry)
            }).then( async (resp) => { 
                const txt = await resp.text();
                try {
                    const opt = {
                        namespace: this.Namespace,
                        buildClasses: this.Class,
                        addIPrefix: this.Interface,
                        addNull: this.Nullable
                    };
                    const obj = JSON.parse(txt);
                    const str = TypesBuilder(obj, opt);
                    if (this.OutFile.trim() !== "") {
                        Deno.writeTextFile(this.OutFile, str);
                    }
                } catch (err) {
                    console.error(err);
                    console.log(txt);
                }
            }).catch(err => {
                console.error(err);
            });
        }
    }
}

export default GQLTS;
