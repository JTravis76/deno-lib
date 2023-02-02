import { serve } from "https://deno.land/std@0.90.0/http/server.ts";
import { exists } from "https://deno.land/std@0.90.0/fs/mod.ts";
import { urlParse } from "https://deno.land/x/url_parse@1.0.0/mod.ts";
import MEDIA_TYPES, { IMediaType } from "./media-types.ts";
import { postRoute } from "./post.ts";

const hostname = "localhost";
const port = 44325;

const server = serve({ hostname, port });
console.log(`\n Listening on http://${hostname}:${port}/ \n`);

let headers = new Headers();
headers.append("Access-Control-Allow-Origin", "*");
headers.append("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, SessionId, Token, Referrer");
headers.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");

// const redirectPage = '<!DOCTYPE html><html><head><meta charset="utf-8" /><meta http-equiv="refresh" content="0; url=http://localhost:8080/login" /><title></title></head><body></body></html>';

for await (const req of server) {
  // == Clear any existing content-type
  if (headers.has("Content-Type")) headers.delete("Content-Type");

  // == Get query string data
  const params = urlParse(`http://${hostname}:${port}${req.url}`).searchParams;
  const dealerId = params.has("dealerId") ? params.get("dealerId") : null;
  const doc = params.has("doc") ? params.get("doc") : null;
  const experience = params.has("experience") ? params.get("experience") : null;
  const keyword = params.has("keyword") ? params.get("keyword") : null;
  const vApp = params.has("vApp") ? params.get("vApp") : null;
  const fileName = params.has("fileName") ? params.get("fileName") : null;
  const division = params.has("division") ? params.get("division") : null;
  const market = params.has("market") ? params.get("market") : null;

  // == Get payload from body
  let payload = {};
  const buf = await Deno.readAll(req.body);
  const decoder = new TextDecoder("utf-8");
  const txt = decoder.decode(buf);
  try {
    payload = JSON.parse(txt);
  } catch (error) {
    // do nothing
  }

  // == Shorten link by removing some of the base path
  req.url = req.url.replace("/Ford/FordLincolnEcomm/FESite", "");

  // == Are we fetching a document via API endpoint??
  let base64 = false;
  if (req.url.indexOf('/DocumentDownloadBase64?') > -1) {
    req.url = `/static/documents/${doc}`;
    base64 = true;
  } else if (req.url.indexOf('/DocumentDownload?') > -1) {
    req.url = `/static/documents/${doc}`;
  } else if (req.url.indexOf('/GetFile?') > -1) {
    req.url = `/resources/static/${vApp?.replaceAll("_", "/")}/${fileName}`;
    base64 = false;
  } else if (req.url.indexOf('/GetFile/') > -1) {
    // req.url += ".txt";
    base64 = true;
  }

  // == Remove any params since we parsed it above
  if (req.url.indexOf("?") > -1) {
    req.url = req.url.substr(0, req.url.indexOf("?"));
  }
  // == Fetch data by ID
  if (dealerId !== null) {
    req.url += `-${dealerId}`;
  }
  if (division !== null) {
    req.url += `-${division}`;
  }
  if (market !== null) {
    req.url += `-${market}`;
  }

  // console.log(req.method, req.url);

  if (req.method === "OPTIONS") {
    req.respond({ status: 201, headers });
  }
  if (req.method === "GET") {
    let ext = "";
    // == Root Site
    if (req.url === "/") {
      headers.append("Content-Type", MEDIA_TYPES["html"]);
      // req.respond({ body: redirectPage, status: 200, headers });
      req.respond({ body: "<h2>Site is running</h2>\n", status: 200, headers });
    } else if (req.url.lastIndexOf(".") > -1) {
      let s = req.url.split(".");
      if (s.length > 0) {
        ext = `${s[s.length - 1]}`;
      }
    } else {
      // == Append URL with JSON to read from (File System) datastore
      ext = "json";
      req.url += ".json";
    }

    // == If has extension, read a file and return some data
    if (ext !== "") {
      exists(`.${req.url}`).then(() => {
        const data = Deno.readFileSync(`.${req.url}`);
        if (base64) {
          // == Using FileReader to create a DataUrl
          const reader = new FileReader();
          reader.onload = (e) => {
            headers.append("Content-Type", MEDIA_TYPES["txt"]);
            if (e.target !== null && e.target?.result !== null) {
              req.respond({ body: e.target.result.toString(), status: 200, headers });
            } else {
              req.respond({ body: "", status: 200, headers });
            }
          }
          reader.readAsDataURL(new Blob([data]));

          // == Using Decoder to read Text file that contains Base64 string
          // const decoder = new TextDecoder("utf-8");
          // headers.append("Content-Type", MEDIA_TYPES[ext as keyof IMediaType]);
          // // console.log(decoder.decode(data));
          // req.respond({ body: decoder.decode(data), status: 200, headers });
        } else if (req.url.toLowerCase() === "/api/document.json") {
          // == Edit the Document.json before sending
          const decoder = new TextDecoder("utf-8");
          const extType = doc ? doc.split('.') : "";
          const jsonObj = JSON.parse(decoder.decode(data)) as { url: string, type: string };
          jsonObj.url = `http://${hostname}:${port}/resources/static/documents/${doc}`;
          jsonObj.type = extType[extType.length - 1];

          headers.append("Content-Type", MEDIA_TYPES["json"]);
          req.respond({ body: JSON.stringify(jsonObj), status: 200, headers });
        } else if (req.url === "/oauth.aspx") {
          /* NOTE!! Cannot set cookie outside the original domain then attempt to redirect
             The redirected site will NOT have access to the created cookie */
          const cookie = {
            active: 2,
            expires: "2025-12-31T02:08:35.793",
            sessionId: "20d00da3-e9fb-4e1b-84f6-7c42eaf8f544",
            token: "bdb8af9c-7373-4b53-8d74-83cea3e61061"
          };
          headers.append("Set-Cookie", `ecomm=${JSON.stringify(cookie)}`);
          headers.append("Content-Type", MEDIA_TYPES["html"]);
          headers.append("Location", "http://localhost:8080/login");
          req.respond({ body: data, status: 200, headers });
        } else if (req.url === "/api/ResourceCenter/SearchResults.json") {
          const decoder = new TextDecoder("utf-8");
          let jsonObj = JSON.parse(decoder.decode(data)) as { experience: number, longdesc: string }[];
          if (experience !== null && experience.trim() !== "") {
            jsonObj = jsonObj.filter((x) => x.experience.toString().includes(experience));
          } else if (keyword !== null) {
            jsonObj = jsonObj.filter((x) => x.longdesc.includes(keyword));
          }

          headers.append("Content-Type", MEDIA_TYPES[ext as keyof IMediaType]);
          req.respond({ body: JSON.stringify(jsonObj), status: 200, headers });
        } else if (req.url === "/api/ResourceCenter/Keywords.json") {
          const decoder = new TextDecoder("utf-8");
          let jsonObj = [] as string[];
          if (keyword !== null) {
            jsonObj = JSON.parse(decoder.decode(data)) as string[];
            jsonObj = jsonObj.filter((x) => x.toLocaleLowerCase().includes(keyword.toLowerCase()));
          }

          headers.append("Content-Type", MEDIA_TYPES[ext as keyof IMediaType]);
          req.respond({ body: JSON.stringify(jsonObj), status: 200, headers });
        } else {
          // == Handled all other responses
          headers.append("Content-Type", MEDIA_TYPES[ext as keyof IMediaType]);
          req.respond({ body: data, status: 200, headers });
        }
      }).catch(() => {
        console.log(`404 (Not Found): .${req.url}`);
        req.respond({ status: 404 });
      });
    }
  }
  if (req.method === "POST") {
    const res = await postRoute(req.url, payload);
    req.respond({
      headers,
      status: res.status,
      body: res.body,
    });
  }

}