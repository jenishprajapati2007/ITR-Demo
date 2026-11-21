const sections=[...document.querySelectorAll('.section')];
const steps=[...document.querySelectorAll('.step')];
let current=0;

const val=id=>Number(document.getElementById(id)?.value||0);
const money=n=>'₹'+Number(Math.max(0,n)||0).toLocaleString('en-IN',{maximumFractionDigits:0});

function showStep(i){
 current=i;
 sections.forEach((s,n)=>s.classList.toggle('active',n===i));
 steps.forEach((s,n)=>s.classList.toggle('active',n===i));
 document.getElementById('prevBtn').disabled=i===0;
 document.getElementById('nextBtn').style.display=i===sections.length-1?'none':'inline-block';
 if(i===2||i===4||i===5) calculateAll();
 window.scrollTo({top:0,behavior:'smooth'});
}
function nextStep(){if(current<sections.length-1){if(validateStep(current))showStep(current+1)}}
function prevStep(){if(current>0)showStep(current-1)}

function validateStep(i){
 const required={
  0:['name','pan','dob','mobile','email'],
  1:['bank','account','ifsc','accountType'],
  2:[],
  3:['grossSalary'],
  4:[],
  5:[]
 }[i]||[];
 for(const id of required){
  const el=document.getElementById(id);
  if(!el.value.trim()){el.focus();alert('Please complete the required fields.');return false}
 }
 if(i===0 && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(document.getElementById('pan').value.toUpperCase())){
  alert('Please enter a valid 10-character PAN format.');document.getElementById('pan').focus();return false;
 }
 if(i===0 && !/^\d{10}$/.test(document.getElementById('mobile').value)){
  alert('Please enter a valid 10-digit mobile number.');document.getElementById('mobile').focus();return false;
 }
 return true;
}

function grossIncome(){
 const salary=val('salaryIncome') || val('grossSalary');
 return salary+val('businessIncome')+val('interest')+val('otherIncome');
}
function standardDeduction(){
 const salary=val('salaryIncome') || val('grossSalary');
 return salary>0 ? Math.min(75000,salary) : 0;
}
function taxableIncome(){
 const income=grossIncome();
 const deductions=standardDeduction()+val('d80c')+val('d80d')+val('otherDeduction');
 return Math.max(0,income-deductions);
}

/* AY 2026-27 demo: new-regime slab calculation for ordinary income.
   This is a project calculator, not an official filing engine. */
function slabTax(income){
 let tax=0;
 if(income<=400000)return 0;
 tax += Math.min(Math.max(income-400000,0),400000)*0.05;
 tax += Math.min(Math.max(income-800000,0),400000)*0.10;
 tax += Math.min(Math.max(income-1200000,0),400000)*0.15;
 tax += Math.min(Math.max(income-1600000,0),400000)*0.20;
 tax += Math.min(Math.max(income-2000000,0),400000)*0.25;
 tax += Math.max(income-2400000,0)*0.30;
 return tax;
}
function calculateAll(){
 const income=grossIncome();
 const taxable=taxableIncome();
 let baseTax=slabTax(taxable);
 /* Basic 87A rebate for eligible resident individuals. */
 let rebate=taxable<=1200000 ? Math.min(baseTax,60000) : 0;
 let taxAfterRebate=Math.max(0,baseTax-rebate);
 const cess=taxAfterRebate*0.04;
 const liability=taxAfterRebate+cess;
 const paid=val('tds');
 const balance=liability-paid;

 document.getElementById('incomePreview').textContent=money(income);
 document.getElementById('finalTax').textContent=money(liability);
 document.getElementById('finalTDS').textContent=money(paid);
 document.getElementById('finalStatus').textContent=balance>0?'Tax Payable '+money(balance):balance<0?'Refund '+money(Math.abs(balance)):'No Balance';

 if(document.getElementById('totalIncome'))document.getElementById('totalIncome').value=Math.round(income);
 if(document.getElementById('taxableIncome'))document.getElementById('taxableIncome').value=Math.round(taxable);
 if(document.getElementById('incomeTax'))document.getElementById('incomeTax').value=Math.round(taxAfterRebate);
 if(document.getElementById('cess'))document.getElementById('cess').value=Math.round(cess);
 return {income,taxable,baseTax,rebate,cess,liability,paid,balance};
}

document.querySelectorAll('.money').forEach(el=>el.addEventListener('input',calculateAll));
['pan','ifsc'].forEach(id=>document.getElementById(id)?.addEventListener('input',e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'')));
['mobile','aadhaar','account'].forEach(id=>document.getElementById(id)?.addEventListener('input',e=>e.target.value=e.target.value.replace(/\D/g,'')));

function updateSubmit(){
 const ok=document.getElementById('declaration').checked &&
          document.getElementById('consent').checked &&
          document.getElementById('verifyMethod').value;
 document.getElementById('submitBtn').disabled=!ok;
}
['declaration','consent','verifyMethod'].forEach(id=>document.getElementById(id).addEventListener('change',updateSubmit));

function submitITR(){
 const result=calculateAll();
 const ack='DEMO-'+Date.now().toString().slice(-10);
 document.getElementById('ackNo').textContent=ack;
 document.getElementById('receiptName').textContent=document.getElementById('name').value || '—';
 document.getElementById('receiptPan').textContent=document.getElementById('pan').value || '—';
 document.getElementById('receiptIncome').textContent=money(result.income);
 document.getElementById('receiptTaxable').textContent=money(result.taxable);
 document.getElementById('receiptTax').textContent=money(result.liability);
 document.getElementById('receiptPaid').textContent=money(result.paid);
 const status=result.balance>0?'Tax Payable '+money(result.balance):result.balance<0?'Refund '+money(Math.abs(result.balance)):'No Balance';
 document.getElementById('receiptStatus').textContent=status;
 document.getElementById('resultExplanation').textContent=result.balance>0
   ? 'Your calculated tax liability is higher than the TDS/tax already paid, so the remaining balance is shown as tax payable.'
   : result.balance<0
   ? 'The tax already paid/TDS is higher than the calculated liability, so the excess is shown as a demo refund amount.'
   : 'The calculated tax liability is fully covered by the tax already paid/TDS, so there is no remaining balance.';
 document.getElementById('modal').classList.add('show');
}
function closeModal(){document.getElementById('modal').classList.remove('show')}

calculateAll();
updateSubmit();
