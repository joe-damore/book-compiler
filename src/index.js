const app = require('../package.json');

const docxMerger = require('docx-merger');
const path = require('path');
const fs = require('fs');
const http = require('http');
const sanitize = require('sanitize-filename');
const pdfMerge = require('easy-pdf-merge');

const contentDisposition = require('content-disposition');
const request = require('request-promise');

const main = async function() {
  const ids = [
  ];

  const docBuffers = [];
  const format = 'pdf';

  const dlPromises = ids.map(async (id, index) => {
    const num = index + 1;
    const url = `https://docs.google.com/document/u/0/export?format=${format}&id=${id}`;

    let response = null;
    try {
      response = await request({
        method: 'GET',
        uri: url,
        encoding: null,
        resolveWithFullResponse: true,
      });
    }
    catch (err) {
      console.log("FAILED to download " + url);
      return;
    }

    const disposition = response.headers['content-disposition'];
    const parsed = contentDisposition.parse(disposition);

    const filename = `${num}--${sanitize(parsed.parameters.filename)}`;

    const outDir = path.resolve(process.cwd(), 'dl');
    const outPath = path.resolve(outDir, filename);

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const buf = Buffer.from(response.body, 'base64');

    docBuffers.push({
      index: index,
      path: outPath,
      buffer: buf,
    });

    return await fs.promises.writeFile(outPath, buf);
  });

  await Promise.all(dlPromises);

  const sortFunction = (a, b) => {
    return (a.index - b.index);
  }

  const mergedSortedBuffers = docBuffers.sort(sortFunction)
    .map((input) => {
      return input.path;
    });

  let pageNumber = 1;
  mergedSortedBuffers.forEach((pdfPath) => {

  });

  const outputFile = path.resolve(process.cwd(), 'dl', `merged-output.${format}`);
  pdfMerge([...mergedSortedBuffers], outputFile, (err) => {
    if (err) {
      console.log(outputFile);
      console.log("ERROR OCCURRED");
      //console.log(err);
      return;
    }
    console.log("Done!");
  });
}

// Entry
main();
