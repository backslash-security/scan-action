const Table = require('cli-table3');

const table = new Table();

const row = [
    { content: 'Text Link', href: 'https://www.example.com' },
    'Help',
    'http://example.org'
];
table.push(row);

console.log(table.toString());