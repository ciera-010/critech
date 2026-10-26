import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeImage,safeUrl,validate,selectProducts} from './content-lib.js';
const data = JSON.parse(readFileSync(new URL('./content.json',import.meta.url)));
assert.equal(validate(data),data);
const visible={name:'공개',published:true,tags:['사주']},hidden={name:'비공개',published:false,tags:['뷰티']};
const fixture={products:[visible,hidden]};
assert.deepEqual(selectProducts(fixture),[visible]);
assert.deepEqual(selectProducts(fixture,'사주'),[visible]);
assert.deepEqual(selectProducts(fixture,'뷰티'),[]);
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

for (const [imageX,imageY,imageFit] of [[0,100,'cover'],[100,0,'contain'],[50,50,'cover']]) { const positioned=structuredClone(data);Object.assign(positioned.products[0],{imageX,imageY,imageFit});assert.equal(validate(positioned).products[0].imageX,imageX); }
for (const field of [{imageX:-1},{imageY:101},{imageX:'50'},{imageFit:'invalid'}]) { const invalid=structuredClone(data);Object.assign(invalid.products[0],field);assert.throws(()=>validate(invalid)); }
const legacy=structuredClone(data);delete legacy.products[0].imageX;delete legacy.products[0].imageY;delete legacy.products[0].imageFit;validate(legacy);assert.equal(legacy.products[0].imageX,50);assert.equal(legacy.products[0].imageY,50);assert.equal(legacy.products[0].imageFit,'cover');
console.log('PASS: image position bounds, fit modes and legacy defaults');

const webp='data:image/webp;base64,UklGRg=='; assert.equal(safeImage(webp),webp); const webpProduct=structuredClone(data);webpProduct.products[0].image=webp;assert.equal(validate(webpProduct),webpProduct);assert.equal(safeImage('data:image/webp;base64,'+'A'.repeat(200000)),'');console.log('PASS: WebP upload validation and size limit');
