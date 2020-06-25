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
    mutation<T>(type: { new(): T }, name: string): ISelectable<T> {
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
    private arguments: Array<string>;
    
    constructor(type: T, gql: GraphQlQuery) {
        this._gql = gql;
        this._type = type;
        this.funcString = "";
        this.arguments = new Array<string>();
    }

    get gql(): GraphQlQuery {
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
     * @param args String array of variables. EX: "$p1:Int", "$p2:String"
     * TODO: add better strong-typing support
     * TODO: variable needs (3) items; name, type, and value
    */
    variables(...args: string[]): ISelectable<T> {
        // if (this._gql.variables === null) this._gql.variables = {};
        // let vari = [] as string[];
        // args.forEach(a => {
        //     let d1 = a.split(";");
        //     vari.push(d1[0]);
        //     let d2 = d1[0].split(":");
        //     let p = JSON.parse(`{"${d2[0]}":"${d1[1]}"}`);

        //     Object.assign(this._gql.variables, p);
        // });
        // do the work when asking for object: this._gql.query = this._gql.query.replace(this._gql.operationname, this._gql.operationname + `(${vari.join(",")})`);
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
                console.warn("[WARN] missing parameters");
            }
        }
    }
    return new Array<string>();
}

export default QueryContext;