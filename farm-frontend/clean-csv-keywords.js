const fs = require('fs');
const path = require('path');

// Read the CSV data
const csvPath = path.join(__dirname, '../farm-pipeline/data/farm_descriptions.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Function to clean keywords from CSV content
function cleanKeywordsFromCSV(content) {
  // Remove keyword annotations that start with *(Keywords: and end with )*
  return content.replace(/\*\(Keywords:[^)]*\)\*/g, '');
}

// Clean the CSV content
const cleanedContent = cleanKeywordsFromCSV(csvContent);

// Write back the cleaned data
fs.writeFileSync(csvPath, cleanedContent);

console.log(`✅ Cleaned keywords from CSV file`);
console.log(`📁 Updated: ${csvPath}`);
