import { IQueryable, ISelectable, GraphQLResult } from "./types.d.ts";
import { parseField } from "./parse-field.ts";
import GraphQlQuery from "./graphql-query.ts";

export class QueryContext implements IQueryable {
    private _gql: GraphQlQuery;
    constructor() {
        this._gql = new GraphQlQuery();
    };

    /** starts an Query statement 
     * @param type class type
     * @param name operation name
    */
    //query<T>(type: { new(): T }, name: string): ISelectable<T> { <= this option will not work with Classes that has params in constructor
    query<T>(type: new (...args: any[]) => T, name: string): ISelectable<T> {
        this._gql.query = `query ${name}{`;
        this._gql.operationname = name;

        // get type of T
        //const type = typeof(TCtor);

        return new Selectable<T>(new type(), this._gql);
    };

    /** starts an Mutation statement 
     * @param name operation name
    */
    mutation<T>(type: new (...args: any[]) => T, name: string): ISelectable<T> {
        this._gql.query = `mutation ${name}{`;
        this._gql.operationname = name;

        return new Selectable<T>(new type(), this._gql);
    };

    /** Execute GraphQL Query object */
    public execute<T = any>(gql: GraphQlQuery): Promise<T> {
        // return new Promise((resolve, reject) => {

        //     // let request = new XMLHttpRequest();
        //     // request.open("POST", "http://jeremytravis.azurewebsites.net/api/graphql");
        //     // request.setRequestHeader("Accept", "application/json");
        //     // request.setRequestHeader("Content-Type", "application/json");
        //     // request.send(JSON.stringify(gql));

            return fetch("http://jeremytravis.azurewebsites.net/api/graphql", {
                method: "POST",
                cache: "no-cache",
                mode: "no-cors",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gql)
            }).then(async (resp) => {
                let txt = await resp.text();
                let res = {} as GraphQLResult<any>;
                try {
                    //resolve(JSON.parse(txt));
                    res = JSON.parse(txt) as GraphQLResult<any>;
                }
                catch (e) {
                    return txt;
                }

                //=Get property name, then return just that object
                let root = Object.getOwnPropertyNames(res.data)[0];
                return res.data[root];

            }).catch(err => {
                return err;
            });
    };
}

class Selectable<T> implements ISelectable<T> {
    private _gql: GraphQlQuery;
    private _type: T;
    private funcString: string;
    private arguments: Array<any>;
    
    constructor(type: T, gql: GraphQlQuery) {
        this._gql = gql;
        this._type = type;
        this.funcString = "";
        this.arguments = new Array<any>();
    }

    get gql(): GraphQlQuery {
        //= Variables
        if (this._gql.variables !== null && this._gql.query !== null && this._gql.operationname !== null) {
            let s = "";

            Object.keys(this._gql.variables).forEach(k => {
                if (s.length > 0) s += ",";

                if (this._gql.variables[k] === null) {
                    //TODO: instead of using constructor, should use property members
                    s += `$${k}:String`;
                }
                if (typeof(this._gql.variables[k]) === "number") {
                    s += `$${k}:Int`;
                }
                if (typeof(this._gql.variables[k]) === "string") {
                    s += `$${k}:String`;
                }
                // !! use the key for the argument params, NOT the value, those are stored in the variable object
                this.arguments.push("$" + k);
            });

            this._gql.query = this._gql.query.replace(this._gql.operationname?.toString(), this._gql.operationname?.toString() + `(${s})`);
        }

        //= Build argument list, if any
        this.arguments = getArguments(this._type, this.arguments);

        //= add main query field name
        if (this.arguments.length > 0)
            this._gql.query += `${nameOf(this._type)}(${this.arguments.join(",")}){`;
        else
            this._gql.query += `${nameOf(this._type)}{`;

        this._gql.query += parseField(this.funcString) + "}";

        return this._gql;
    }

    /** Add variables to query/mutation 
     * @param args array of variables.
    */
    variables(...args: any[]): ISelectable<T> {
        if (this._gql.variables === null) this._gql.variables = {};

        let idx = 1;
        args.forEach(a => {
            this._gql.variables[`p${idx}`] = a;
            idx += 1;
        });
        return this;
    }
    variables2<TParam>(obj: TParam): ISelectable<T> {
        if (this._gql.variables === null) this._gql.variables = {};
    
        // take the key pair and build out variables
        Object.keys(obj).forEach(s => {
            let o = obj as unknown as any;
            this._gql.variables[s] = o[s];
        });

        return this;
    }

    /** starts an Selectable object */
    select(func: Function): ISelectable<T> {
        isFunction(func);
        this.funcString = func.toString();
        return this;
    }

    args(...params: any[]): ISelectable<T> {
        this.arguments = params;
        return this;
    }
}

//Array.prototype.gqlSelect = function(){}

function isFunction(func: any) {
    if (func === undefined || func === null || typeof func !== "function")
        throw new Error("[parameter] must be of type function that return a selectable object.");
}

function nameOf(object: Object): string {
    if (object.hasOwnProperty("__type")) {
        let o = object as any;
        return o.__type;
    }
    return object.constructor.name;
}
function getArguments(object: Object, params: any[]): Array<string> {
    if (params.length > 0) {
        let str = object.constructor.toString();
        let regex1 = RegExp(/constructor\(.+\)/, "gi");
        let r = regex1.exec(str);
        if (r !== null) {
            str = r[0].replace(/\s+/g, "").replace("constructor", "").replace("(", "").replace(")", "").trim();
            let arr = str.split(",");
            let a = new Array<string>();
            let idx = 0;
            if (arr.length === params.length) {
                arr.forEach(i => {
                    let type = typeof(params[idx]);

                    if (type === "string") {
                        if (params[idx].startsWith("$")) { //<- is it a variables??
                            a.push(`${i}:${params[idx]}`);
                        }
                        else
                             a.push(`${i}:"${params[idx]}"`);   
                    }
                    else if (type === "number" || type === "boolean") {
                        a.push(`${i}:${params[idx]}`);
                    }
                    else if (type === "object") {
                        a.push(`${i}:null`);
                    }
                    idx += 1;
                });
                return a;
            }
            else {
                console.warn("[WARN] incorrect list of parameters");
            }
        }
    }
    return new Array<string>();
}

export default QueryContext;