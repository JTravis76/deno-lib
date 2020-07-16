/**
 * Able to overload the "variables" functions due to one of the parameters using a rest operator
 */

interface Array<T> extends ArrayConstructor {
    select(filter: Function): Array<T>;
}


export interface GraphQLBase {

}

export interface IQueryable extends GraphQLBase {
    /** starts a Query object
     * @param type Class type
     * @param name Operation name
     */
    query<T>(type: new (...args: any[]) => T, name: string): ISelectable<T>;

    /** starts a Mutation statement 
     * @param type Class type
     * @param name operation name
    */
   mutation<T>(type: new (...args: any[]) => T, name: string): ISelectable<T>;
}

export interface ISelectable<T> extends GraphQLBase {
    /** GraphQL object to send to server */
    gql: IGraphQlQuery;

    /** starts an Selectable object */
    select(func: Function): ISelectable<T>;

    /** Add variables to query/mutation 
     * @param args array of variables
     * @example .variables(1, 10, "searchText")
    */
    variables(...args: any[]): ISelectable<T>;

    /** Add 'strong-typed' variables to query/mutation 
     * @param obj object of type TParam
     * @example .variables<ClassParams>({ page: 1, pagesize: 10, search: "searchText" })
    */
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