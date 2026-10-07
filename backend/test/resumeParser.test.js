import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { extractResumeText } from '../src/services/resumeParser.js';

test('DOCX parser extracts paragraph text for analysis', async () => {
  const archive = new JSZip();
  archive.file(
    'word/document.xml',
    '<?xml version="1.0"?><w:document xmlns:w="word"><w:body><w:p><w:r><w:t>React engineer</w:t></w:r></w:p><w:p><w:r><w:t>Built accessible interfaces</w:t></w:r></w:p></w:body></w:document>'
  );
  const buffer = await archive.generateAsync({ type: 'nodebuffer' });

  const text = await extractResumeText({ originalname: 'resume.docx', buffer });

  assert.equal(text, 'React engineer Built accessible interfaces');
});

test('resume parser rejects files with unsupported extensions or signatures', async () => {
  await assert.rejects(
    extractResumeText({ originalname: 'resume.txt', buffer: Buffer.from('JavaScript') }),
    /valid PDF or DOCX/
  );
});
