
const fs = require('fs');

const targetPath = '/home/yener/Escritorio/formato-fomag/src/data/defaultFields.js';
const content = fs.readFileSync(targetPath, 'utf8');

// Match the array
const arrayMatch = content.match(/export const defaultFields = (\[[\s\S]*?\]);/);
if (!arrayMatch) throw new Error("No array found");

const cleanJson = arrayMatch[1].replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
const originalFields = JSON.parse(cleanJson);

// The split point: "Municipio labora" is the last cotizante field.
// "Cónyuge" is the first beneficiary field.
const splitIndex = originalFields.findIndex(f => f.name === "Municipio labora") + 1;

const cotizanteFields = originalFields.slice(0, splitIndex).map(f => ({
  ...f,
  section: 'cotizante',
  beneficiaryIndex: undefined
}));

// Template is the block that starts with "Cónyuge"
// We'll calculate the size of one block by looking for where the next block would start (if it exists)
// or just using the remaining fields if we only have one block now.
// However, since the last run might have added garbage, let's just find the first "Cónyuge" to "correo electronico" set.
const templateStart = splitIndex;
const templateEnd = originalFields.findIndex((f, i) => i > templateStart && f.name.includes("correo electronico")) + 1;
const template = originalFields.slice(templateStart, templateEnd).map(f => {
    // Basic cleanup: remove index suffixes from name and id if they were already there
    return {
        ...f,
        id: String(f.id).split('_b')[0],
        name: f.name.replace(/\s\d+$/, '')
    };
});

const generateBeneficiary = (index, yOffset) => {
  return template.map(f => ({
    ...f,
    id: `${f.id}_b${index}`,
    name: `${f.name} ${index}`,
    y: f.y + yOffset,
    beneficiaryIndex: index,
    section: 'beneficiario',
    groupId: f.groupId ? `${f.groupId}_${index}` : undefined,
    groupLabel: f.groupLabel ? `${f.groupLabel} ${index}` : undefined
  }));
};

const beneficiaries = [];
for (let i = 1; i <= 6; i++) {
  beneficiaries.push(...generateBeneficiary(i, (i - 1) * 230));
}

const finalFields = [
  ...cotizanteFields,
  ...beneficiaries
];

const finalContent = `export const defaultFields = ${JSON.stringify(finalFields, null, 2)};\n`;
fs.writeFileSync(targetPath, finalContent);
console.log(`Reconstructed fields: ${cotizanteFields.length} cotizante, ${beneficiaries.length} total beneficiary fields.`);
