import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Reuse the real sample's peaks without repeating 48KB of SVG paths in each
// language/theme snapshot. Audio and its provenance remain unchanged.
const recording=JSON.parse(await fs.readFile('src/studio/listeningSample.json','utf8'));
const trace=channel=>recording.channels[channel].peaks.map((peak,i)=>{
 const x=(i/(recording.channels[channel].peaks.length-1)*1000).toFixed(2),height=Math.min(37,peak/recording.waveformScale*37);
 return `M${x} ${(40-height).toFixed(2)}L${x} ${(40+height).toFixed(2)}`;
}).join(' ');
const svg=`<svg xmlns="http://www.w3.org/2000/svg"><defs>${['original','heart','lung'].map(id=>`<path id="${id}" d="${trace(id)}"/>`).join('')}</defs></svg>`;
const filename=`listening-waveforms-${createHash('sha256').update(svg).digest('hex').slice(0,12)}.svg`;
await fs.writeFile('public/assets/'+filename,svg);
const manifest=JSON.parse(await fs.readFile('src/studio/criticalAssets.json','utf8'));
manifest.sampleWaveforms='/assets/'+filename;
await fs.writeFile('src/studio/criticalAssets.json',JSON.stringify(manifest,null,2)+'\n');
console.log(filename);
