import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const PERSONAL_QUESTIONS = [
  { id: "gender", text: "เพศ", options: ["ชาย", "หญิง", "อื่น ๆ"] },
  { id: "age", text: "อายุ", options: ["ต่ำกว่า 30 ปี", "30-39 ปี", "40-49 ปี", "50-59 ปี", "60 ปีขึ้นไป"] },
  { id: "education", text: "ระดับการศึกษาสูงสุด", options: ["ต่ำกว่าปริญญาตรี", "ปริญญาตรี", "สูงกว่าปริญญาตรี", "อื่น ๆ"] },
  { id: "occupation", text: "อาชีพ", options: ["พนักงานบริษัทเอกชน", "ข้าราชการ/รัฐวิสาหกิจ", "เจ้าของกิจการ", "เกษตรกร", "อื่น ๆ"] },
  { id: "income", text: "รายได้เฉลี่ยต่อเดือน", options: ["ต่ำกว่า 15,000 บาท", "15,001-30,000 บาท", "30,001-50,000 บาท", "50,001 บาทขึ้นไป"] },
  { id: "experience", text: "ประสบการณ์ในการติดตั้งโซลาร์รูฟท็อป", options: ["น้อยกว่า 1 ปี", "1-2 ปี", "3-5 ปี", "มากกว่า 5 ปี"] },
];

const LIKERT_SECTIONS = [
  {
    id: "service_quality", title: "ปัจจัยด้านคุณภาพการบริการ",
    subsections: [
      { id: "tangibility", title: "1. ความเป็นรูปธรรมของการบริการ", items: [
        { id: "sq1_1", text: "สถานที่และอุปกรณ์ของผู้ให้บริการมีความสะอาดและเป็นระเบียบ" },
        { id: "sq1_2", text: "เอกสารหรือสื่อประชาสัมพันธ์ของที่ผู้ให้บริการติดตั้งโซลาร์รูฟท็อป มีความชัดเจน เข้าใจง่ายและน่าเชื่อถือ" },
        { id: "sq1_3", text: "พนักงานแต่งกายเหมาะสมและดูเป็นมืออาชีพ" },
      ]},
      { id: "reliability", title: "2. ความน่าเชื่อถือ", items: [
        { id: "sq2_1", text: "ผู้ให้บริการสามารถให้บริการได้ตามสัญญาและไว้วางใจได้" },
        { id: "sq2_2", text: "ผู้ให้บริการมีความสม่ำเสมอการติดตั้งเสร็จตามกำหนดเวลา" },
        { id: "sq2_3", text: "ผู้ให้บริการสามารถให้การให้บริการที่ถูกต้องตั้งแต่ครั้งแรก การรักษาคำมั่นสัญญาในการให้บริการ" },
      ]},
      { id: "responsiveness", title: "3. การตอบสนอง", items: [
        { id: "sq3_1", text: "ผู้ให้บริการติดตั้งโซลาร์รูฟท็อป แสดงความตั้งใจที่จะช่วยเหลือเมื่อผู้รับบริการต้องการ" },
        { id: "sq3_2", text: "ผู้ให้บริการมีความพร้อมในการให้บริการ สามารถตอบสนองต่อคำร้องขอของลูกค้าอย่างรวดเร็ว" },
        { id: "sq3_3", text: "ผู้ให้บริการมีการแจ้งให้ลูกค้าทราบเมื่อจะทำการติดตั้งโซลาร์รูฟท็อป ตรงตามกำหนดเวลา" },
      ]},
      { id: "assurance", title: "4. ความมั่นใจ", items: [
        { id: "sq4_1", text: "ผู้ให้บริการมีความรู้และสามารถให้คำแนะนำที่เป็นประโยชน์" },
        { id: "sq4_2", text: "ผู้ให้บริการติดตั้งโซลาร์รูฟท็อปทำให้ผู้รับบริการรู้สึกมั่นใจ รับบริการและความไว้วางใจให้ในการใช้บริการ" },
        { id: "sq4_3", text: "ผู้บริโภครู้สึกปลอดภัยในการติดต่อหรือขอข้อมูลจากผู้ให้บริการ" },
      ]},
      { id: "empathy", title: "5. ความเห็นอกเห็นใจ", items: [
        { id: "sq5_1", text: "ผู้ให้บริการดูแลเอาใจใส่และให้ความสนใจแก่ลูกค้าเป็นรายบุคคลอย่างต่อเนื่อง" },
        { id: "sq5_2", text: "ผู้ให้บริการให้บริการด้วยความสุภาพและมีมนุษยสัมพันธ์ที่ดี" },
        { id: "sq5_3", text: "ผู้ให้บริการฯ ให้ความสนใจ เข้าใจ ความต้องการของลูกค้าเป็นรายบุคคลและให้บริการด้วยความเป็นมิตร" },
      ]},
    ],
  },
  {
    id: "product_quality", title: "ปัจจัยด้านคุณภาพผลิตภัณฑ์",
    subsections: [
      { id: "system_reliability", title: "1. ความน่าเชื่อถือของระบบ", items: [
        { id: "pq1_1", text: "ความสามารถของระบบโซลาร์รูฟท็อปทำงานได้อย่างต่อเนื่องถูกต้อง สม่ำเสมอ และมีเสถียรภาพ" },
        { id: "pq1_2", text: "ผู้บริโภคมั่นใจในคุณภาพของอุปกรณ์ที่ติดตั้งมีเสถียรภาพ สภาพแวดล้อมและสภาพการใช้งานที่หลากหลาย" },
        { id: "pq1_3", text: "งานระบบโซลาร์รูฟท็อปมีความสามารถในการผลิตพลังงานตามที่ระบุไว้อย่างสม่ำเสมอตลอดอายุการใช้ได้ตามโฆษณาหรือให้ข้อมูลไว้" },
      ]},
      { id: "warranty", title: "2. การรับประกัน", items: [
        { id: "pq2_1", text: "ผู้ให้บริการติดตั้งโซลาร์รูฟท็อปมีการรับประกันเงื่อนไขที่ชัดเจน ครอบคลุมถึงการรับประกันที่ผู้ให้บริการติดตั้งโซลาร์รูฟท็อปมอบให้แก่ผู้รับบริการ" },
        { id: "pq2_2", text: "ระยะเวลาการรับประกันมีความเหมาะสม" },
        { id: "pq2_3", text: "การเคลมประกันหรือขอรับบริการหลังการขายสามารถทำได้สะดวก รวดเร็ว อย่างต่อเนื่อง และความพร้อมการรับผิดชอบต่อความบกพร่องที่อาจเกิดขึ้น" },
      ]},
      { id: "standards", title: "3. มาตรฐานและการรับรอง", items: [
        { id: "pq3_1", text: "อุปกรณ์ติดตั้งโซลาร์รูฟท็อปได้รับการรับรองมาตรฐานจากหน่วยงานที่เกี่ยวข้อง" },
        { id: "pq3_2", text: "การติดตั้งโซลาร์รูฟท็อปเป็นไปตามหลักเกณฑ์และมาตรฐานความปลอดภัย" },
        { id: "pq3_3", text: "ผู้บริโภคเชื่อมั่นในความน่าเชื่อถือของผลิตภัณฑ์ติดตั้งโซลาร์รูฟท็อปที่มีมาตรฐานรองรับ" },
      ]},
      { id: "value", title: "4. ประสิทธิภาพเมื่อเทียบกับราคา", items: [
        { id: "pq4_1", text: "ผู้บริโภครู้สึกว่าผลิตภัณฑ์ให้ผลตอบแทนคุ้มค่ากับราคาที่จ่าย" },
        { id: "pq4_2", text: "ระบบช่วยลดค่าใช้จ่ายด้านพลังงานได้ตามที่คาดหวัง" },
        { id: "pq4_3", text: "ผลิตภัณฑ์มีความทนทานและอายุการใช้งานที่เหมาะสมกับราคา" },
      ]},
    ],
  },
  {
    id: "brand_trust", title: "ปัจจัยด้านความไว้วางใจตราสินค้า",
    subsections: [
      { id: "brand_credibility", title: "1. ความน่าเชื่อถือของตราสินค้า", items: [
        { id: "bt1_1", text: "ตราสินค้าโซลาร์รูฟท็อปมีชื่อเสียงดีในด้านคุณภาพและบริการ" },
        { id: "bt1_2", text: "ตราสินค้าโซลาร์รูฟท็อปมีประวัติการดำเนินธุรกิจที่โปร่งใสและน่าเชื่อถือ" },
        { id: "bt1_3", text: "ผู้บริโภครู้สึกมั่นใจในการเลือกตราสินค้าโซลาร์รูฟท็อปนี้ สามารถปฏิบัติตามสัญญาและส่งมอบคุณค่าตามที่ได้มากกว่าตราสินค้าอื่นจากความเชี่ยวชาญ" },
      ]},
      { id: "brand_benevolence", title: "2. เจตนาดีของตราสินค้า", items: [
        { id: "bt2_1", text: "ตราสินค้าโซลาร์รูฟท็อปมุ่งมั่นในการให้ประโยชน์ที่ดีที่สุดแก่ผู้บริโภคเป็นสำคัญ" },
        { id: "bt2_2", text: "ตราสินค้าโซลาร์รูฟท็อปมีความรับผิดชอบต่อผู้บริโภคและสิ่งแวดล้อม แม้ในสถานการณ์ที่มีปัญหาหรือความไม่แน่นอนในอนาคต" },
        { id: "bt2_3", text: "ท่านรู้สึกว่าตราสินค้าโซลาร์รูฟท็อปมีความตั้งใจดีและจริงใจจากการให้บริการ ความรับผิดชอบในการแก้ไขปัญหาหรือข้อบกพร่องที่อาจเกิดขึ้นจากการให้บริการ" },
      ]},
    ],
  },
  {
    id: "decision", title: "ปัจจัยด้านการตัดสินใจติดตั้งโซลาร์รูฟท็อป",
    subsections: [
      { id: "problem_recognition", title: "1. การรับรู้ถึงปัญหา", items: [
        { id: "dc1_1", text: "ท่านตระหนักถึงปัญหาค่าไฟฟ้าที่สูงขึ้น" },
        { id: "dc1_2", text: "ท่านเห็นว่าการใช้พลังงานแสงอาทิตย์เป็นทางเลือกที่แก้ปัญหาได้" },
        { id: "dc1_3", text: "ท่านเริ่มมองหาวิธีการประหยัดพลังงานในระยะยาว" },
      ]},
      { id: "info_search", title: "2. การค้นหาข้อมูล", items: [
        { id: "dc2_1", text: "ท่านศึกษาข้อมูลเกี่ยวกับโซลาร์รูฟท็อปจากแหล่งต่าง ๆ" },
        { id: "dc2_2", text: "ท่านสอบถามข้อมูลจากผู้ให้บริการหลายรายก่อนตัดสินใจ" },
        { id: "dc2_3", text: "ท่านเปรียบเทียบรายละเอียดของสินค้าและบริการจากผู้ให้บริการแต่ละราย" },
      ]},
      { id: "eval_alternatives", title: "3. การประเมินทางเลือก", items: [
        { id: "dc3_1", text: "ท่านพิจารณาคุณภาพและราคาของแต่ละตัวเลือกอย่างรอบคอบ" },
        { id: "dc3_2", text: "ท่านเปรียบเทียบข้อดีข้อเสียของตัวเลือกต่าง ๆ ก่อนตัดสินใจ" },
        { id: "dc3_3", text: "ท่านเลือกตัวเลือกที่ให้ประโยชน์คุ้มค่ามากที่สุด" },
      ]},
      { id: "purchase_decision", title: "4. การตัดสินใจซื้อ", items: [
        { id: "dc4_1", text: "ท่านตัดสินใจติดตั้งโซลาร์รูฟท็อปหลังจากพิจารณาทางเลือกอย่างถี่ถ้วน" },
        { id: "dc4_2", text: "ท่านมีความมั่นใจในการตัดสินใจติดตั้งกับผู้ให้บริการที่เลือก" },
        { id: "dc4_3", text: "การตัดสินใจติดตั้งของท่านเป็นไปตามความตั้งใจของตนเองหรือผู้อื่น" },
      ]},
      { id: "post_purchase", title: "5. พฤติกรรมหลังการซื้อ", items: [
        { id: "dc5_1", text: "ท่านรู้สึกพึงพอใจหลังจากการติดตั้งโซลาร์รูฟท็อป" },
        { id: "dc5_2", text: "ท่านมีแนวโน้มจะแนะนำบริการติดตั้งโซลาร์รูฟท็อปนี้ให้ผู้อื่น" },
        { id: "dc5_3", text: "ท่านจะพิจารณาใช้บริการจากผู้ให้บริการรายเดิมในอนาคต" },
      ]},
    ],
  },
];

function calcMean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calcSD(arr) {
  if (arr.length < 2) return 0;
  const mean = calcMean(arr);
  const variance = arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const SECTION_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981"];
const PIE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

const AdminPage = () => {
  const navigate = useNavigate();
  const [selectedSource, setSelectedSource] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [responses, setResponses] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSourceName, setNewSourceName] = useState("");
  const [addingSource, setAddingSource] = useState(false);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    const [respResult, srcResult] = await Promise.all([
      supabase.from("survey_responses").select("*").order("created_at", { ascending: false }),
      supabase.from("survey_sources").select("*").order("created_at", { ascending: true }),
    ]);
    if (respResult.data) {
      setResponses(respResult.data.map(r => ({
        id: r.uid,
        source: r.source_code,
        timestamp: new Date(r.created_at).toLocaleString("th-TH"),
        timeTaken: r.time_taken,
        personal: r.personal_data,
        likert: r.likert_data,
        suggestion: r.suggestion,
      })));
    }
    if (srcResult.data) setSources(srcResult.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Build SOURCES map from DB
  const SOURCES = useMemo(() => {
    const map = {};
    sources.forEach(s => { map[s.code] = s.name; });
    return map;
  }, [sources]);

  const filtered = selectedSource === "all" ? responses : responses.filter(r => r.source === selectedSource);

  const computeSectionStats = (sectionItems, data) => {
    return sectionItems.map(item => {
      const vals = data.map(r => r.likert?.[item.id]).filter(v => v != null);
      return { id: item.id, text: item.text, n: vals.length, mean: calcMean(vals), sd: calcSD(vals) };
    });
  };

  const sectionAverages = useMemo(() => {
    if (!filtered.length) return [];
    return LIKERT_SECTIONS.map((sec, si) => {
      const allVals = sec.subsections.flatMap(sub =>
        sub.items.flatMap(item => filtered.map(r => r.likert?.[item.id]).filter(v => v != null))
      );
      return { name: sec.title.replace("ปัจจัยด้าน", ""), mean: parseFloat(calcMean(allVals).toFixed(2)), fill: SECTION_COLORS[si] };
    });
  }, [filtered]);

  const radarData = useMemo(() => {
    if (!filtered.length) return [];
    return LIKERT_SECTIONS.flatMap(sec =>
      sec.subsections.map(sub => {
        const vals = sub.items.flatMap(item => filtered.map(r => r.likert?.[item.id]).filter(v => v != null));
        return { subject: sub.title.replace(/^\d+\.\s*/, "").substring(0, 12), mean: parseFloat(calcMean(vals).toFixed(2)), fullMark: 5 };
      })
    );
  }, [filtered]);

  const personalCharts = useMemo(() => {
    if (!filtered.length) return [];
    return PERSONAL_QUESTIONS.map(q => {
      const counts = {};
      q.options.forEach(opt => counts[opt] = 0);
      filtered.forEach(r => { if (r.personal?.[q.id]) counts[r.personal[q.id]] = (counts[r.personal[q.id]] || 0) + 1; });
      return { question: q.text, data: Object.entries(counts).map(([name, value]) => ({ name, value })) };
    });
  }, [filtered]);

  const sourceDistribution = useMemo(() => {
    const counts = {};
    filtered.forEach(r => { const name = SOURCES[r.source] || r.source; counts[name] = (counts[name] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered, SOURCES]);

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const allLikertIds = LIKERT_SECTIONS.flatMap(s => s.subsections.flatMap(ss => ss.items.map(i => i.id)));
    const headers = ["response_id", "source", "source_name", "timestamp", "time_seconds",
      ...PERSONAL_QUESTIONS.map(q => q.id), ...allLikertIds, "suggestion"];
    const rows = filtered.map(r => [
      r.id, r.source, SOURCES[r.source] || r.source, r.timestamp, r.timeTaken,
      ...PERSONAL_QUESTIONS.map(q => r.personal?.[q.id] || ""),
      ...allLikertIds.map(id => r.likert?.[id] || ""),
      `"${(r.suggestion || "").replace(/"/g, '""')}"`,
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadFile(csv, "survey_results.csv", "text/csv;charset=utf-8");
  };

  const exportTXT = () => {
    if (!filtered.length) return;
    let txt = "=== Solar Rooftop Survey Results ===\n";
    txt += `Total Responses: ${filtered.length}\n`;
    txt += `Export Date: ${new Date().toLocaleString("th-TH")}\n\n`;
    filtered.forEach((r, i) => {
      txt += `--- Response #${i + 1} (${r.id}) ---\n`;
      txt += `Source: ${SOURCES[r.source] || r.source}\n`;
      txt += `Time: ${r.timestamp}\n`;
      txt += `Duration: ${formatTime(r.timeTaken)}\n`;
      PERSONAL_QUESTIONS.forEach(q => { txt += `${q.text}: ${r.personal?.[q.id] || "-"}\n`; });
      LIKERT_SECTIONS.forEach(sec => {
        txt += `\n[${sec.title}]\n`;
        sec.subsections.forEach(sub => {
          sub.items.forEach(item => { txt += `  ${item.text}: ${r.likert?.[item.id] || "-"}\n`; });
        });
      });
      txt += `\nข้อเสนอแนะ: ${r.suggestion || "-"}\n\n`;
    });
    downloadFile(txt, "survey_results.txt", "text/plain;charset=utf-8");
  };

  const exportExcelJSON = () => {
    if (!filtered.length) return;
    const allLikertIds = LIKERT_SECTIONS.flatMap(s => s.subsections.flatMap(ss => ss.items.map(i => i.id)));
    const allLikertTexts = LIKERT_SECTIONS.flatMap(s => s.subsections.flatMap(ss => ss.items.map(i => i.text.substring(0, 40))));
    const headers = ["ID", "แหล่งที่มา", "วันเวลา", "เวลา(วินาที)",
      ...PERSONAL_QUESTIONS.map(q => q.text), ...allLikertTexts, "ข้อเสนอแนะ"];
    const rows = filtered.map(r => [
      r.id, SOURCES[r.source] || r.source, r.timestamp, r.timeTaken,
      ...PERSONAL_QUESTIONS.map(q => r.personal?.[q.id] || ""),
      ...allLikertIds.map(id => r.likert?.[id] || ""),
      (r.suggestion || "").replace(/\t/g, " "),
    ]);
    const tsv = "\uFEFF" + [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
    downloadFile(tsv, "survey_results.xls", "application/vnd.ms-excel;charset=utf-8");
  };

  // Source management
  const addSource = async () => {
    if (!newSourceName.trim()) return;
    setAddingSource(true);
    const nextCode = "src" + String(sources.length + 1).padStart(2, "0");
    const { error } = await supabase.from("survey_sources").insert({
      code: nextCode,
      name: newSourceName.trim(),
    });
    if (!error) {
      setNewSourceName("");
      loadData();
    } else {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
    setAddingSource(false);
  };

  const toggleSource = async (id, currentActive) => {
    await supabase.from("survey_sources").update({ is_active: !currentActive }).eq("id", id);
    loadData();
  };

  const deleteSource = async (id, code) => {
    const count = responses.filter(r => r.source === code).length;
    if (count > 0) {
      alert(`ไม่สามารถลบได้ เนื่องจากมีคำตอบ ${count} รายการจากแหล่งนี้`);
      return;
    }
    if (!confirm("ยืนยันการลบแหล่งที่มานี้?")) return;
    await supabase.from("survey_sources").delete().eq("id", id);
    loadData();
  };

  const copyLink = (code) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}?src=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      alert("คัดลอกลิงก์แล้ว!");
    });
  };

  const tabStyle = (isActive) => ({
    padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
    background: isActive ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
    color: isActive ? "#f59e0b" : "#94a3b8", fontSize: 13, fontWeight: isActive ? 700 : 400,
    transition: "all 0.2s",
    borderBottom: isActive ? "2px solid #f59e0b" : "2px solid transparent",
  });

  const chartCardStyle = {
    background: "rgba(255,255,255,0.04)", borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)", padding: 24, marginBottom: 24,
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "rgba(15,32,39,0.95)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
          <p style={{ color: "#e2e8f0", margin: 0, fontWeight: 600 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color || "#f59e0b", margin: "4px 0 0" }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif", color: "#e2e8f0",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
      padding: "20px", fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
      color: "#e2e8f0",
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#f59e0b" }}>📊 Admin Dashboard</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>รายงานผลแบบสอบถาม (Supabase)</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={loadData} style={{
              padding: "8px 20px", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, background: "transparent", color: "#e2e8f0",
              cursor: "pointer", fontSize: 13,
            }}>🔄 รีเฟรช</button>
            <button onClick={() => navigate("/")} style={{
              padding: "8px 20px", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, background: "transparent", color: "#e2e8f0",
              cursor: "pointer", fontSize: 13,
            }}>← กลับ</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "ตอบทั้งหมด", value: filtered.length, icon: "📝" },
            { label: "เวลาเฉลี่ย", value: filtered.length ? formatTime(Math.round(calcMean(filtered.map(r => r.timeTaken)))) : "-", icon: "⏱" },
            { label: "แหล่งที่มา", value: new Set(filtered.map(r => r.source)).size, icon: "🔗" },
            { label: "คะแนนเฉลี่ยรวม", value: filtered.length ? calcMean(sectionAverages.map(s => s.mean)).toFixed(2) : "-", icon: "⭐" },
          ].map((card, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 20,
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>{card.value}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Source Filter */}
        <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button onClick={() => setSelectedSource("all")} style={{
            padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
            background: selectedSource === "all" ? "#f59e0b" : "rgba(255,255,255,0.1)",
            color: selectedSource === "all" ? "#000" : "#94a3b8", fontSize: 12, fontWeight: 600,
          }}>ทั้งหมด ({responses.length})</button>
          {sources.map(src => {
            const count = responses.filter(r => r.source === src.code).length;
            return (
              <button key={src.code} onClick={() => setSelectedSource(src.code)} style={{
                padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                background: selectedSource === src.code ? "#f59e0b" : "rgba(255,255,255,0.1)",
                color: selectedSource === src.code ? "#000" : "#94a3b8", fontSize: 12, fontWeight: 600,
              }}>{src.name} ({count})</button>
            );
          })}
        </div>

        {/* Export Buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "📥 CSV", fn: exportCSV },
            { label: "📄 TXT", fn: exportTXT },
            { label: "📊 Excel", fn: exportExcelJSON },
          ].map((btn, i) => (
            <button key={i} onClick={btn.fn} style={{
              padding: "10px 24px", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10, background: "rgba(255,255,255,0.05)",
              color: "#e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}
              onMouseOver={e => e.target.style.background = "rgba(245,158,11,0.2)"}
              onMouseOut={e => e.target.style.background = "rgba(255,255,255,0.05)"}
            >{btn.label}</button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 12, flexWrap: "wrap" }}>
          <button onClick={() => setActiveTab("overview")} style={tabStyle(activeTab === "overview")}>📈 ภาพรวม</button>
          <button onClick={() => setActiveTab("demographics")} style={tabStyle(activeTab === "demographics")}>👥 ข้อมูลผู้ตอบ</button>
          <button onClick={() => setActiveTab("details")} style={tabStyle(activeTab === "details")}>📋 ตารางละเอียด</button>
          <button onClick={() => setActiveTab("links")} style={tabStyle(activeTab === "links")}>🔗 จัดการลิงก์</button>
        </div>

        {filtered.length === 0 && activeTab !== "links" && (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p>ยังไม่มีข้อมูลที่ส่งเข้ามา</p>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && filtered.length > 0 && (
          <>
            <div style={chartCardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b", margin: "0 0 20px" }}>คะแนนเฉลี่ยรายปัจจัย</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectionAverages} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 5]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="mean" name="ค่าเฉลี่ย" radius={[6, 6, 0, 0]}>
                    {sectionAverages.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={chartCardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6", margin: "0 0 20px" }}>เปรียบเทียบรายด้านย่อย (Radar)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <Radar name="ค่าเฉลี่ย" dataKey="mean" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {sourceDistribution.length > 1 && (
              <div style={chartCardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#8b5cf6", margin: "0 0 20px" }}>สัดส่วนแหล่งที่มา</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={sourceDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sourceDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {LIKERT_SECTIONS.map((sec, si) => {
              const subsectionData = sec.subsections.map(sub => {
                const vals = sub.items.flatMap(item => filtered.map(r => r.likert?.[item.id]).filter(v => v != null));
                return { name: sub.title.replace(/^\d+\.\s*/, "").substring(0, 18), mean: parseFloat(calcMean(vals).toFixed(2)) };
              });
              return (
                <div key={sec.id} style={chartCardStyle}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: SECTION_COLORS[si], margin: "0 0 16px" }}>{sec.title}</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={subsectionData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-15} textAnchor="end" interval={0} />
                      <YAxis domain={[0, 5]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="mean" name="ค่าเฉลี่ย" fill={SECTION_COLORS[si]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </>
        )}

        {/* DEMOGRAPHICS TAB */}
        {activeTab === "demographics" && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
            {personalCharts.map((chart, ci) => (
              <div key={ci} style={chartCardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", margin: "0 0 16px" }}>{chart.question}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                      label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}>
                      {chart.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}

        {/* DETAILS TAB */}
        {activeTab === "details" && filtered.length > 0 && LIKERT_SECTIONS.map((sec, si) => (
          <div key={sec.id} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: SECTION_COLORS[si], marginBottom: 16, borderBottom: `2px solid ${SECTION_COLORS[si]}33`, paddingBottom: 8 }}>
              {sec.title}
            </h2>
            {sec.subsections.map(sub => {
              const stats = computeSectionStats(sub.items, filtered);
              return (
                <div key={sub.id} style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1", margin: "0 0 8px" }}>{sub.title}</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                          <th style={{ textAlign: "left", padding: "8px 12px", color: "#94a3b8", fontWeight: 600 }}>ข้อคำถาม</th>
                          <th style={{ textAlign: "center", padding: "8px 12px", color: "#94a3b8", fontWeight: 600, width: 50 }}>n</th>
                          <th style={{ textAlign: "center", padding: "8px 12px", color: "#94a3b8", fontWeight: 600, width: 70 }}>X̄</th>
                          <th style={{ textAlign: "center", padding: "8px 12px", color: "#94a3b8", fontWeight: 600, width: 70 }}>S.D.</th>
                          <th style={{ textAlign: "center", padding: "8px 12px", color: "#94a3b8", fontWeight: 600, width: 80 }}>แปลผล</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map(st => {
                          const level = st.mean >= 4.5 ? "มากที่สุด" : st.mean >= 3.5 ? "มาก" : st.mean >= 2.5 ? "ปานกลาง" : st.mean >= 1.5 ? "น้อย" : "น้อยที่สุด";
                          return (
                            <tr key={st.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <td style={{ padding: "8px 12px", color: "#e2e8f0" }}>{st.text}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#94a3b8" }}>{st.n}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#f59e0b", fontWeight: 700 }}>{st.mean.toFixed(2)}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#94a3b8" }}>{st.sd.toFixed(2)}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#e2e8f0", fontSize: 12 }}>{level}</td>
                            </tr>
                          );
                        })}
                        {(() => {
                          const allVals = sub.items.flatMap(item => filtered.map(r => r.likert?.[item.id]).filter(v => v != null));
                          return (
                            <tr style={{ background: "rgba(255,255,255,0.03)", fontWeight: 700 }}>
                              <td style={{ padding: "8px 12px", color: SECTION_COLORS[si] }}>เฉลี่ยรวม</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#94a3b8" }}>{allVals.length}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: SECTION_COLORS[si] }}>{calcMean(allVals).toFixed(2)}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#94a3b8" }}>{calcSD(allVals).toFixed(2)}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#e2e8f0", fontSize: 12 }}>
                                {calcMean(allVals) >= 4.5 ? "มากที่สุด" : calcMean(allVals) >= 3.5 ? "มาก" : calcMean(allVals) >= 2.5 ? "ปานกลาง" : calcMean(allVals) >= 1.5 ? "น้อย" : "น้อยที่สุด"}
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* LINKS TAB */}
        {activeTab === "links" && (
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b", margin: "0 0 8px" }}>🔗 จัดการลิงก์แบบสอบถาม</h2>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 20px" }}>
              สร้างลิงก์ตามแหล่งที่มา เมื่อผู้ตอบกดลิงก์ ระบบจะบันทึกว่าคำตอบมาจากแหล่งไหน
            </p>

            {/* Add new source */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <input
                type="text"
                value={newSourceName}
                onChange={e => setNewSourceName(e.target.value)}
                placeholder="ชื่อแหล่งที่มา เช่น กลุ่มไลน์ พี่เกียรติ"
                onKeyDown={e => e.key === "Enter" && addSource()}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)", color: "#e2e8f0",
                  fontSize: 14, outline: "none",
                }}
              />
              <button
                onClick={addSource}
                disabled={addingSource || !newSourceName.trim()}
                style={{
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  background: newSourceName.trim() ? "#f59e0b" : "rgba(255,255,255,0.1)",
                  color: newSourceName.trim() ? "#000" : "#64748b",
                  fontSize: 14, fontWeight: 700, cursor: newSourceName.trim() ? "pointer" : "not-allowed",
                }}
              >
                {addingSource ? "..." : "+ เพิ่ม"}
              </button>
            </div>

            {/* Source list */}
            <div style={{ display: "grid", gap: 8 }}>
              {sources.map(src => {
                const count = responses.filter(r => r.source === src.code).length;
                return (
                  <div key={src.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: src.is_active ? "rgba(255,255,255,0.03)" : "rgba(255,0,0,0.05)",
                    borderRadius: 10, padding: "12px 16px", fontSize: 13,
                    border: `1px solid ${src.is_active ? "rgba(255,255,255,0.06)" : "rgba(255,0,0,0.15)"}`,
                  }}>
                    <span style={{ color: "#f59e0b", fontWeight: 700, minWidth: 45 }}>{src.code}</span>
                    <span style={{ color: "#e2e8f0", flex: 1, fontWeight: 600 }}>{src.name}</span>
                    <span style={{
                      background: "rgba(245,158,11,0.15)", color: "#f59e0b",
                      padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                    }}>{count} คำตอบ</span>
                    <button onClick={() => copyLink(src.code)} style={{
                      padding: "6px 12px", borderRadius: 8, border: "none",
                      background: "rgba(59,130,246,0.15)", color: "#3b82f6",
                      cursor: "pointer", fontSize: 11, fontWeight: 600,
                    }}>📋 คัดลอกลิงก์</button>
                    <button onClick={() => toggleSource(src.id, src.is_active)} style={{
                      padding: "6px 12px", borderRadius: 8, border: "none",
                      background: src.is_active ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: src.is_active ? "#10b981" : "#ef4444",
                      cursor: "pointer", fontSize: 11, fontWeight: 600,
                    }}>{src.is_active ? "✅ เปิด" : "❌ ปิด"}</button>
                    <button onClick={() => deleteSource(src.id, src.code)} style={{
                      padding: "6px 12px", borderRadius: 8, border: "none",
                      background: "rgba(239,68,68,0.1)", color: "#ef4444",
                      cursor: "pointer", fontSize: 11, fontWeight: 600,
                    }}>🗑</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
