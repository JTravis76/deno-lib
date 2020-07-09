interface Array<T> extends ArrayConstructor {
    select(filter: Function): Array<T>;
}


export interface GraphQLBase {

}

export interface IQueryable extends GraphQLBase {
    /** Builds a GraphqlQL query object
     * @param type Class object
     * @param name Operation name
     */
    query<T>(type: { new(): T }, name: string): ISelectable<T>;
}

export interface ISelectable<T> extends GraphQLBase {
    /** GraphQL object to send to server */
    gql: IGraphQlQuery;
    /** starts an Selectable object */
    select(func: Function): ISelectable<T>;
    /** Add variables to query/mutation 
     * @param args array of variables
    */
    variables(...args: any[]): ISelectable<T>;
    variables2<TParams>(obj: TParams): ISelectable<T>;
    /** Add parameters to query/mutation */
    args(...params: any[]): ISelectable<T>;
}

export interface IGraphQlQuery {
    query: string | null;
    variables: any | null;
    operationname: string | null;
}

export type GraphQLResult<T> = {
    errors: any[];
    data: T;
}