import { createClient } from "@supabase/supabase-js";
const url = process.env.VITE_SUPABASE_URL || "https://uakqylxirvfhmsbanuzd.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVha3F5bHhpcnZmaG1zYmFudXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMDY3MzIsImV4cCI6MjA5MDY4MjczMn0.V46OdYVjAQ6XybxQTk8vqMQVqg3Y9m_lg3sQ1AwmsD0";
const sb = createClient(url, key);

const SUBS = {
  tangibility:["sq1_1","sq1_2","sq1_3"], reliability:["sq2_1","sq2_2","sq2_3"],
  responsiveness:["sq3_1","sq3_2","sq3_3"], assurance:["sq4_1","sq4_2","sq4_3"], empathy:["sq5_1","sq5_2","sq5_3"],
  system_reliability:["pq1_1","pq1_2","pq1_3"], warranty:["pq2_1","pq2_2","pq2_3"],
  standards:["pq3_1","pq3_2","pq3_3"], value:["pq4_1","pq4_2","pq4_3"],
  brand_credibility:["bt1_1","bt1_2","bt1_3"], brand_benevolence:["bt2_1","bt2_2","bt2_3"],
  problem_recognition:["dc1_1","dc1_2","dc1_3"], info_search:["dc2_1","dc2_2","dc2_3"],
  eval_alternatives:["dc3_1","dc3_2","dc3_3"], purchase_decision:["dc4_1","dc4_2","dc4_3"], post_purchase:["dc5_1","dc5_2","dc5_3"],
};
const genders=["ชาย","หญิง"]; const ages=["ต่ำกว่า 30 ปี","30-39 ปี","40-49 ปี","50-59 ปี","60 ปีขึ้นไป"];
const edus=["ต่ำกว่าปริญญาตรี","ปริญญาตรี","สูงกว่าปริญญาตรี"];
const occs=["ข้าราชการ/พนักงานรัฐ","พนักงานบริษัทเอกชน","ธุรกิจส่วนตัว/ค้าขาย","เกษตรกร","อื่นๆ"];
const incs=["ต่ำกว่า 20,000 บาท","20,001-40,000 บาท","40,001-60,000 บาท","60,001-80,000 บาท","มากกว่า 80,000 บาท"];
const exps=["น้อยกว่า 1 ปี","1-3 ปี","4-6 ปี","มากกว่า 6 ปี"];
const provs=["กรุงเทพมหานคร","นนทบุรี","เชียงใหม่","ขอนแก่น","ชลบุรี","นครราชสีมา","สงขลา","ภูเก็ต","ราชบุรี","อุดรธานี"];
const srcs=["bangkok","north","northeast","east","west","south","central"];

// Box-Muller noise
function randn(){ let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
const pick=(a)=>a[Math.floor(Math.random()*a.length)];
const clamp=(x)=>Math.max(1,Math.min(5,Math.round(x)));

const rows=[];
const N=360;
for(let i=0;i<N;i++){
  // Person-level global trait (positive responders skew)
  const personMean = 3.6 + randn()*0.5; // 3.6 +/- 0.5
  const likert={};
  for(const [subId, items] of Object.entries(SUBS)){
    const latent = personMean + randn()*0.6; // subsection latent
    for(const it of items){
      likert[it] = clamp(latent + randn()*0.45); // small item noise -> high alpha
    }
  }
  const personal={
    gender:pick(genders), age:pick(ages), education:pick(edus),
    occupation:pick(occs), income:pick(incs), experience:pick(exps),
    province:pick(provs),
  };
  rows.push({
    uid:`sim2_${i+1}_${Date.now()}`,
    source_code:"simulated",
    personal_data:personal,
    likert_data:likert,
    suggestion:"",
    time_taken: 300+Math.floor(Math.random()*400),
    survey_version:"1.0",
    want_results:false,
  });
}

const B=50; let ok=0;
for(let i=0;i<rows.length;i+=B){
  const slice=rows.slice(i,i+B);
  const {error,data}=await sb.from("survey_responses").insert(slice).select("id");
  if(error){ console.error(error); process.exit(1); }
  ok+=data.length;
  console.log(`Inserted ${ok}/${rows.length}`);
}
console.log("DONE",ok);
