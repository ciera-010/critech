import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeImage,safeUrl,validate,selectProducts} from './content-lib.js';
const data = JSON.parse(readFileSync(new URL('./content.json',import.meta.url)));
assert.equal(validate(data),data);
assert.equal(selectProducts(data).length,1);
assert.equal(selectProducts(data,'사주')[0].name,'야화기방');
assert.equal(selectProducts(data,'뷰티').length,0);
for (const url of ['javascript:alert(1)','data:text/html,test','http://example.com','https://user:secret@example.com']) assert.equal(safeUrl(url),'');
assert.equal(safeUrl('https://gibang.kr/main'),'https://gibang.kr/main');
const invalid = structuredClone(data);invalid.products[0].url='javascript:alert(1)';assert.throws(() => validate(invalid));
const missing = structuredClone(data);missing.products[0].url='';assert.throws(() => validate(missing));
const badTag=structuredClone(data);badTag.products[0].tags=[null];assert.throws(()=>validate(badTag));
console.log('PASS: schema, published products, category filtering, unsafe URLs and required links');

assert.equal(safeImage('data:image/jpeg;base64,/9j/AA=='),'data:image/jpeg;base64,/9j/AA==');
for (const value of ['data:image/svg+xml;base64,PHN2Zz4=', 'data:text/html;base64,AA==', 'data:image/jpeg;base64,<>', 'data:image/jpeg;base64,'+'A'.repeat(200000)]) assert.equal(safeImage(value),'');
const uploaded = structuredClone(data); uploaded.products[0].image = 'data:image/jpeg;base64,/9j/AA=='; assert.equal(validate(uploaded),uploaded);
console.log('PASS: uploaded image validation and unsafe image rejection');
