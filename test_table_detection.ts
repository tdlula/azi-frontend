import { detectMultipleTableFormats, hasTableData } from './src/utils/tableDetection';

// Test data with markdown table format
const testData = `Here is the analysis you requested:

| Product/Brand | Air Times | Programme/Show | Frequency (Count of Mentions) | Sentiment Summary | Radio Station |
|----------------------------|-------------|------------------------------|------------------------------|---------------------------------------------------------------------------------|---------------|
| Shoprite general brand | 09:40 | Not specified | Multiple mentions (~20) | Positive: Quality and good price, "respecting our pockets", "make the weekend extra" | Metro FM |
| Dorsland Braaiwors | 09:40 | Not specified | Multiple mentions | Positive: Emphasized as "literally R84.99 per kg", suitable for braai | Metro FM |
| Farm Best Fresh Chicken | 08:44 / 09:40 | Not specified | Multiple mentions | Positive: Mentioned with a free spice pack, part of affordable braai pack | Metro FM, Gagasi FM |

This is the complete data analysis for the period.`;

console.log('Testing table detection...');
console.log('Has table data:', hasTableData(testData));

const parsed = detectMultipleTableFormats(testData);
if (parsed) {
  console.log('Parsed table:');
  console.log('Title:', parsed.title);
  console.log('Headers:', parsed.headers);
  console.log('Rows:', parsed.rows.length);
  console.log('First row:', parsed.rows[0]);
} else {
  console.log('No table detected');
}

// Test CSV format
const csvData = `Product,Air Time,Station
Shoprite,09:40,Metro FM
Dorsland,09:40,Metro FM`;

console.log('\nTesting CSV detection...');
console.log('Has CSV table data:', hasTableData(csvData));

const csvParsed = detectMultipleTableFormats(csvData);
if (csvParsed) {
  console.log('CSV parsed table:');
  console.log('Headers:', csvParsed.headers);
  console.log('Rows:', csvParsed.rows);
}

export {};
