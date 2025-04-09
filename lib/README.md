# pathofexile-dat

This package can be used as a library to read game files,
or as a command line tool to extract them.

## Exporting data

1. Install the package globally:

```
> npm install --global pathofexile-dat
```

2. Create a directory to store the exported data.
Create a `config.json` in it:

```jsonc
{
  // Don't copy lines starting with // as this will cause an error

  // Game data will be downloaded from PoE update servers.
  // Latest version can be found by visiting https://raw.githubusercontent.com/poe-tool-dev/latest-patch-version/main/latest.txt
  // Remove if you want to use Steam installation directory.
  "patch": "3.25.3.7",

  // Self-explanatory. Not required if you have provided "patch" above.
  "steam": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile",

  // Files to export
  "files": [
    // exported as-is
    "metadata/items/item.it",
    "Metadata/StatDescriptions/stat_descriptions.csd"

    // images from sprites are exported as PNG
    // you will need to install ImageMagick for this to work
    "Art/2DArt/UIImages/InGame/InventorySquare",

    // dds files are exported as PNG too
    "Art/2DItems/Maps/Atlas2Maps/New/Base14UberBlighted.dds"
  ],

  // Add this field if you don't want to export Tables in all available languages.
  "translations": ["English", "Russian"],

  // Tables to export
  // Names and columns can be explored here https://github.com/poe-tool-dev/dat-schema/tree/main/dat-schema
  "tables": [
    {
      "name": "BaseItemTypes",
      "columns": [
        "Id",
        "Name",
        "IsCorrupted"
      ]
    },
    {
      "name": "ItemClasses",
      "columns": ["Id"]
    }
  ]
}
```

3. _(Optional step)._ If you're exporting images, you will need to install ImageMagick.

```
# on Windows
# don't forget to restart your terminal, so that it is available in the PATH.
winget install ImageMagick
# on Linux
sudo apt install imagemagick
```

4. Open a terminal, so that your working directory is the one you created in step 2. Run `pathofexile-dat`

```
C:\..\my_export_dir> pathofexile-dat
Loading bundles index...
Loading schema for dat files
Exporting table "Data/BaseItemTypes"
Exporting table "Data/ItemClasses"
```
