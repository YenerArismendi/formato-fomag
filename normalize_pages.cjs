const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/data/defaultFields.js');

try {
  const content = fs.readFileSync(targetPath, 'utf8');
  
  // Extract JSON array
  const match = content.match(/export const defaultFields = (\[[\s\S]*?\]);/);
  if (!match) throw new Error("Could not find array in defaultFields.js");
  
  const fields = JSON.parse(match[1]);
  
  // Constants based on PDF analysis
  // PDF Height: 1295.45
  // PDF Width: 915.692
  // Render Width: 800
  // Scale: 800 / 915.692 = 0.873656
  // Scaled Height: 1295.45 * 0.873656 = 1131.78
  
  const PAGE_HEIGHT = 1130; // Using slightly conservative threshold
  
  let movedCount = 0;
  
  const normalizedFields = fields.map(field => {
    // Only process if currently page 0 (or undefined) and y is large
    if ((field.page === 0 || field.page === undefined) && field.y > PAGE_HEIGHT) {
      movedCount++;
      return {
        ...field,
        page: 1,
        y: field.y - PAGE_HEIGHT
      };
    }
    return field;
  });
  
  const newContent = `export const defaultFields = ${JSON.stringify(normalizedFields, null, 2)};\n`;
  fs.writeFileSync(targetPath, newContent);
  
  console.log(`Normalized complete. Moved ${movedCount} fields to Page 2.`);
  
} catch (err) {
  console.error("Error normalizing fields:", err);
}
