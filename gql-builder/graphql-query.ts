import { IGraphQlQuery } from "./types.d.ts";

export default class GraphQlQuery implements IGraphQlQuery {
    constructor() {
        this.query = "";
        this.variables = null;
        this.operationname = "";
    }
    public query: string | null;
    public variables: any | null;
    public operationname: string | null;
}