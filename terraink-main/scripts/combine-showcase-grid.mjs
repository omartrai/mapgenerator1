import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const projectRoot = process.cwd();
const showcaseDir = path.join(projectRoot, "public", "assets", "showcase");
const outputNames = ["showcase_1.png", "showcase_2.png"];
const columns = 3;
const rows = 2;
const maxImages = columns * rows;
const gap = 0;
const cellWidth = 900;
const cellHeight = 1273;
const background = { r: 245, g: 241, b: 235, alpha: 1 };

async function getInputFiles() {
  const entries = await readdir(showcaseDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(
      (name) =>
        name.toLowerCase().endsWith(".png") &&
        !outputNames.includes(name),
    )
    // Prefer numeric ordering for files like 1.png ... 12.png.
    .sort((left, right) => {
      const leftNumber = Number.parseInt(path.parse(left).name, 10);
      const rightNumber = Number.parseInt(path.parse(right).name, 10);

      if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
        return leftNumber - rightNumber;
      }

      return left.localeCompare(right);
    });
}

async function buildCompositeInputs(fileNames) {
  const composites = [];

  for (let index = 0; index < fileNames.length; index += 1) {
    const fileName = fileNames[index];
    const inputPath = path.join(showcaseDir, fileName);
    const column = index % columns;
    const row = Math.floor(index / columns);
    // Map each item index into a fixed grid slot.
    const left = gap + column * (cellWidth + gap);
    const top = gap + row * (cellHeight + gap);

    const imageBuffer = await sharp(inputPath)
      .resize(cellWidth, cellHeight, {
        fit: "contain",
        background,
      })
      .png()
      .toBuffer();

    composites.push({
      input: imageBuffer,
      left,
      top,
    });
  }

  return composites;
}

async function main() {
  const fileNames = await getInputFiles();
  if (fileNames.length === 0) {
    throw new Error("No PNG files were found in public/assets/showcase.");
  }

  const canvasWidth = columns * cellWidth + (columns + 1) * gap;
  const canvasHeight = rows * cellHeight + (rows + 1) * gap;

  for (let batchIndex = 0; batchIndex < outputNames.length; batchIndex += 1) {
    // Batch 0 = images 1-6 -> showcase_1, batch 1 = images 7-12 -> showcase_2.
    const start = batchIndex * maxImages;
    const batch = fileNames.slice(start, start + maxImages);
    if (batch.length === 0) {
      continue;
    }

    const composites = await buildCompositeInputs(batch);
    const outputBuffer = await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background,
      },
    })
      .composite(composites)
      .png()
      .toBuffer();

    const outputPath = path.join(showcaseDir, outputNames[batchIndex]);
    await sharp(outputBuffer).toFile(outputPath);
    console.log(`Created ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
