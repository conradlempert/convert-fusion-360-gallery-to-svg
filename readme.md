# convert-fusion-360-gallery-to-svg

This is a tool for converting data from the Fusion 360 Gallery dataset to SVG.

## How to use

1. Download the dataset here: https://fusion-360-gallery-dataset.s3.us-west-2.amazonaws.com/reconstruction/r1.0.1/r1.0.1.zip

(More info on the dataset: https://github.com/AutodeskAILab/Fusion360GalleryDataset/blob/master/docs/reconstruction.md)

To start the conversion, run this in the root folder of the repo:

```
npm i
npx ts-node convertToSvg.ts
```
