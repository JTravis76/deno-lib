import { serve, serveTls } from "https://deno.land/std@0.120.0/http/server.ts";
import MEDIA_TYPES, { IMediaType } from "./media-types.ts";
// import { postRoute } from "./post.ts";
import { parseUrlSearch, blobToBase64 } from "./util.ts";

const hostname = "192.168.1.213";
const port = 9091;//7071;
const sslport = 44391;
const certFile = "./localhostcert.pem";
const keyFile = "./localhostkey.pem";

console.log(`\n Listening on %chttp://${hostname}:${port}/ \n`, "color: yellow;");

// const redirectPage = '<!DOCTYPE html><html><head><meta charset="utf-8" /><meta http-equiv="refresh" content="0; url=http://localhost:8080/login" /><title></title></head><body></body></html>';

const headers = new Headers();
headers.append("Access-Control-Allow-Origin", "*");
headers.append("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, SessionId, Token, Referrer, maxauth");
headers.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");

serve(async (req) => {
  //console.log(`${req.headers.get("origin")} -- ${req.headers.get("user-agent")}`);

  // == Clear any existing content-type
  if (headers.has("Content-Type")) headers.delete("Content-Type");
  if (headers.has("Content-Length")) headers.delete("Content-Length");
  if (headers.has("Cache-Control")) headers.delete("Cache-Control");
  if (headers.has("maxauth")) headers.delete("maxauth");
  if (headers.has("Access-Control-Expose-Headers")) headers.delete("Access-Control-Expose-Headers");

  const url = new URL(req.url);
  //url.pathname = url.pathname.replace("/maximo/oslc/os", "/API");

  // include project directory
  //url.pathname = url.pathname.replace("/api", "/PermittingTool");

  // == Get query string data
  const params = parseUrlSearch(url.searchParams);
  // == Remove any params since we parsed it above
  if (url.pathname.indexOf("?") > -1) {
    url.pathname = url.pathname.substring(0, url.pathname.indexOf("/"));
  }
  // == Fetch data by selected value
  if (params.id !== null) url.pathname += `-${params.id}`;
  if (params.savedQuery !== null) url.pathname += `-${params.savedQuery}`;
  //if (params.ticketuid !== null) url.pathname += `-${params.ticketuid}`;

  // // == Get payload from body
  // let payload = {};
  // if (req.bodyUsed) {
  //   const body = await req.text();
  //   try {
  //     payload = JSON.parse(body);
  //   } catch (_error) {
  //     // Do nothing
  //   }
  // } else {
  //   // catch all by converting params to object body
  //   payload = {
  //     doc: params.doc,
  //   };
  // }

  // == Are we fetching a document via API endpoint??
  let base64 = false;
  if (url.pathname.indexOf('/DocumentDownloadBase64?') > -1) {
    url.pathname = `/static/documents/${params.doc}`;
    base64 = true;
  } else if (url.pathname.indexOf('/DocumentDownload?') > -1) {
    url.pathname = `/static/documents/${params.doc}`;
  } else if (url.pathname === "/api/GetFile" && params.vApp && params.fileName) {
    url.pathname = `/static/${params.vApp?.replaceAll("_", "/")}/${params.fileName}`;
    base64 = true;
  }


  // == Read file and process a Response
  let response = new Response(null, { status: 500, statusText: "Internal Server Error", headers });
  switch (req.method) {
    case "OPTIONS":
      response = new Response(null, { status: 201, statusText: "No Content", headers });
      break;
    case "GET":
      {
        let ext = "";

        // == Root Site
        if (url.pathname === "/") {
          headers.append("Content-Type", MEDIA_TYPES["html"]);
          // response = new Response(redirectPage, { status: 200, headers });
          response = new Response("<h2>Site is running</h2>\n", { status: 200, headers });
        } else if (url.pathname.lastIndexOf(".") > -1) {
          const pathParts = url.pathname.split(".");
          if (pathParts.length > 0) {
            ext = `${pathParts[pathParts.length - 1]}`;
          }
        } else {
          // == Append URL with JSON to read from (File System) datastore
          ext = "json";
          url.pathname += ".json";
        }

        // == If has extension, read a file and return some data
        if (ext !== "") {
          try {
            const data = Deno.readFileSync(`.${url.pathname}`);

            if (base64) {
              const res = await blobToBase64(data) as string;
              headers.append("Content-Type", MEDIA_TYPES["txt"]);
              response = new Response(res, { status: 200, headers });
            } else {
              // == Handled all other responses
              headers.append("Content-Type", MEDIA_TYPES[ext as keyof IMediaType]);
              response = new Response(data, { status: 200, headers });
            }
          } catch (_error) {
            console.log(`%c404 (Not Found): ${url.pathname}`, "color: red;");
            response = new Response(null, { status: 404, statusText: "Not Found" });
          }
        }

        break;
      }


    // // == If has extension, read a file and return some data
    // if (ext !== "") {}
    //   try {
    //     const data = Deno.readFileSync(`.${url.pathname}`);

    //     if (base64) {
    //       const res = await blobToBase64(data) as string;
    //       headers.append("Content-Type", MEDIA_TYPES["txt"]);
    //       response = new Response(res, { status: 200, headers });
    //     } else if (url.pathname === "/oauth.aspx") {
    //       /* NOTE!! Cannot set cookie outside the original domain then attempt to redirect
    //        * The redirected site will NOT have access to the created cookie */
    //       const cookie = {
    //         active: 2,
    //         expires: "2025-12-31T02:08:35.793",
    //         sessionId: "20d00da3-e9fb-4e1b-84f6-7c42eaf8f544",
    //         token: "bdb8af9c-7373-4b53-8d74-83cea3e61061"
    //       };
    //       headers.append("Set-Cookie", `ecomm=${JSON.stringify(cookie)}`);
    //       headers.append("Content-Type", MEDIA_TYPES["html"]);
    //       headers.append("Location", "http://localhost:8080/login");

    //       response = new Response(data, { status: 200, headers });

    //     } else if (url.pathname.toLowerCase() === "/api/document.json") {
    //       // == Edit the Document.json before sending
    //       const decoder = new TextDecoder("utf-8");
    //       const extType = doc ? doc.split('.') : "";
    //       const jsonObj = JSON.parse(decoder.decode(data)) as { url: string, type: string };
    //       jsonObj.url = `http://${hostname}:${port}/resources/static/documents/${doc}`;
    //       jsonObj.type = extType[extType.length - 1];

    //       headers.append("Content-Type", MEDIA_TYPES["json"]);
    //       response = new Response(JSON.stringify(jsonObj), { status: 200, headers });

    //     } else if (url.pathname === "/api/ResourceCenter/SearchResults.json") {
    //       const decoder = new TextDecoder("utf-8");
    //       let jsonObj = JSON.parse(decoder.decode(data)) as { experience: number, longdesc: string }[];
    //       if (experience !== null && experience.trim() !== "") {
    //         jsonObj = jsonObj.filter((x) => x.experience.toString().includes(experience));
    //       } else if (keyword !== null) {
    //         jsonObj = jsonObj.filter((x) => x.longdesc.includes(keyword));
    //       }

    //       headers.append("Content-Type", MEDIA_TYPES[ext as keyof IMediaType]);
    //       response = new Response(JSON.stringify(jsonObj), { status: 200, headers });

    //     } else if (url.pathname === "/api/ResourceCenter/Keywords.json") {
    //       const decoder = new TextDecoder("utf-8");
    //       let jsonObj = [] as string[];
    //       if (keyword !== null) {
    //         jsonObj = JSON.parse(decoder.decode(data)) as string[];
    //         jsonObj = jsonObj.filter((x) => x.toLocaleLowerCase().includes(keyword.toLowerCase()));
    //       }

    //       headers.append("Content-Type", MEDIA_TYPES[ext as keyof IMediaType]);
    //       response = new Response(JSON.stringify(jsonObj), { status: 200, headers });

    //     } else if (url.pathname === "/api/StripeAccountUrl.json") {
    //       const StripePay = getJsonObj("./api/StripePay.json");
    //       StripePay.stripeAccounts.forEach((x: any) => {
    //         if (x.division === "F" && x.stripeApplicationStatus === "incomplete") {
    //           x.stripeApplicationStatus = "inprogress";
    //         }
    //       });
    //       Deno.writeTextFileSync("./api/StripePay.json", JSON.stringify(StripePay));
    //       headers.append("Content-Type", MEDIA_TYPES["txt"]);
    //       response = new Response(data, { status: 200, headers });
    //     } else {
    //       // == Handled all other responses
    //       headers.append("Content-Type", MEDIA_TYPES[ext as keyof IMediaType]);
    //       response = new Response(data, { status: 200, headers });
    //     }
    //   } catch (error) {
    //     console.log(`%c404 (Not Found): ${url.pathname}`, "color: red;");
    //     response = new Response(null, { status: 404, statusText: "Not Found" });
    //   }
    // }
    // break;
    case "POST":
      {
        //console.log(url.pathname);
        if (url.pathname.includes("/authenticate")) {
          headers.append("Access-Control-Expose-Headers", "maxauth");
          headers.append("maxauth", "SOMETOKEN");
          headers.append("Content-Type", MEDIA_TYPES["txt"]);
          response = new Response(null, { status: 200, headers });
        }

        if (url.pathname.includes("mxapisr")) {
          headers.append("Access-Control-Expose-Headers", "maxauth");
          headers.append("maxauth", "SOMETOKEN");
          headers.append("Content-Type", MEDIA_TYPES["json"]);

          let txt;
          if (url.pathname === "/API/mxapisr") {
            // POSTing a new Service Request
            // returns a "single" Result object
            txt = Deno.readFileSync(`.${url.pathname}/64516.json`);
          } else {
            txt = Deno.readFileSync(`.${url.pathname}.json`);
          }

          const decoder = new TextDecoder("utf-8");
          const data = JSON.parse(decoder.decode(txt));

          const str = JSON.stringify(data);
          headers.append("Content-Length", `${str.length}`);
          headers.append("Cache-Control", "no-transform"); // <- disable gzip compression
          response = new Response(str, { status: 200, headers });
          // response = Response.json(data, { status: 200, headers })
        }
        break;
      }
    // const res = await postRoute(url.pathname, payload);
    // headers.append("Content-Type", MEDIA_TYPES["json"]);

    default:
      break;
  }

  return response;
}, { port });

serveTls((req) => {
  console.log(req);
  return new Response(null, { status: 201, statusText: "No Content", headers });
}, { port: sslport, certFile, keyFile });