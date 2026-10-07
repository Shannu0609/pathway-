import { PDFParse } from 'pdf-parse';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

const extractDocxText = async (buffer) => {
  const archive = await JSZip.loadAsync(buffer);
  const documentXml = archive.file('word/document.xml');
  if (!documentXml || documentXml._data.uncompressedSize > 10 * 1024 * 1024) {
    throw new Error('DOCX document content is missing or too large.');
  }

  const xml = await documentXml.async('string');
  const document = new XMLParser({
    ignoreAttributes: true,
    removeNSPrefix: true,
    trimValues: true,
    textNodeName: '#text'
  }).parse(xml);

  const collectText = (node) => {
    if (!node || typeof node !== 'object') return [];
    return Object.entries(node).flatMap(([key, value]) => {
      if (key === 't') {
        const text = value && typeof value === 'object' ? value['#text'] : value;
        return typeof text === 'string' ? [text] : [];
      }
      return collectText(value);
    });
  };

  return collectText(document).join(' ');
};

export const extractResumeText = async (file) => {
  const extension = file.originalname.split('.').pop()?.toLowerCase();

  if (extension === 'pdf' && file.buffer.subarray(0, 4).toString() === '%PDF') {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (extension === 'docx' && file.buffer.subarray(0, 2).toString() === 'PK') {
    return extractDocxText(file.buffer);
  }

  throw new Error('Upload a valid PDF or DOCX resume.');
};
