import { xml2js } from "https://deno.land/x/xml2js@1.0.0/mod.ts";
import PROJECT_TYPES from "./projectTypes.ts";
import { IMsProjectSchema } from "./IMsProjectSchema.d.ts"

interface IProjectReference {
  location: string;
  type: string;
  namespace: string;
  framework: string;
  references: {
    include: string;
    hintPath: string | null;
  }[];
}

// const extList = ["config"];
const extList = ["csproj", "vbproj", "fsproj"]; //, "sqlproj", "vdproj"
const projectReferences = [] as IProjectReference[];

/**  */
function processProjectFile(fullpath: string) {
  const txtData = Deno.readTextFileSync(fullpath)
  const data = xml2js(txtData, {
    compact: true
  }) as unknown as IMsProjectSchema
  // console.log(data.Project.ItemGroup[0].Reference);

  const projectReference = {
    location: "",
    type: "",
    namespace: "",
    framework: "",
    references: [],
  } as IProjectReference;

  try {
    projectReference.location = fullpath;

    data.Project.PropertyGroup.forEach((grp) => {
      if (grp.ProjectTypeGuids) {
        projectReference.type = (grp.ProjectTypeGuids["_text"] as string).toUpperCase();
      }
      if (grp.RootNamespace) {
        projectReference.namespace = grp.RootNamespace["_text"] || "";
      }
      if (grp.TargetFrameworkVersion) {
        projectReference.framework = grp.TargetFrameworkVersion["_text"];
      }
    });

    if (Array.isArray(data.Project.ItemGroup[0].Reference)) {
      data.Project.ItemGroup[0].Reference.forEach((reference) => {
        // console.log(reference)//;
        projectReference.references.push({
          include: reference["_attributes"]["Include"],
          hintPath: reference["HintPath"] ? reference["HintPath"]["_text"] : null,
        });
      })
    } else {
      if (data.Project.ItemGroup[0].Reference) {
        projectReference.references.push({
          include: data.Project.ItemGroup[0].Reference["_attributes"]["Include"],
          hintPath: data.Project.ItemGroup[0].Reference["HintPath"] ? data.Project.ItemGroup[0].Reference["HintPath"]["_text"] : null,
        });
      }
    }

  } catch (error) {
    //console.log(data.Project.PropertyGroup[0]);
    throw(error);
  }

  projectReferences.push(projectReference);
}

function cleanProject(projectPath: string) {
  const workingPath = projectPath.substring(0, projectPath.lastIndexOf("/"));
  Deno.stat(`${workingPath}/bin`).then(() => {
    Deno.remove(`${workingPath}/bin`, { recursive: true });
  }).catch(() => {});

  Deno.stat(`${workingPath}/obj`).then(() => {
    Deno.remove(`${workingPath}/obj`, { recursive: true });
  }).catch(() => {});

  Deno.stat(`${workingPath}/.vs`).then(() => {
    Deno.remove(`${workingPath}/.vs`, { recursive: true });
  }).catch(() => {});

  Deno.stat(`${workingPath}/packages`).then(() => {
    Deno.remove(`${workingPath}/packages`, { recursive: true });
  }).catch(() => {});
}

// async function copyWebConfig(fullpath: string) {
//   const workingPath = fullpath.substring(0, fullpath.lastIndexOf("/"));
//   await Deno.mkdir(workingPath.replace("C:/Git/", "C:/Git/Test"), {recursive: true });
//   await Deno.copyFile(fullpath, fullpath.replace("C:/Git/", "C:/Git/Test"));
// }

/** Gets folder and files (that match the extension list) from a starting directory */
async function processDirectory(path: string) {
  for await (const dir of Deno.readDirSync(path)) {
    const fileParts = dir.name.split(".");
    const ext = fileParts[fileParts.length - 1];
  
    if (dir.isFile && extList.includes(ext)) {
      //cleanProject(`${path}/${dir.name}`);
      processProjectFile(`${path}/${dir.name}`);

      // if (!path.includes("/bin") && !path.includes("/packages")) {
      //   // console.log(`${path}/${dir.name}`);
      //   copyWebConfig(`${path}/${dir.name}`);
      // }
    } else if (dir.isFile && ext === "sln") {
      //cleanProject(`${path}/${dir.name}`);
    } else if (dir.isDirectory) {
      await processDirectory(`${path}/${dir.name}`);
    }
  }
}

/** Convert JSON to CSV file */
function json2csv(outpath: string) {
  let data = "location,type,project,namespace,framework,references,hintpath\n";
  // let data = "location,type,project,namespace,framework\n";

  projectReferences.forEach((proj) => {
    const fileParts = proj.location.split(".");
    const extension = fileParts[fileParts.length - 1];

    let projType = "";
    if (proj.type.includes("};{")) {
      proj.type.split(";").forEach((guid) => {
        projType += `${PROJECT_TYPES[guid as keyof {}]}/`;
      });

      // remove last character
      projType = projType.substring(0, projType.length -1);
    }

    data += `${proj.location},${projType},${extension},${proj.namespace},${proj.framework},"",""\n`;
    // proj.references.forEach((ref) => {
    //   data += `,,,,,"${ref.include}",${ref.hintPath ?? ""}\n`;
    // });
  });
  Deno.writeTextFileSync(outpath, data);
}


// processDirectory("./TestDir").then(() => json2csv("./TestDir/output.csv"));
// processDirectory("./TestDir").then(() => console.log("DONE"));