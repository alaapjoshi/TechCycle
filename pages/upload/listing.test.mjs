import test from 'node:test';
import assert from 'node:assert/strict';
import { createListing } from './listing.mjs';
test('uploads once, waits for its URL, then writes the selected condition and URL',async()=>{
 const calls=[];
 const result=await createListing({image:'local-image',title:'Battery',condition:'Good',price:'12'}, {
 uploadImage:async uri=>{calls.push(['upload',uri]);await Promise.resolve();return 'https://example.test/own-image';},
 saveDocument:async fields=>{calls.push(['save',fields]);return {id:'new-listing'};}});
 assert.equal(calls.length,2);assert.equal(calls[0][0],'upload');assert.equal(calls[1][0],'save');
 assert.deepEqual(calls[1][1],{title:'Battery',condition:'Good',price:'12',imageURL:'https://example.test/own-image'});assert.equal(result.id,'new-listing');
});
test('failed image upload or missing download URL never creates a listing',async()=>{
 for(const uploadImage of [async()=>{throw Error('upload failed');},async()=>undefined]){
 let saved=false;await assert.rejects(createListing({image:'local'}, {uploadImage,saveDocument:async()=>{saved=true;}}));assert.equal(saved,false);
 }
});
test('Firestore failure propagates so the UI cannot report success',async()=>{
 await assert.rejects(createListing({image:'local'}, {uploadImage:async()=>'https://example.test/image',saveDocument:async()=>{throw Error('write denied');}}),/write denied/);
});
