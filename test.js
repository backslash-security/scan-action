

console.log(process.env);
console.log(process.env.test)
console.log(JSON.stringify(process.env.test))

const Table = require('cli-table3');

const table = new Table();


const fs = require('fs');
const path = require('path');

// Assuming the context file is mounted at /app/context.json
const contextPath = path.join(__dirname, 'context.json');

try {
  const rawData = fs.readFileSync(contextPath, 'utf-8');
  const context = JSON.parse(rawData);
  console.log('Received context:', context);

  // Access specific context properties
  const actor = context.actor;
  const repository = context.repository;
  
  // Use the context data in your application logic here
} catch (error) {
  console.error('Error reading context file:', error);
}


const row = [
    { content: 'Text Link', href: 'https://www.example.com' },
    'Help',
    'http://example.org'
];
table.push(row);

console.log(table.toString());