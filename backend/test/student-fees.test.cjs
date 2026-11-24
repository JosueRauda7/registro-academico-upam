require('reflect-metadata');require('ts-node/register/transpile-only');
const {test}=require('node:test');const assert=require('node:assert/strict');
const {validate}=require('class-validator');const {plainToInstance}=require('class-transformer');
const {UpdateStudentFeesDto}=require('../src/application/students/dto/update-student-fees.dto');
const {PaymentsService}=require('../src/application/payments/payments.service');
const {resolveStudentFees}=require('../src/application/payments/student-fees');
function fixture(){
 const student={id:'student',tuitionAmount:120.25,monthlyAmount:45.5,user:{email:'qa@example.invalid',firstName:'QA',lastName:'Fixture'}};
 const cycle={id:'cycle',name:'QA',tuitionAmount:150,monthlyAmount:60,monthlyCount:3};const rows=[];const gatewayCalls=[];
 const repo={findTuitionPayment:async()=>rows.find(p=>p.type==='tuition'&&p.status==='completed')||null,findByStudentAndCycle:async()=>rows,create:async data=>{const p={id:'p'+rows.length,...data};rows.push(p);return p;},update:async()=>null};
 const students={findByUserId:async()=>student,findById:async()=>student};
 const gateway={generateReference:()=> 'synthetic-ref',createPayment:async data=>{gatewayCalls.push(data);return {data:{id:'synthetic-tx'}};}};
 const service=new PaymentsService(repo,students,{findById:async()=>cycle},gateway,{sendPaymentConfirmation:async()=>{}});
 return {student,cycle,rows,gatewayCalls,service};
}
test('fees fall back independently to cycle amounts; explicit overrides are retained',()=>{
 assert.deepEqual(resolveStudentFees({}, {tuitionAmount:'150',monthlyAmount:'60'}),{tuitionAmount:150,monthlyAmount:60});
 assert.deepEqual(resolveStudentFees({tuitionAmount:120.25,monthlyAmount:null},{tuitionAmount:150,monthlyAmount:60}),{tuitionAmount:120.25,monthlyAmount:60});
});
test('fee DTO rejects negative, zero, overprecision, strings, huge values and extra fields',async()=>{
 for(const amount of [-1,0,1.001,'20',Infinity,NaN,100000000])assert.ok((await validate(plainToInstance(UpdateStudentFeesDto,{tuitionAmount:amount}),{whitelist:true,forbidNonWhitelisted:true})).length);
 for(const amount of [null,.01,150.25])assert.equal((await validate(plainToInstance(UpdateStudentFeesDto,{tuitionAmount:amount}),{whitelist:true,forbidNonWhitelisted:true})).length,0);
 assert.ok((await validate(plainToInstance(UpdateStudentFeesDto,{role:'administrator'}),{whitelist:true,forbidNonWhitelisted:true})).length);
});
test('Wompi mock receives exactly the student price in cents and does not reprice existing records',async()=>{
 const f=fixture();await f.service.createTuitionPayment('u','cycle');await f.service.createMonthlyPayment('u','cycle',1);
 assert.equal(f.rows[0].amount,120.25);assert.equal(f.rows[1].amount,45.5);
 assert.equal(f.gatewayCalls[0].amountInCents,12025);assert.equal(f.gatewayCalls[1].amountInCents,4550);
 f.student.tuitionAmount=200;f.student.monthlyAmount=90;
 assert.equal(f.rows[0].amount,120.25);assert.equal(f.rows[1].amount,45.5);
});
test('manual payment uses server price, rejects forged/invalid amount and accepts matching custom fee',async()=>{
 const f=fixture();const data={studentId:'student',cycleId:'cycle',type:'monthly',month:1,paymentMethod:'cash'};
 for(const amount of [60,45.49,45.501,NaN,undefined,'45.50'])await assert.rejects(f.service.createManualPayment('collector',{...data,amount}),e=>e.getStatus()===400);
 assert.equal(f.rows.length,0);
 await f.service.createManualPayment('collector',{...data,amount:45.5});assert.equal(f.rows[0].amount,45.5);
});
test('summary uses stored paid amounts and current fees for unpaid months, then restores cycle defaults',async()=>{
 const f=fixture();f.rows.push({type:'tuition',status:'completed',amount:100},{type:'monthly',status:'completed',month:1,amount:30});
 const summary=await f.service.getMyPaymentSummary('u','cycle');
 assert.equal(summary.tuitionAmount,100);assert.equal(summary.monthlyPayments[0].amount,30);assert.equal(summary.totalPaid,130);assert.equal(summary.totalPending,91);
 f.student.tuitionAmount=null;f.student.monthlyAmount=null;
 const restored=await f.service.getMyPaymentSummary('u','cycle');assert.equal(restored.totalPaid,130);assert.equal(restored.totalPending,120);assert.equal(restored.monthlyAmount,60);
});
