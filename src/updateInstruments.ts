import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { promisify } from 'util';
import { pipeline } from 'stream';
import AdmZip from 'adm-zip';

const pipelineAsync = promisify(pipeline);

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await axios.get(url, { responseType: 'stream' });
  const writer = fs.createWriteStream(outputPath);
  await pipelineAsync(response.data, writer);
}

async function extractZip(zipPath: string, outputDir: string): Promise<string[]> {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(outputDir, true);
  return zip.getEntries().map(entry => entry.entryName);
}

async function processTextFile(filePath: string): Promise<any[]> {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length < 2) return []; // Need at least header + one row

  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const record: any = {};
    headers.forEach((header, index) => {
      record[header] = values[index]?.trim() || '';
    });
    return record;
  });
}

async function updateInstruments() {
  try {
    const urls = [
      'https://api.shoonya.com/NFO_symbols.txt.zip',
      'https://api.shoonya.com/NSE_symbols.txt.zip',
      'https://api.shoonya.com/BSE_symbols.txt.zip'
    ];

    const buildDir = path.join(__dirname, 'build');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // Download and process each file
    const allRecords: any[] = [];
    
    for (const url of urls) {
      const fileName = path.basename(url);
      const zipPath = path.join(buildDir, fileName);
      const tempDir = path.join(buildDir, 'temp');
      
      //console.log(`Downloading ${fileName}...`);
      await downloadFile(url, zipPath);
      
      //console.log(`Extracting ${fileName}...`);
      const extractedFiles = await extractZip(zipPath, tempDir);
      
      // Process each extracted file
      for (const extractedFile of extractedFiles) {
        if (extractedFile.endsWith('.txt')) {
          const filePath = path.join(tempDir, extractedFile);
          //console.log(`Processing ${extractedFile}...`);
          const records = await processTextFile(filePath);
          allRecords.push(...records);
          
          // Clean up extracted file
          fs.unlinkSync(filePath);
        }
      }
      
      // Clean up zip file and temp directory
      fs.unlinkSync(zipPath);
      fs.rmdirSync(tempDir);
    }

    // Group by exchange
    const groupedData: Record<string, any[]> = {};
    allRecords.forEach(record => {
      const exchange = record.Exchange || '';
      if (!groupedData[exchange]) {
        groupedData[exchange] = [];
      }
      groupedData[exchange].push(record);
    });

    // Save to JSON
    const outputPath = path.join(__dirname, 'merged_instruments.json');
    await fs.promises.writeFile(outputPath, JSON.stringify(groupedData, null, 2));
    
    //console.log(`Successfully created ${outputPath}`);
    return groupedData;
  } catch (error) {
    console.error('Error updating instruments:', error);
    throw error;
  }
}

// Run the update
updateInstruments().catch(console.error);

export { updateInstruments };