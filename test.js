const Table = require('cli-table3');

const table = new Table();

const process = require('process');

console.log(process.env.GITHUB_REF)
console.log(process.env)
const arguments = process.argv.slice(2); // Skip the first two elements (script name and path)

console.log('Arguments:', arguments);

const row = [
    { content: 'Text Link', href: 'https://www.example.com' },
    'Help',
    'http://example.org'
];
table.push(row);

console.log(table.toString());