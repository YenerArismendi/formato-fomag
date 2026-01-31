const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/data/defaultFields.js');

try {
  // Read current file
  const fileContent = fs.readFileSync(targetPath, 'utf8');
  // Extract JSON part
  const jsonMatch = fileContent.match(/export const defaultFields = (\[[\s\S]*?\]);/);
  
  if (!jsonMatch) {
    throw new Error("Could not find defaultFields array in file.");
  }
  
  let fields = JSON.parse(jsonMatch[1]);
  let modifiedCount = 0;

  fields = fields.map(field => {
    const nameLower = field.name.toLowerCase().trim();
    
    // 1. Cotizante Fields & Observaciones
    if (nameLower.includes('atención cotizante') || nameLower.includes('atencion cotizante') || nameLower.includes('observaciones')) {
      modifiedCount++;
      return {
        ...field,
        section: 'cotizante',
        beneficiaryIndex: undefined,
        groupId: undefined, // Clear false grouping
        groupLabel: undefined
      };
    }
    
    // 2. Beneficiary Attention Fields
    // Regex to match "atención beneficiario X"
    const benMatch = nameLower.match(/atención beneficiario (\d+)/) || nameLower.match(/atencion beneficiario (\d+)/);
    if (benMatch) {
      const index = parseInt(benMatch[1]);
      modifiedCount++;
      return {
        ...field,
        section: 'beneficiario',
        beneficiaryIndex: index,
        groupId: undefined,
        groupLabel: undefined
      };
    }

    return field;
  });

  const newContent = `export const defaultFields = ${JSON.stringify(fields, null, 2)};\n`;
  fs.writeFileSync(targetPath, newContent);
  
  console.log(`Fix complete. Updated metadata for ${modifiedCount} fields.`);

} catch (err) {
  console.error("Error fixing fields:", err);
}
