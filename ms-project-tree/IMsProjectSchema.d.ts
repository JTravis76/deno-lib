export interface IMsProjectSchema {
  Project: {
    PropertyGroup: {
      ProjectTypeGuids: {
        _text: string;
      },
      RootNamespace: {
        _text: string;
      },
      TargetFrameworkVersion: {
        _text: string;
      },
    }[],
    ItemGroup: {
      Reference: {
        _attributes: {
          Include: string;
        },
        HintPath: {
          _text: string;
        }
      }[];
    }[];
  }
}