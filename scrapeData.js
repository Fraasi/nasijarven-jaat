const osmosis = require('osmosis');
const fs = require('fs');

let data = [];

osmosis
    .get('http://www.rauhaniemi.net/historia/jaiden-lahto/')
    .find('#tablepress-1 tr')
    .set({
        vuosi: '.column-1',
        lahto: '.column-2',
        jaatyminen: '.column-3'
    })
    .data(d => data.push(d))
    .done(d => {
        writeData();
    });

function writeData() {
    fs.writeFileSync('raw-data.js', 'var data = ');
    fs.appendFile('raw-data.js', JSON.stringify(data, null, 4), (err) => {
        if (err) throw err;
        console.log('\x1b[33m', 'Data was written to data.js.', '\x1b[0m');
    });
}
