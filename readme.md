# convert-fusion-360-gallery-to-svg

## Download the SVGs

If you simply want to download the SVGs, **follow this link: [output.zip](https://github.com/conradlempert/convert-fusion-360-gallery-to-svg/blob/master/output.zip)** (and then press download on the top right)

Note: According to the license of the original dataset, you are only allowed to use this for non-commercial research purposes. [More details](https://github.com/AutodeskAILab/Fusion360GalleryDataset/blob/master/LICENSE.md)

## General info

![Screenshot 2025-03-06 at 21 34 36](https://github.com/user-attachments/assets/a4731293-b962-4c5d-9e52-82ec9e20c1b7)

This is a tool for converting data from the [Fusion 360 Gallery reconstruction dataset](https://github.com/AutodeskAILab/Fusion360GalleryDataset/blob/master/docs/reconstruction.md) to SVG.

It also groups the data by keywords.

## How to convert to SVGs yourself

1. Clone this repository
2. Download the dataset here: https://fusion-360-gallery-dataset.s3.us-west-2.amazonaws.com/reconstruction/r1.0.1/r1.0.1.zip
3. Extract the zip

4. Put the r1.0.1 in the root folder of this repository like this:

<img src="https://github.com/user-attachments/assets/3e6f5188-e7eb-4c23-a0a8-e3a85c79c4d4" width="200"/>

5. To start the conversion, run this in the root folder of the repository:

```
npm i
npx ts-node convertToSvg.ts
```

6. The result is in the `output` folder.
