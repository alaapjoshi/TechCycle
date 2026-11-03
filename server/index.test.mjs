import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createServer } from './index.mjs';
async function invoke(options, {url='/estimate', method='POST', data={description:'iPhone 11 battery'}, raw, headers={}}={}) {
  const server=createServer(options);
  const req=Readable.from([raw ?? JSON.stringify(data)]);
  Object.assign(req,{url,method,headers:{host:'127.0.0.1:3012','content-type':'application/json',...headers}});
  const response=await new Promise(resolve=>{
    const res={headers:{},setHeader(k,v){this.headers[k]=v;},writeHead(status){this.status=status;},end(body=''){resolve({status:this.status,body,headers:this.headers});}};
    server.emit('request',req,res);
  });
  server.close();return response;
}
test('private credentials only go to Responses; app receives trimmed output',async()=>{
 let called=0;
 const result=await invoke({apiKey:'server-only-test', fetchImpl:async(url,options)=>{
  called++;assert.equal(url,'https://api.openai.com/v1/responses');
  assert.equal(options.headers.Authorization,'Bearer server-only-test');
  const body=JSON.parse(options.body);assert.equal(body.model,'gpt-4.1-mini');assert.match(body.input,/iPhone 11 battery/);
  return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:' Approximate estimate '}] }]})};
 }});
 assert.equal(called,1);assert.equal(result.status,200);assert.deepEqual(JSON.parse(result.body),{text:'Approximate estimate'});
 assert.doesNotMatch(result.body,/server-only-test/);
});
test('validates description, JSON, body size, type, routes, and missing setup',async()=>{
 const options={apiKey:'test',fetchImpl:()=>{throw Error('Should not reach provider');}};
 for(const data of [{description:''},{description:3},{description:'x'.repeat(4001)},null])assert.equal((await invoke(options,{data})).status,400);
 assert.equal((await invoke(options,{raw:'{'})).status,400);
 assert.equal((await invoke(options,{raw:'x'.repeat(20001)})).status,413);
 assert.equal((await invoke(options,{headers:{'content-type':'text/plain'}})).status,415);
 assert.equal((await invoke(options,{url:'/unknown'})).status,404);
 assert.equal((await invoke({apiKey:''})).status,503);
});
test('denies hostile origins and permits local simulator/web development',async()=>{
 assert.equal((await invoke({apiKey:'test'},{headers:{origin:'https://untrusted.example'}})).status,403);
 assert.equal((await invoke({apiKey:'test'},{headers:{'sec-fetch-site':'cross-site'}})).status,403);
 const result=await invoke({apiKey:''},{url:'/health',method:'GET',headers:{origin:'http://localhost:19006','sec-fetch-site':'cross-site'}});
 assert.equal(result.status,200);assert.equal(result.headers['Access-Control-Allow-Origin'],'http://localhost:19006');assert.deepEqual(JSON.parse(result.body),{ok:true,configured:false});
 assert.equal((await invoke({}, {method:'OPTIONS'})).status,204);
});
test('upstream rejection, empty output and network failure are visible without leaking key',async()=>{
 for(const fetchImpl of [async()=>({ok:false}),async()=>({ok:true,json:async()=>({output:[]})}),async()=>{throw Error('server-only-test');}]){
  const result=await invoke({apiKey:'server-only-test',fetchImpl});assert.equal(result.status,502);assert.doesNotMatch(result.body,/server-only-test/);
 }
});
