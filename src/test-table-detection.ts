import { detectMultipleTableFormats } from './utils/tableDetection';

// Test the specific table that wasn't being detected
const testTable = `| Time of Day | Sentiment Score (1-10) | Sentiment Category | Description |
|-----------------|------------------------|---------------------|---------------------------------------------------------|
| Early Morning | 8 | Positive | Energetic promos and enthusiastic calls to action kick off the weekend. |
| Mid-Morning | 9 | Strongly Positive | Highest engagement with lively interactive segments promoting Shoprite deals. |
| Early Afternoon | 6.5 | Positive to Neutral | Sentiment softens; mix of deal reminders and responsible messaging. |
| Late Afternoon | 5 | Neutral | Campaign intensity drops; straightforward deal information with less enthusiasm. |`;

// Test detection
const result = detectMultipleTableFormats(testTable);

console.log('Table detection result:', result);

if (result) {
  console.log('✅ Table detected successfully!');
  console.log('Headers:', result.headers);
  console.log('Rows:', result.rows.length);
  console.log('First row:', result.rows[0]);
} else {
  console.log('❌ Table not detected');
}

export { testTable };
