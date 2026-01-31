const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, 'raw_fields.json');
const targetPath = path.join(__dirname, 'src/data/defaultFields.js');

try {
  const content = fs.readFileSync(rawPath, 'utf8');
  const fields = JSON.parse(content);
  
  const PAGE_HEIGHT = 1132;
  const VISUAL_GAP = 32; // 2rem margin between pages
  const TOTAL_HEIGHT = PAGE_HEIGHT + VISUAL_GAP;
  
  let fixedCount = 0;
  
  const fixedFields = fields.map(field => {
    let pageIndex = field.page || 0;
    let relativeY = field.y;
    
    // Convert to Absolute Visual Y (Top of Page 0 = 0)
    // If on Page 1, add (Height + Gap)
    let absoluteVisualY = relativeY + (pageIndex * TOTAL_HEIGHT);
    
    // Normalize: Clamp to 0
    if (absoluteVisualY < 0) absoluteVisualY = 0;
    
    // Determine New Page
    // Page 0 ranges [0, PAGE_HEIGHT]
    // Gap [PAGE_HEIGHT, PAGE_HEIGHT + VISUAL_GAP] -> Should snap to nearest page?
    // Page 1 ranges [PAGE_HEIGHT + VISUAL_GAP, 2 * PAGE_HEIGHT + VISUAL_GAP]
    
    let newPage = Math.floor(absoluteVisualY / TOTAL_HEIGHT);
    
    // Calculate New Relative Y
    // Subtract (newPage * TOTAL_HEIGHT) from Absolute
    let newY = absoluteVisualY - (newPage * TOTAL_HEIGHT);
    
    // Correction: If newY falls into the gap area (e.g. > PAGE_HEIGHT), 
    // it technically belongs to the *end* of the previous page or *start* of next?
    // Visual logic: The gap is empty space. 
    // If it falls in gap area, let's push it to bottom of page.
    if (newY > PAGE_HEIGHT) {
       newY = PAGE_HEIGHT - 10; // Clamp to bottom
    }

    if (newPage !== pageIndex || Math.abs(newY - relativeY) > 0.1) {
      fixedCount++;
    }
    
    return {
      ...field,
      page: newPage,
      y: newY
    };
  });
  
  const newContent = `export const defaultFields = ${JSON.stringify(fixedFields, null, 2)};\n`;
  fs.writeFileSync(targetPath, newContent);
  
  console.log(`Geometry fix complete. Adjusted ${fixedCount} fields.`);
  
} catch (err) {
  console.error("Error fixing geometry:", err);
}
