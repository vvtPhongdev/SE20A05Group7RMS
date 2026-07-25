import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

async function run() {
  const file = 'D10_RT02_SRS_v2.0.docx';
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const relsXml = await zip.file('word/_rels/document.xml.rels').async('string');
  
  // Parse all relationships
  const rels = [...relsXml.matchAll(/<Relationship\s+Id="([^"]+)"\s+Type="([^"]+)"\s+Target="([^"]+)"/gi)];
  console.log(`Total relationships in target: ${rels.length}`);
  
  // Group by type or show those starting from rId1 to rId30
  console.log('Relationships rId1 to rId30 in target:');
  const filtered = rels.filter(r => {
    const num = parseInt(r[1].replace('rId', ''));
    return num <= 30;
  });
  
  for (const r of filtered) {
    console.log(` - ID: ${r[1]} -> Target: ${r[3]} (Type: ${path.basename(r[2])})`);
  }
}

run().catch(console.error);
