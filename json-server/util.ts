/** Read json text file and parse into object */
export function getJsonObj(path: string) {
  const content = Deno.readFileSync(path);
  const decoder = new TextDecoder("utf-8");
  return JSON.parse(decoder.decode(content));
}

/** Gets current date/time */
export function dateNow(): string {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${d.toLocaleTimeString('en-US')}`;
}

/** Convert Blob to Base64
 * @returns Promise<string>
 */
export function blobToBase64(data: Uint8Array) {
  return new Promise((resolve) => {
    // == Using FileReader to create a DataUrl
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(new Blob([data]));
  })
}

/** Converts URL Search Parameters to an object */
export function parseUrlSearch(params: URLSearchParams) {
  return {
    id: params.has("id") ? params.get("id") : null,
    doc: params.has("doc") ? params.get("doc") : null,
    vApp: params.has("vApp") ? params.get("vApp") : null,
    fileName: params.has("fileName") ? params.get("fileName") : null,
    savedQuery: params.has("savedQuery") ? params.get("savedQuery") : null,
    ticketuid: params.has("oslc.where") ? params.get("oslc.where")?.replace("ticketuid=", "") : null
  };
}