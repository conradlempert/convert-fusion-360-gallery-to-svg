# convert-fusion-360-gallery-to-svg

This is a tool for converting data from the [Fusion 360 Gallery reconstruction dataset](https://github.com/AutodeskAILab/Fusion360GalleryDataset/blob/master/docs/reconstruction.md) to SVG.

## How to use

1. Download the dataset here: https://fusion-360-gallery-dataset.s3.us-west-2.amazonaws.com/reconstruction/r1.0.1/r1.0.1.zip

2. Put the r1.0.1 in the root folder of this repo like this:

<img src="https://github.com/user-attachments/assets/3e6f5188-e7eb-4c23-a0a8-e3a85c79c4d4" width="200"/>

3. To start the conversion, run this in the root folder of the repo:

```
npm i
npx ts-node convertToSvg.ts
```
