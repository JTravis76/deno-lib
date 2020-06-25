/// <reference path="../deno.d.ts" />
import {assert, fail, assertEquals} from "../../deno-1.0.1/std/testing/asserts.ts"; //"https://deno.land/std/testing/asserts.ts";
import { User, Roles, aboutServer, groupPager } from "./_testdata.ts";
import { QueryContext } from "./mod.ts";

//TODO: acorn throw error when parsing `Roles: x.Roles?.some((z: Roles) => {` due to the question mark
//TODO: using Array.some() as just a Call Expression to help identified that new set of objects starts, like to one of prototype below

// interface Array<T> extends ArrayConstructor {
//     select(selector: Function): any[];
// }

// Array.prototype.select = function(selector: Function): any[] {
//     return new Array<any>();
// };

Deno.test("build complex nested GQL query", () => {
    const db = new QueryContext();

    let gql = db.query(User,"GetUserRoles")
        .select((x: User) => { 
            return { 
                First: x.Firstname,
                Lastname: x.Lastname,
                Name: x.Department.Name,
                CreatedBy: x.Department.Created,
                Roles: x.Roles.some((z: Roles) => {
                    return {
                        Name: z.Name,
                        CreatedBy: z.CreatedBy,
                        IsActive: z.App.Active,
                        appName: z.App.Appname
                    };
                })
            }
        })
        .gql;

    // console.log("\n" + gql.query);

    assert(gql.query !== null, "query is null");    
    assertEquals(gql.query, "query GetUserRoles{User{First:Firstname,Lastname,Roles{Name,CreatedBy,App{IsActive:Active,appName:Appname}},Department{Name,CreatedBy:Created}}}", "Invalid query");
});

//= !! Make sure to await all promises returned from Deno APIs before
Deno.test("[Intergration] Fetch simple query", async (): Promise<void> => {
    const db = new QueryContext();
    let gql = db.query(aboutServer, "aboutServer")
        .select((x: aboutServer) => {
            return {
                version: x.version,
                versionDate: x.versionDate
            }
        })
        .gql;

    await db.execute<aboutServer>(gql)
        .then(d => {
            assertEquals(d.version, "1.0.0.0", "incorrect version date");
        }).catch(err => {
            fail(err);
        });
});

//= !! Make sure to await all promises returned from Deno APIs before
Deno.test("[Intergration] Fetch query with arguments", async (): Promise<void> => {
    const db = new QueryContext();
    let gql = db.query(groupPager, "groupPager")
        .select((x: groupPager) => {
            return {
                total: x.total,
                pageCount: x.pageCount
            }
        })
        .args(1,10,"soft")
        .gql;

    await db.execute<groupPager>(gql)
        .then(d => {
            assert(d.total !== null, "query results are null");
            assert(d.total > 0, "no records were returned");
            assertEquals(d, { total: 1, pageCount: 1 }, "returned object is not expected");
        }).catch(err => {
            fail(err);
        });
});