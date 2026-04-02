import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Lock, LayoutDashboard, Eye, RefreshCw, TrendingUp, Target, Users,
  BarChart3, ClipboardList, FileText, Link2, PieChart as PieChartIcon,
  BarChartHorizontal, Radar as RadarIcon, Copy, Printer, Download,
  Table2, ArrowLeft,
} from "lucide-react";

const PERSONAL_QUESTIONS = [
  { id: "gender", text: "เพศ", options: ["ชาย", "หญิง", "อื่น ๆ"] },
  { id: "age", text: "อายุ", options: ["ต่ำกว่า 30 ปี", "30-39 ปี", "40-49 ปี", "50-59 ปี", "60 ปีขึ้นไป"] },
  { id: "education", text: "ระดับการศึกษาสูงสุด", options: ["ต่ำกว่าปริญญาตรี", "ปริญญาตรี", "สูงกว่าปริญญาตรี", "อื่น ๆ"] },
  { id: "occupation", text: "อาชีพ", options: ["พนักงานบริษัทเอกชน", "ข้าราชการ/รัฐวิสาหกิจ", "เจ้าของกิจการ", "เกษตรกร", "อื่น ๆ"] },
  { id: "income", text: "รายได้เฉลี่ยต่อเดือน", options: ["ต่ำกว่า 15,000 บาท", "15,001-30,000 บาท", "30,001-50,000 บาท", "50,001 บาทขึ้นไป"] },
  { id: "experience", text: "ประสบการณ์ในการติดตั้งโซลาร์รูฟท็อป", options: ["น้อยกว่า 1 ปี", "1-2 ปี", "3-5 ปี", "มากกว่า 5 ปี"] },
  { id: "housing", text: "ประเภทที่อยู่อาศัย", options: ["บ้านเดี่ยว", "ทาวน์เฮาส์", "คอนโดมิเนียม", "อาคารพาณิชย์", "โรงงาน/อาคารอุตสาหกรรม"] },
  { id: "household", text: "จำนวนสมาชิกในครัวเรือน", options: ["1-2 คน", "3-4 คน", "5-6 คน", "มากกว่า 6 คน"] },
  { id: "electricity_bill", text: "ค่าไฟฟ้าเฉลี่ยต่อเดือน", options: ["ต่ำกว่า 2,000 บาท", "2,001-5,000 บาท", "5,001-10,000 บาท", "มากกว่า 10,000 บาท"] },
  { id: "peak_usage", text: "ช่วงเวลาที่ใช้ไฟฟ้าสูงสุด", options: ["กลางวัน (08:00-17:00)", "กลางคืน (17:00-22:00)", "ใช้ตลอดทั้งวันเท่า ๆ กัน"] },
  { id: "ev_car", text: "การมีรถยนต์ไฟฟ้า (EV)", options: ["มี EV แล้ว", "วางแผนจะซื้อ EV", "ไม่มีและไม่สนใจ"] },
  { id: "solar_size", text: "ขนาดระบบโซลาร์รูฟท็อปที่ติดตั้ง", options: ["ต่ำกว่า 3 kW", "3-5 kW", "5-10 kW", "มากกว่า 10 kW"] },
  { id: "info_source", text: "แหล่งข้อมูลหลักที่ใช้ตัดสินใจติดตั้ง", options: ["โซเชียลมีเดีย", "เพื่อน/ญาติแนะนำ", "ตัวแทนจำหน่าย", "งานแสดงสินค้า", "อื่น ๆ"] },
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

const SECTION_COLORS = ["#059669", "#3b82f6", "#8b5cf6", "#10b981"];
const PIE_COLORS = ["#059669", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

// Region-based sampling data
const REGION_DATA = [
  { name: "ภาคตะวันออกเฉียงเหนือ", code: "northeast", color: "#3b82f6", target: 127, shops: 127,
    provinces: ["ขอนแก่น", "เลย", "ร้อยเอ็ด", "ปากช่อง", "สุรินทร์", "อุบลราชธานี", "สกลนคร"] },
  { name: "ภาคเหนือ", code: "north", color: "#10b981", target: 109, shops: 109,
    provinces: ["กำแพงเพชร", "เชียงใหม่", "แพร่", "เพชรบูรณ์", "แม่สอด", "พิษณุโลก", "เชียงราย"] },
  { name: "ภาคใต้", code: "south", color: "#06b6d4", target: 71, shops: 71,
    provinces: ["สุราษฎร์ธานี", "ทุ่งสง", "หาดใหญ่", "ชุมพร"] },
  { name: "ภาคตะวันออก", code: "east", color: "#059669", target: 38, shops: 38,
    provinces: ["ระยอง", "กบินทร์บุรี", "ชลบุรี", "จันทบุรี"] },
  { name: "ภาคกลาง", code: "central", color: "#8b5cf6", target: 38, shops: 38,
    provinces: ["สุพรรณบุรี", "ปทุมธานี", "สิงห์บุรี", "นครปฐม", "อยุธยา"] },
  { name: "กรุงเทพฯ และปริมณฑล", code: "bangkok", color: "#ec4899", target: 30, shops: 30,
    provinces: ["กรุงเทพมหานคร", "นนทบุรี", "สมุทรปราการ", "ปทุมธานี"] },
  { name: "ภาคตะวันตก", code: "west", color: "#ef4444", target: 27, shops: 27,
    provinces: ["เพชรบุรี", "กาญจนบุรี", "ราชบุรี"] },
];

const REGIONS = REGION_DATA.map(r => ({ name: r.name, color: r.color }));

const TOTAL_TARGET = 440;
const TOTAL_SHOPS = 635;

const ADMIN_PASSWORD = "4497542";

const AdminPage = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [responses, setResponses] = useState([]);
  const [sources, setSources] = useState([]);
  const [crossRowVar, setCrossRowVar] = useState("housing");
  const [crossColVar, setCrossColVar] = useState("electricity_bill");
  const [demoChartType, setDemoChartType] = useState("pie");
  const [loading, setLoading] = useState(true);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceRegion, setNewSourceRegion] = useState("");
  const [newSourceTarget, setNewSourceTarget] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [printProvince, setPrintProvince] = useState(null);
   const [expandedResponse, setExpandedResponse] = useState(null);
   const [indivPageSize, setIndivPageSize] = useState(20);
   const [indivPage, setIndivPage] = useState(1);
   const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef(null);

  // Admin API helper
  const adminApi = useCallback(async (action, payload = {}) => {
    const res = await supabase.functions.invoke("admin-api", {
      body: { action, password: passwordInput || sessionStorage.getItem("admin_pw") || "", payload },
    });
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }, [passwordInput]);

  // Load data via edge function
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const pw = sessionStorage.getItem("admin_pw") || "";
      const [respData, srcData] = await Promise.all([
        supabase.functions.invoke("admin-api", { body: { action: "get_responses", password: pw } }),
        supabase.functions.invoke("admin-api", { body: { action: "get_sources", password: pw } }),
      ]);
      if (respData.data && !respData.data.error) {
        setResponses(respData.data.map(r => ({
          id: r.uid,
          source: r.source_code,
          timestamp: new Date(r.created_at).toLocaleString("th-TH"),
          timeTaken: r.time_taken,
          personal: r.personal_data,
          likert: r.likert_data,
          suggestion: r.suggestion,
          // Keep raw fields for export
          personal_data: r.personal_data,
          likert_data: r.likert_data,
          uid: r.uid,
          source_code: r.source_code,
          created_at: r.created_at,
          time_taken: r.time_taken,
          survey_version: r.survey_version,
          want_results: r.want_results,
          email: r.email,
        })));
      }
      if (srcData.data && !srcData.data.error) setSources(srcData.data);
    } catch (e) {
      console.error("Load error:", e);
    }
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



  // Source management via edge function
  const addSource = async () => {
    if (!newSourceName.trim()) return;
    setAddingSource(true);
    try {
      const nextCode = "src" + String(sources.length + 1).padStart(2, "0");
      await adminApi("add_source", {
        code: nextCode,
        name: newSourceName.trim(),
        region: newSourceRegion.trim() || null,
        target: parseInt(newSourceTarget) || 0,
      });
      setNewSourceName("");
      setNewSourceRegion("");
      setNewSourceTarget("");
      loadData();
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
    setAddingSource(false);
  };

  // Generate all region links at once
  const generateAllRegionLinks = async () => {
    setGeneratingAll(true);
    const existingCodes = sources.map(s => s.code);
    const toCreate = REGION_DATA.filter(r => !existingCodes.includes(r.code));
    if (toCreate.length === 0) {
      alert("ลิงก์ครบทุกภาคแล้ว");
      setGeneratingAll(false);
      return;
    }
    try {
      const rows = toCreate.map(r => ({
        code: r.code,
        name: r.name,
        region: r.name,
        target: r.target,
      }));
      await adminApi("add_sources_batch", { rows });
      alert(`สร้างลิงก์สำเร็จ ${toCreate.length} ภาค`);
      loadData();
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
    setGeneratingAll(false);
  };

  const toggleSource = async (id, currentActive) => {
    try {
      await adminApi("toggle_source", { id, is_active: !currentActive });
      loadData();
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  const deleteSource = async (id, code) => {
    const count = responses.filter(r => r.source === code).length;
    if (count > 0) {
      alert(`ไม่สามารถลบได้ เนื่องจากมีคำตอบ ${count} รายการจากแหล่งนี้`);
      return;
    }
    if (!confirm("ยืนยันการลบแหล่งที่มานี้?")) return;
    try {
      await adminApi("delete_source", { id });
      loadData();
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  const getSurveyLink = (code) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?src=${code}`;
  };

  const copyLink = (code) => {
    navigator.clipboard.writeText(getSurveyLink(code)).then(() => {
      alert("คัดลอกลิงก์แล้ว!");
    });
  };

  const printQR = (province, code) => {
    const link = getSurveyLink(code);
    const w = window.open("", "_blank", "width=500,height=700");
    w.document.write(`<html><head><title>QR - ${province}</title><style>
      body{font-family:'Sarabun',sans-serif;text-align:center;padding:40px}
      h2{margin:0 0 8px;font-size:22px}
      p{color:#666;font-size:14px;margin:4px 0}
      .qr{margin:24px auto}
      .link{font-size:11px;color:#999;word-break:break-all;margin-top:16px}
    </style></head><body>
      <h2>แบบสอบถามวิจัย</h2>
      <p style="font-size:18px;font-weight:700;color:#f59e0b">📍 ${province}</p>
      <p>โซลาร์รูฟท็อป — มหาวิทยาลัยธนบุรี</p>
      <div class="qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}" width="300" height="300"/></div>
      <p>สแกน QR Code เพื่อทำแบบสอบถาม</p>
      <p class="link">${link}</p>
      <script>setTimeout(()=>window.print(),600)</script>
    </body></html>`);
    w.document.close();
  };

  // --- Export helpers ---
  const getAllLikertIds = () => {
    const ids = [];
    LIKERT_SECTIONS.forEach(sec => sec.subsections.forEach(sub => sub.items.forEach(item => ids.push(item.id))));
    return ids;
  };

  const buildRows = (data) => {
    const likertIds = getAllLikertIds();
    return data.map(r => {
      const personal = r.personal_data || {};
      const likert = r.likert_data || {};
      const row = {
        uid: r.uid, source_code: r.source_code, 
        direct_link: getSurveyLink(r.source_code),
        created_at: r.created_at,
        time_taken: r.time_taken, survey_version: r.survey_version,
        want_results: r.want_results ? "ใช่" : "ไม่", email: r.email || "", suggestion: r.suggestion || "",
      };
      PERSONAL_QUESTIONS.forEach(q => { row[q.id] = personal[q.id] || ""; });
      likertIds.forEach(id => { row[id] = likert[id] || ""; });
      return row;
    });
  };

  const getHeaders = () => {
    const likertIds = getAllLikertIds();
    const base = ["uid", "source_code", "direct_link", "created_at", "time_taken", "survey_version", "want_results", "email", "suggestion"];
    return [...base, ...PERSONAL_QUESTIONS.map(q => q.id), ...likertIds];
  };

  const exportCSV = (data) => {
    if (!data.length) return alert("ไม่มีข้อมูลให้ export");
    const headers = getHeaders();
    const rows = buildRows(data);
    const csvContent = [
      headers.join(","),
      ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `survey_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportExcel = (data) => {
    if (!data.length) return alert("ไม่มีข้อมูลให้ export");
    const headers = getHeaders();
    const rows = buildRows(data);
    let table = "<table><tr>" + headers.map(h => `<th style="background:#059669;color:#fff;font-weight:bold">${h}</th>`).join("") + "</tr>";
    rows.forEach(r => { table += "<tr>" + headers.map(h => `<td>${r[h] ?? ""}</td>`).join("") + "</tr>"; });
    table += "</table>";
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Survey</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>${table}</body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `survey_export_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click(); URL.revokeObjectURL(url);
  };

  // --- Mplus Export ---
  const MPLUS_PERSONAL_MAP = {
    gender: "GENDER", age: "AGE", education: "EDUC",
    occupation: "OCCUP", income: "INCOME", experience: "EXPER",
    housing: "HOUSE", household: "HHSIZE", electricity_bill: "ELECB",
    peak_usage: "PEAK", ev_car: "EVCAR", solar_size: "SOLSZ",
    info_source: "INFOS",
  };

  const encodePersonal = (qId, value) => {
    const q = PERSONAL_QUESTIONS.find(p => p.id === qId);
    if (!q || !value) return -999;
    const idx = q.options.indexOf(value);
    return idx >= 0 ? idx + 1 : -999;
  };

  const getMplusVarNames = () => {
    const likertIds = getAllLikertIds();
    const personalVars = PERSONAL_QUESTIONS.map(q => MPLUS_PERSONAL_MAP[q.id]);
    const likertVars = likertIds.map(id => id.toUpperCase());
    return { personalVars, likertVars, allVars: [...personalVars, ...likertVars], likertIds };
  };

  const exportMplusDat = (data) => {
    if (!data.length) return alert("ไม่มีข้อมูลให้ export");
    const { likertIds } = getMplusVarNames();
    const lines = data.map(r => {
      const personal = r.personal_data || {};
      const likert = r.likert_data || {};
      const personalVals = PERSONAL_QUESTIONS.map(q => encodePersonal(q.id, personal[q.id]));
      const likertVals = likertIds.map(id => {
        const v = likert[id];
        return (v != null && v !== "") ? v : -999;
      });
      return [...personalVals, ...likertVals].join(" ");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `solar_survey.dat`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportMplusInp = (data) => {
    const { allVars, personalVars, likertVars } = getMplusVarNames();
    const n = data.length;
    const varLine = allVars.join(" ");

    const inp = `TITLE: Solar Rooftop Brand Trust SEM
  Influence of Brand Trust as Mediator on Solar Rooftop
  Installation Decision among Thai Consumers
  N = ${n};

DATA: FILE IS solar_survey.dat;

VARIABLE:
  NAMES ARE
    ${personalVars.join(" ")}
    ${likertVars.join("\n    ")};
  USEVARIABLES ARE
    ${likertVars.join("\n    ")};
  MISSING ARE ALL (-999);
  ! Categorical for personal data if needed:
  ! CATEGORICAL ARE ${personalVars.join(" ")};

ANALYSIS:
  TYPE = GENERAL;
  ESTIMATOR = MLR;
  ! Use WLSMV if treating as ordinal:
  ! ESTIMATOR = WLSMV;

MODEL:
  ! ===== Service Quality (SQ) - First Order =====
  ! Tangibility
  TANG BY SQ1_1 SQ1_2 SQ1_3;
  ! Reliability
  RELI BY SQ2_1 SQ2_2 SQ2_3;
  ! Responsiveness
  RESP BY SQ3_1 SQ3_2 SQ3_3;
  ! Assurance
  ASSU BY SQ4_1 SQ4_2 SQ4_3;
  ! Empathy
  EMPA BY SQ5_1 SQ5_2 SQ5_3;

  ! ===== Service Quality (SQ) - Second Order =====
  SQ BY TANG RELI RESP ASSU EMPA;

  ! ===== Product Quality (PQ) - First Order =====
  ! System Reliability
  SREL BY PQ1_1 PQ1_2 PQ1_3;
  ! Warranty
  WARR BY PQ2_1 PQ2_2 PQ2_3;
  ! Standards & Certification
  STAN BY PQ3_1 PQ3_2 PQ3_3;
  ! Value for Money
  VALU BY PQ4_1 PQ4_2 PQ4_3;

  ! ===== Product Quality (PQ) - Second Order =====
  PQ BY SREL WARR STAN VALU;

  ! ===== Brand Trust (BT) - First Order =====
  ! Brand Credibility
  BCRE BY BT1_1 BT1_2 BT1_3;
  ! Brand Benevolence
  BBEN BY BT2_1 BT2_2 BT2_3;

  ! ===== Brand Trust (BT) - Second Order =====
  BT BY BCRE BBEN;

  ! ===== Decision (DC) - First Order =====
  ! Problem Recognition
  PREC BY DC1_1 DC1_2 DC1_3;
  ! Information Search
  INFO BY DC2_1 DC2_2 DC2_3;
  ! Evaluation of Alternatives
  EVAL BY DC3_1 DC3_2 DC3_3;
  ! Purchase Decision
  PURC BY DC4_1 DC4_2 DC4_3;
  ! Post-Purchase Behavior
  POST BY DC5_1 DC5_2 DC5_3;

  ! ===== Decision (DC) - Second Order =====
  DC BY PREC INFO EVAL PURC POST;

  ! ===== Structural Model =====
  ! Direct effects
  BT ON SQ PQ;
  DC ON SQ PQ BT;

  ! ===== Indirect Effects (Mediation) =====
MODEL INDIRECT:
  DC IND SQ;
  DC IND PQ;

OUTPUT:
  SAMPSTAT STANDARDIZED MODINDICES(3.84)
  CINTERVAL RESIDUAL TECH1 TECH4;

! Variable Mapping Reference:
! SQ1_1-SQ1_3 = Tangibility (ความเป็นรูปธรรม)
! SQ2_1-SQ2_3 = Reliability (ความน่าเชื่อถือ)
! SQ3_1-SQ3_3 = Responsiveness (การตอบสนอง)
! SQ4_1-SQ4_3 = Assurance (ความมั่นใจ)
! SQ5_1-SQ5_3 = Empathy (ความเห็นอกเห็นใจ)
! PQ1_1-PQ1_3 = System Reliability (ความน่าเชื่อถือของระบบ)
! PQ2_1-PQ2_3 = Warranty (การรับประกัน)
! PQ3_1-PQ3_3 = Standards (มาตรฐานและการรับรอง)
! PQ4_1-PQ4_3 = Value for Money (ประสิทธิภาพเทียบราคา)
! BT1_1-BT1_3 = Brand Credibility (ความน่าเชื่อถือตราสินค้า)
! BT2_1-BT2_3 = Brand Benevolence (เจตนาดีตราสินค้า)
! DC1_1-DC1_3 = Problem Recognition (การรับรู้ปัญหา)
! DC2_1-DC2_3 = Information Search (การค้นหาข้อมูล)
! DC3_1-DC3_3 = Evaluation (การประเมินทางเลือก)
! DC4_1-DC4_3 = Purchase Decision (การตัดสินใจซื้อ)
! DC5_1-DC5_3 = Post-Purchase (พฤติกรรมหลังการซื้อ)
! GENDER = เพศ (1=ชาย, 2=หญิง, 3=อื่นๆ)
! AGE = อายุ (1=<30, 2=30-39, 3=40-49, 4=50-59, 5=60+)
! EDUC = การศึกษา (1=ต่ำกว่า ป.ตรี, 2=ป.ตรี, 3=สูงกว่า ป.ตรี, 4=อื่นๆ)
! OCCUP = อาชีพ (1=เอกชน, 2=ราชการ, 3=เจ้าของกิจการ, 4=เกษตรกร, 5=อื่นๆ)
! INCOME = รายได้ (1=<15k, 2=15-30k, 3=30-50k, 4=50k+)
! EXPER = ประสบการณ์ (1=<1ปี, 2=1-2ปี, 3=3-5ปี, 4=>5ปี)
! HOUSE = ที่อยู่อาศัย (1=บ้านเดี่ยว, 2=ทาวน์เฮาส์, 3=คอนโด, 4=อาคารพาณิชย์, 5=โรงงาน)
! HHSIZE = สมาชิกครัวเรือน (1=1-2, 2=3-4, 3=5-6, 4=>6)
! ELECB = ค่าไฟ (1=<2k, 2=2-5k, 3=5-10k, 4=>10k)
! PEAK = ช่วงใช้ไฟสูงสุด (1=กลางวัน, 2=กลางคืน, 3=ตลอดวัน)
! EVCAR = รถ EV (1=มี, 2=วางแผน, 3=ไม่สนใจ)
! SOLSZ = ขนาดโซลาร์ (1=<3kW, 2=3-5kW, 3=5-10kW, 4=>10kW)
! INFOS = แหล่งข้อมูล (1=โซเชียล, 2=เพื่อน/ญาติ, 3=ตัวแทน, 4=งานแสดง, 5=อื่นๆ)
`;
    const blob = new Blob([inp], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `solar_survey.inp`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportMplusCFA = (data) => {
    const { personalVars, likertVars } = getMplusVarNames();
    const n = data.length;

    const cfa = `TITLE: Solar Rooftop CFA - Measurement Model
  Confirmatory Factor Analysis (CFA)
  Test measurement model before running full SEM
  N = ${n};

DATA: FILE IS solar_survey.dat;

VARIABLE:
  NAMES ARE
    ${personalVars.join(" ")}
    ${likertVars.join("\n    ")};
  USEVARIABLES ARE
    ${likertVars.join("\n    ")};
  MISSING ARE ALL (-999);

ANALYSIS:
  TYPE = GENERAL;
  ESTIMATOR = MLR;
  ! Use WLSMV if treating as ordinal:
  ! ESTIMATOR = WLSMV;

MODEL:
  ! ============================================
  ! CFA: Measurement Model Only (No Structural)
  ! ============================================

  ! ===== Service Quality (SQ) - First Order =====
  TANG BY SQ1_1 SQ1_2 SQ1_3;
  RELI BY SQ2_1 SQ2_2 SQ2_3;
  RESP BY SQ3_1 SQ3_2 SQ3_3;
  ASSU BY SQ4_1 SQ4_2 SQ4_3;
  EMPA BY SQ5_1 SQ5_2 SQ5_3;

  ! ===== Service Quality (SQ) - Second Order =====
  SQ BY TANG RELI RESP ASSU EMPA;

  ! ===== Product Quality (PQ) - First Order =====
  SREL BY PQ1_1 PQ1_2 PQ1_3;
  WARR BY PQ2_1 PQ2_2 PQ2_3;
  STAN BY PQ3_1 PQ3_2 PQ3_3;
  VALU BY PQ4_1 PQ4_2 PQ4_3;

  ! ===== Product Quality (PQ) - Second Order =====
  PQ BY SREL WARR STAN VALU;

  ! ===== Brand Trust (BT) - First Order =====
  BCRE BY BT1_1 BT1_2 BT1_3;
  BBEN BY BT2_1 BT2_2 BT2_3;

  ! ===== Brand Trust (BT) - Second Order =====
  BT BY BCRE BBEN;

  ! ===== Decision (DC) - First Order =====
  PREC BY DC1_1 DC1_2 DC1_3;
  INFO BY DC2_1 DC2_2 DC2_3;
  EVAL BY DC3_1 DC3_2 DC3_3;
  PURC BY DC4_1 DC4_2 DC4_3;
  POST BY DC5_1 DC5_2 DC5_3;

  ! ===== Decision (DC) - Second Order =====
  DC BY PREC INFO EVAL PURC POST;

  ! ===== Latent Factor Correlations (freely estimated) =====
  SQ WITH PQ BT DC;
  PQ WITH BT DC;
  BT WITH DC;

OUTPUT:
  SAMPSTAT STANDARDIZED MODINDICES(3.84)
  CINTERVAL RESIDUAL TECH1 TECH4;

! ============================================
! Model Fit Criteria:
! Chi-square/df < 3.0 (acceptable), < 2.0 (good)
! CFI >= 0.90 (acceptable), >= 0.95 (good)
! TLI >= 0.90 (acceptable), >= 0.95 (good)
! RMSEA <= 0.08 (acceptable), <= 0.05 (good)
! SRMR <= 0.08 (acceptable), <= 0.05 (good)
! ============================================
! Convergent Validity:
! Factor loadings >= 0.50 (ideally >= 0.70)
! AVE >= 0.50
! CR >= 0.70
! ============================================
! Discriminant Validity:
! Square root of AVE > inter-factor correlations
! HTMT < 0.85 (strict) or < 0.90 (lenient)
! ============================================
! After CFA passes, run the full SEM (.inp)
! ============================================
`;
    const blob = new Blob([cfa], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `solar_survey_cfa.inp`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportMplusBoth = (data) => {
    exportMplusDat(data);
    setTimeout(() => exportMplusCFA(data), 300);
    setTimeout(() => exportMplusInp(data), 600);
  };

  const tabStyle = (isActive) => ({
    padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
    background: isActive ? "#ecfdf5" : "#f8fafc",
    color: isActive ? "#059669" : "#64748b", fontSize: 13, fontWeight: isActive ? 700 : 500,
    transition: "all 0.2s",
    borderBottom: isActive ? "2px solid #059669" : "2px solid transparent",
  });

  const chartCardStyle = {
    background: "#ffffff", borderRadius: 16,
    border: "1px solid #e2e8f0", padding: 24, marginBottom: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
          <p style={{ color: "#1e293b", margin: 0, fontWeight: 600 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color || "#059669", margin: "4px 0 0" }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f8fafc 100%)",
        fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
      }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 40, maxWidth: 380, width: "90%", textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Lock size={28} color="#059669" /></div>
          <h2 style={{ color: "#1e293b", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Admin Access</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px" }}>กรุณาใส่รหัสผ่านเพื่อเข้าใช้งาน</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (passwordInput === ADMIN_PASSWORD) {
              sessionStorage.setItem("admin_pw", passwordInput);
              setAuthenticated(true);
              setPasswordError("");
            } else {
              setPasswordError("รหัสผ่านไม่ถูกต้อง");
            }
          }}>
            <input
              type="password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(""); }}
              placeholder="ใส่รหัสผ่าน"
              autoFocus
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 10, border: passwordError ? "1.5px solid #ef4444" : "1.5px solid #d1d5db",
                background: "#f8fafc", color: "#1e293b", fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 8,
                textAlign: "center", letterSpacing: 4,
              }}
            />
            {passwordError && <p style={{ color: "#ef4444", fontSize: 13, margin: "4px 0 8px" }}>{passwordError}</p>}
            <button type="submit" style={{
              width: "100%", padding: "12px 0", borderRadius: 10, border: "none", marginTop: 8,
              background: "linear-gradient(135deg, #059669, #10b981)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer",
            }}>
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f8fafc 100%)",
        fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif", color: "#1e293b",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: "#64748b" }}>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 25%, #f8fafc 50%, #f0fdf4 75%, #e8f5e9 100%)",
      padding: "20px", fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
      color: "#1e293b",
      borderTop: "4px solid #059669",
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#059669", display: "flex", alignItems: "center", gap: 8 }}><LayoutDashboard size={22} /> Admin Dashboard</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>รายงานผลแบบสอบถาม</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setShowPreview(true)} style={{
              padding: "8px 20px", border: "1px solid rgba(16,185,129,0.4)",
              borderRadius: 8, background: "linear-gradient(135deg, #059669, #10b981)", color: "#fff",
              cursor: "pointer", fontSize: 13, fontWeight: 700,
            }}><Eye size={14} style={{ marginRight: 4 }} /> Preview & Export ({responses.length} รายการ)</button>
            <button onClick={loadData} style={{
              padding: "8px 20px", border: "1px solid #d1d5db",
              borderRadius: 8, background: "#fff", color: "#1e293b",
              cursor: "pointer", fontSize: 13,
            }}><RefreshCw size={14} style={{ marginRight: 4 }} /> รีเฟรช</button>
            <button onClick={() => navigate("/")} style={{
              padding: "8px 20px", border: "1px solid #d1d5db",
              borderRadius: 8, background: "#fff", color: "#1e293b",
              cursor: "pointer", fontSize: 13,
            }}><ArrowLeft size={14} style={{ marginRight: 4 }} /> กลับ</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
           {[
             { label: "ตอบทั้งหมด", value: filtered.length, icon: <FileText size={24} color="#059669" /> },
             { label: "เวลาเฉลี่ย", value: filtered.length ? formatTime(Math.round(calcMean(filtered.map(r => r.timeTaken)))) : "-", icon: <ClipboardList size={24} color="#059669" /> },
             { label: "แหล่งที่มา", value: new Set(filtered.map(r => r.source)).size, icon: <Link2 size={24} color="#059669" /> },
             { label: "คะแนนเฉลี่ยรวม", value: filtered.length ? calcMean(sectionAverages.map(s => s.mean)).toFixed(2) : "-", icon: <TrendingUp size={24} color="#059669" /> },
           ].map((card, i) => (
             <div key={i} style={{
               background: "#fff", borderRadius: 12, padding: 20,
               border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
             }}>
               <div style={{ marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#059669" }}>{card.value}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Source Filter */}
        <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button onClick={() => setSelectedSource("all")} style={{
            padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
            background: selectedSource === "all" ? "#059669" : "#f1f5f9",
            color: selectedSource === "all" ? "#fff" : "#64748b", fontSize: 12, fontWeight: 600,
          }}>ทั้งหมด ({responses.length})</button>
          {sources.map(src => {
            const count = responses.filter(r => r.source === src.code).length;
            return (
              <button key={src.code} onClick={() => setSelectedSource(src.code)} style={{
                padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                background: selectedSource === src.code ? "#059669" : "#f1f5f9",
                color: selectedSource === src.code ? "#fff" : "#64748b", fontSize: 12, fontWeight: 600,
              }}>{src.name} ({count})</button>
            );
          })}
        </div>


        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, borderBottom: "1px solid #e2e8f0", paddingBottom: 12, flexWrap: "wrap" }}>
           <button onClick={() => setActiveTab("overview")} style={tabStyle(activeTab === "overview")}><TrendingUp size={14} style={{ marginRight: 4 }} /> ภาพรวม</button>
           <button onClick={() => setActiveTab("sampling")} style={tabStyle(activeTab === "sampling")}><Target size={14} style={{ marginRight: 4 }} /> เป้าหมาย</button>
           <button onClick={() => setActiveTab("demographics")} style={tabStyle(activeTab === "demographics")}><Users size={14} style={{ marginRight: 4 }} /> ข้อมูลผู้ตอบ</button>
           <button onClick={() => setActiveTab("crosstab")} style={tabStyle(activeTab === "crosstab")}><Table2 size={14} style={{ marginRight: 4 }} /> Cross-tab</button>
           <button onClick={() => setActiveTab("details")} style={tabStyle(activeTab === "details")}><ClipboardList size={14} style={{ marginRight: 4 }} /> ตารางละเอียด</button>
           <button onClick={() => setActiveTab("individual")} style={tabStyle(activeTab === "individual")}><FileText size={14} style={{ marginRight: 4 }} /> รายบุคคล</button>
           <button onClick={() => setActiveTab("links")} style={tabStyle(activeTab === "links")}><Link2 size={14} style={{ marginRight: 4 }} /> จัดการลิงก์</button>
        </div>

        {filtered.length === 0 && activeTab !== "links" && activeTab !== "sampling" && (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p>ยังไม่มีข้อมูลที่ส่งเข้ามา</p>
          </div>
        )}

        {/* SAMPLING / TARGET TAB */}
        {activeTab === "sampling" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "กลุ่มตัวอย่างทั้งหมด", value: TOTAL_TARGET, sub: "Quota Target" },
                { label: "ร้าน PSI ทั้งหมด", value: TOTAL_SHOPS, sub: "Population" },
                { label: "อัตราสุ่มตัวอย่าง", value: ((TOTAL_TARGET / TOTAL_SHOPS) * 100).toFixed(1) + "%", sub: "Sampling Rate" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#f1f5f9", borderRadius: 12, padding: 20, textAlign: "center", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#1e293b" }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Overall progress */}
            <div style={chartCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#10b981", margin: 0 }}>ความคืบหน้าการเก็บข้อมูลรวม</h3>
                <span style={{ fontSize: 24, fontWeight: 800, color: responses.length >= TOTAL_TARGET ? "#10b981" : "#059669" }}>
                  {responses.length} / {TOTAL_TARGET}
                </span>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: 10, height: 24, overflow: "hidden", position: "relative" }}>
                <div style={{
                  width: `${Math.min((responses.length / TOTAL_TARGET) * 100, 100)}%`,
                  height: "100%", borderRadius: 10,
                  background: responses.length >= TOTAL_TARGET ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #059669, #10b981)",
                  transition: "width 0.5s ease",
                }} />
                <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                  {((responses.length / TOTAL_TARGET) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Region-level progress */}
            {REGION_DATA.map(reg => {
              const regionCollected = responses.filter(r => r.source === reg.code).length;
              const regionPct = reg.target > 0 ? Math.min((regionCollected / reg.target) * 100, 100) : 0;

              // Count province distribution from personal_data.province
              const provinceCounts = {};
              reg.provinces.forEach(p => provinceCounts[p] = 0);
              responses.filter(r => r.source === reg.code).forEach(r => {
                const prov = (typeof r.personal === 'object' ? r.personal : r.personal_data)?.province;
                if (prov && provinceCounts.hasOwnProperty(prov)) {
                  provinceCounts[prov]++;
                } else if (prov) {
                  provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
                }
              });

              return (
                <div key={reg.name} style={{ ...chartCardStyle, borderLeft: `4px solid ${reg.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: reg.color, margin: 0 }}>{reg.name}</h3>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Code: {reg.code} · {reg.provinces.length} จังหวัด</span>
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 800, color: regionCollected >= reg.target ? "#10b981" : reg.color }}>
                      {regionCollected} / {reg.target}
                    </span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: 8, height: 16, overflow: "hidden", position: "relative", marginBottom: 16 }}>
                    <div style={{ width: `${regionPct}%`, height: "100%", borderRadius: 8, background: regionCollected >= reg.target ? "#10b981" : reg.color, transition: "width 0.3s" }} />
                    <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 10, fontWeight: 700, color: "#fff" }}>{regionPct.toFixed(0)}%</span>
                  </div>

                  {/* Province breakdown from survey responses */}
                  {Object.keys(provinceCounts).some(p => provinceCounts[p] > 0) && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                      {Object.entries(provinceCounts).map(([prov, count]) => (
                        <div key={prov} style={{
                          background: "#f8fafc", borderRadius: 10, padding: "8px 12px",
                          border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                          <span style={{ fontSize: 12, color: "#1e293b" }}>📍 {prov}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: count > 0 ? "#059669" : "#64748b" }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Methodology */}
            <div style={chartCardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 12px" }}>วิธีการสุ่มตัวอย่าง</h3>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", lineHeight: 2, fontSize: 14, color: "#334155" }}>
                <p style={{ margin: "0 0 8px" }}>ใช้ <strong style={{ color: "#059669" }}>Proportional Quota Sampling</strong> (การสุ่มแบบโควตาตามสัดส่วน) โดย:</p>
                <ol style={{ paddingLeft: 24, margin: 0 }}>
                  <li>แบ่งชั้นภูมิ (strata) ตามภูมิภาค 7 ภาค</li>
                  <li>แต่ละภาคมี QR Code และลิงก์เฉพาะ (รวม 7 ลิงก์)</li>
                  <li>ในแบบสอบถามจะถามจังหวัดที่ติดตั้ง โดยกรองตามภาคที่ลิงก์ระบุ</li>
                  <li>สามารถ cross-validate ข้อมูลจังหวัดกับภาคที่ส่งลิงก์ได้</li>
                  <li>จัดสรรกลุ่มตัวอย่าง {TOTAL_TARGET} คน ตามสัดส่วน</li>
                </ol>
              </div>
            </div>
          </>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && filtered.length > 0 && (
          <>
            <div style={chartCardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#059669", margin: "0 0 20px" }}>คะแนนเฉลี่ยรายปัจจัย</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectionAverages} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Radar name="ค่าเฉลี่ย" dataKey="mean" stroke="#059669" fill="#059669" fillOpacity={0.25} strokeWidth={2} />
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
                    <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
          <div>
            {/* Chart type selector */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "#f0fdf4", padding: 6, borderRadius: 12, width: "fit-content" }}>
              {[
                 { key: "pie", icon: <PieChartIcon size={14} />, label: "Donut" },
                 { key: "bar", icon: <BarChart3 size={14} />, label: "Bar" },
                 { key: "hbar", icon: <BarChartHorizontal size={14} />, label: "Horizontal" },
                 { key: "radar", icon: <RadarIcon size={14} />, label: "Radar" },
              ].map(t => (
                <button key={t.key} onClick={() => setDemoChartType(t.key)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                    background: demoChartType === t.key ? "#059669" : "transparent",
                    color: demoChartType === t.key ? "#fff" : "#64748b",
                    transition: "all 0.2s",
                  }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
              {personalCharts.map((chart, ci) => (
                <div key={ci} style={chartCardStyle}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>{chart.question}</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    {demoChartType === "pie" ? (
                      <PieChart>
                        <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                          label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}>
                          {chart.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    ) : demoChartType === "bar" ? (
                      <BarChart data={chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} angle={-25} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="จำนวน" radius={[6, 6, 0, 0]}>
                          {chart.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    ) : demoChartType === "hbar" ? (
                      <BarChart data={chart.data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#64748b" }} width={120} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="จำนวน" radius={[0, 6, 6, 0]}>
                          {chart.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    ) : (
                      <RadarChart cx="50%" cy="50%" outerRadius={80} data={chart.data}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                        <PolarRadiusAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <Radar dataKey="value" name="จำนวน" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CROSS-TABULATION TAB */}
        {activeTab === "crosstab" && filtered.length > 0 && (() => {
          const rowQ = PERSONAL_QUESTIONS.find(q => q.id === crossRowVar);
          const colQ = PERSONAL_QUESTIONS.find(q => q.id === crossColVar);
          if (!rowQ || !colQ) return <p>กรุณาเลือกตัวแปร</p>;

          // Build cross-tab matrix
          const matrix = {};
          const colTotals = {};
          rowQ.options.forEach(r => { matrix[r] = {}; colQ.options.forEach(c => { matrix[r][c] = 0; }); });
          colQ.options.forEach(c => { colTotals[c] = 0; });
          let grandTotal = 0;

          filtered.forEach(resp => {
            const rVal = resp.personal?.[crossRowVar];
            const cVal = resp.personal?.[crossColVar];
            if (rVal && cVal && matrix[rVal] && matrix[rVal][cVal] !== undefined) {
              matrix[rVal][cVal]++;
              colTotals[cVal]++;
              grandTotal++;
            }
          });

          const rowTotals = {};
          rowQ.options.forEach(r => { rowTotals[r] = colQ.options.reduce((sum, c) => sum + matrix[r][c], 0); });

          const cellBg = (val) => {
            if (val === 0) return "transparent";
            const intensity = Math.min(val / Math.max(grandTotal * 0.15, 1), 1);
            return `rgba(5, 150, 105, ${0.08 + intensity * 0.25})`;
          };

          return (
            <div style={chartCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: 8 }}><Table2 size={18} /> Cross-Tabulation</h2>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{ fontSize: 13, color: "#64748b" }}>
                    แถว:
                    <select value={crossRowVar} onChange={e => setCrossRowVar(e.target.value)}
                      style={{ marginLeft: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", cursor: "pointer" }}>
                      {PERSONAL_QUESTIONS.map(q => <option key={q.id} value={q.id}>{q.text}</option>)}
                    </select>
                  </label>
                  <span style={{ color: "#cbd5e1", fontWeight: 700 }}>×</span>
                  <label style={{ fontSize: 13, color: "#64748b" }}>
                    คอลัมน์:
                    <select value={crossColVar} onChange={e => setCrossColVar(e.target.value)}
                      style={{ marginLeft: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", cursor: "pointer" }}>
                      {PERSONAL_QUESTIONS.map(q => <option key={q.id} value={q.id}>{q.text}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              {crossRowVar === crossColVar ? (
                <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", padding: 24 }}>⚠️ กรุณาเลือกตัวแปรที่แตกต่างกัน</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f0fdf4" }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", color: "#059669", fontWeight: 700, borderBottom: "2px solid #059669", minWidth: 140 }}>
                          {rowQ.text} ↓ / {colQ.text} →
                        </th>
                        {colQ.options.map(c => (
                          <th key={c} style={{ padding: "10px 8px", textAlign: "center", color: "#059669", fontWeight: 600, borderBottom: "2px solid #059669", fontSize: 12, minWidth: 80 }}>{c}</th>
                        ))}
                        <th style={{ padding: "10px 8px", textAlign: "center", color: "#1e293b", fontWeight: 700, borderBottom: "2px solid #1e293b", background: "#f8fafc", minWidth: 60 }}>รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowQ.options.map((r, ri) => (
                        <tr key={r} style={{ borderBottom: "1px solid #f1f5f9", background: ri % 2 === 0 ? "#fff" : "#fafffe" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "#334155" }}>{r}</td>
                          {colQ.options.map(c => (
                            <td key={c} style={{ padding: "10px 8px", textAlign: "center", color: "#1e293b", background: cellBg(matrix[r][c]) }}>
                              {matrix[r][c] > 0 ? (
                                <div>
                                  <span style={{ fontWeight: 700 }}>{matrix[r][c]}</span>
                                  <span style={{ display: "block", fontSize: 10, color: "#64748b" }}>
                                    ({grandTotal > 0 ? ((matrix[r][c] / grandTotal) * 100).toFixed(1) : 0}%)
                                  </span>
                                </div>
                              ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                            </td>
                          ))}
                          <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 700, color: "#059669", background: "#f0fdf4" }}>
                            {rowTotals[r]}
                            <span style={{ display: "block", fontSize: 10, color: "#64748b" }}>
                              ({grandTotal > 0 ? ((rowTotals[r] / grandTotal) * 100).toFixed(1) : 0}%)
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1e293b" }}>รวม</td>
                        {colQ.options.map(c => (
                          <td key={c} style={{ padding: "10px 8px", textAlign: "center", fontWeight: 700, color: "#059669" }}>
                            {colTotals[c]}
                            <span style={{ display: "block", fontSize: 10, color: "#64748b" }}>
                              ({grandTotal > 0 ? ((colTotals[c] / grandTotal) * 100).toFixed(1) : 0}%)
                            </span>
                          </td>
                        ))}
                        <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 800, color: "#1e293b", background: "#e2e8f0" }}>
                          {grandTotal}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Chi-Square approximation */}
                  {grandTotal > 0 && (() => {
                    let chiSq = 0;
                    rowQ.options.forEach(r => {
                      colQ.options.forEach(c => {
                        const observed = matrix[r][c];
                        const expected = (rowTotals[r] * colTotals[c]) / grandTotal;
                        if (expected > 0) chiSq += Math.pow(observed - expected, 2) / expected;
                      });
                    });
                    const df = (rowQ.options.length - 1) * (colQ.options.length - 1);
                    const cramerV = Math.sqrt(chiSq / (grandTotal * (Math.min(rowQ.options.length, colQ.options.length) - 1)));
                    const strength = cramerV >= 0.5 ? "สูง" : cramerV >= 0.3 ? "ปานกลาง" : cramerV >= 0.1 ? "ต่ำ" : "ไม่มีนัยสำคัญ";
                    const strengthColor = cramerV >= 0.5 ? "#059669" : cramerV >= 0.3 ? "#3b82f6" : cramerV >= 0.1 ? "#f59e0b" : "#94a3b8";

                    return (
                      <div style={{ marginTop: 16, padding: 16, background: "#f8fafc", borderRadius: 12, display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13 }}>
                        <div><span style={{ color: "#64748b" }}>Chi-Square (χ²):</span> <strong style={{ color: "#1e293b" }}>{chiSq.toFixed(3)}</strong></div>
                        <div><span style={{ color: "#64748b" }}>df:</span> <strong style={{ color: "#1e293b" }}>{df}</strong></div>
                        <div><span style={{ color: "#64748b" }}>Cramér's V:</span> <strong style={{ color: "#1e293b" }}>{cramerV.toFixed(3)}</strong></div>
                        <div><span style={{ color: "#64748b" }}>ความสัมพันธ์:</span> <strong style={{ color: strengthColor }}>{strength}</strong></div>
                        <div><span style={{ color: "#64748b" }}>N:</span> <strong style={{ color: "#1e293b" }}>{grandTotal}</strong></div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })()}


        {activeTab === "details" && filtered.length > 0 && LIKERT_SECTIONS.map((sec, si) => (
          <div key={sec.id} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: SECTION_COLORS[si], marginBottom: 16, borderBottom: `2px solid ${SECTION_COLORS[si]}33`, paddingBottom: 8 }}>
              {sec.title}
            </h2>
            {sec.subsections.map(sub => {
              const stats = computeSectionStats(sub.items, filtered);
              return (
                <div key={sub.id} style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#334155", margin: "0 0 8px" }}>{sub.title}</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9" }}>
                          <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: 600 }}>ข้อคำถาม</th>
                          <th style={{ textAlign: "center", padding: "8px 12px", color: "#64748b", fontWeight: 600, width: 50 }}>n</th>
                          <th style={{ textAlign: "center", padding: "8px 12px", color: "#64748b", fontWeight: 600, width: 70 }}>X̄</th>
                          <th style={{ textAlign: "center", padding: "8px 12px", color: "#64748b", fontWeight: 600, width: 70 }}>S.D.</th>
                          <th style={{ textAlign: "center", padding: "8px 12px", color: "#64748b", fontWeight: 600, width: 80 }}>แปลผล</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map(st => {
                          const level = st.mean >= 4.5 ? "มากที่สุด" : st.mean >= 3.5 ? "มาก" : st.mean >= 2.5 ? "ปานกลาง" : st.mean >= 1.5 ? "น้อย" : "น้อยที่สุด";
                          return (
                            <tr key={st.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 12px", color: "#1e293b" }}>{st.text}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#64748b" }}>{st.n}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#059669", fontWeight: 700 }}>{st.mean.toFixed(2)}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#64748b" }}>{st.sd.toFixed(2)}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#1e293b", fontSize: 12 }}>{level}</td>
                            </tr>
                          );
                        })}
                        {(() => {
                          const allVals = sub.items.flatMap(item => filtered.map(r => r.likert?.[item.id]).filter(v => v != null));
                          return (
                            <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                              <td style={{ padding: "8px 12px", color: SECTION_COLORS[si] }}>เฉลี่ยรวม</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#64748b" }}>{allVals.length}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: SECTION_COLORS[si] }}>{calcMean(allVals).toFixed(2)}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#64748b" }}>{calcSD(allVals).toFixed(2)}</td>
                              <td style={{ textAlign: "center", padding: "8px 12px", color: "#1e293b", fontSize: 12 }}>
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

        {/* INDIVIDUAL RESPONSES TAB */}
        {activeTab === "individual" && filtered.length > 0 && (
          <div>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
               <h2 style={{ fontSize: 18, fontWeight: 700, color: "#059669", margin: 0 }}>
                 คำตอบรายบุคคล ({filtered.length} ราย)
               </h2>
               <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                 <span style={{ color: "#64748b" }}>แสดง</span>
                 {[20, 40, 60, 80, 100].map(n => (
                   <button key={n} onClick={() => { setIndivPageSize(n); setIndivPage(1); }}
                     style={{
                       padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                       background: indivPageSize === n ? "#059669" : "#f1f5f9",
                       color: indivPageSize === n ? "#fff" : "#64748b",
                       transition: "all 0.2s",
                     }}>{n}</button>
                 ))}
                 <span style={{ color: "#64748b" }}>รายการ/หน้า</span>
               </div>
             </div>

             {(() => {
               const totalPages = Math.ceil(filtered.length / indivPageSize);
               const paged = filtered.slice((indivPage - 1) * indivPageSize, indivPage * indivPageSize);
               const startIdx = (indivPage - 1) * indivPageSize;
               return (
                 <>
                   <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                     {paged.map((r, idx) => {
                       const isExpanded = expandedResponse === r.uid;
                       const personal = r.personal || r.personal_data || {};
                       const likert = r.likert || r.likert_data || {};
                       return (
                         <div key={r.uid} style={{
                           background: "#f8fafc", borderRadius: 12,
                           border: isExpanded ? "1px solid #059669" : "1px solid #e2e8f0",
                           overflow: "hidden",
                         }}>
                           {/* Row header - clickable */}
                           <div
                             onClick={() => setExpandedResponse(isExpanded ? null : r.uid)}
                             style={{
                               padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                               background: isExpanded ? "#f0fdf4" : "transparent",
                             }}
                           >
                             <span style={{ fontSize: 13, color: "#64748b", minWidth: 30 }}>#{startIdx + idx + 1}</span>
                             <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", flex: 1 }}>
                               {personal.gender || "-"} · {personal.age || "-"} · {personal.province || (SOURCES[r.source] || r.source)}
                             </span>
                             <span style={{ fontSize: 11, color: "#64748b" }}>{r.timestamp}</span>
                             <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6 }}>
                               ⏱ {formatTime(r.timeTaken)}
                             </span>
                             {r.want_results && <span style={{ fontSize: 11, color: "#10b981" }}>📧</span>}
                             <span style={{ color: "#64748b", fontSize: 16, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                           </div>

                           {/* Expanded detail */}
                           {isExpanded && (
                             <div style={{ padding: "0 16px 16px", borderTop: "1px solid #e2e8f0" }}>
                               {/* Personal data */}
                               <div style={{ marginTop: 12, marginBottom: 16 }}>
                                 <h4 style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", margin: "0 0 8px" }}>ข้อมูลทั่วไป</h4>
                                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 0 }}>
                                   {PERSONAL_QUESTIONS.map((q, qi) => (
                                     <div key={q.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: qi % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
                                       <span style={{ color: "#64748b" }}>{q.text}</span>
                                       <span style={{ color: "#1e293b", fontWeight: 600 }}>{personal[q.id] || "-"}</span>
                                     </div>
                                   ))}
                                   {personal.province && (
                                     <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#fff", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
                                       <span style={{ color: "#64748b" }}>จังหวัด</span>
                                       <span style={{ color: "#1e293b", fontWeight: 600 }}>{personal.province}</span>
                                     </div>
                                   )}
                                 </div>
                                 {r.email && (
                                   <div style={{ marginTop: 6, padding: "6px 10px", background: "rgba(16,185,129,0.08)", borderRadius: 8, fontSize: 12, color: "#10b981" }}>
                                     📧 {r.email} (ต้องการรับผลวิจัย)
                                   </div>
                                 )}
                               </div>

                               {/* Likert data by section */}
                               {LIKERT_SECTIONS.map((sec, si) => (
                                 <div key={sec.id} style={{ marginBottom: 12 }}>
                                   <h4 style={{ fontSize: 13, fontWeight: 700, color: SECTION_COLORS[si], margin: "0 0 6px" }}>{sec.title}</h4>
                                   {sec.subsections.map(sub => (
                                     <div key={sub.id} style={{ marginBottom: 8 }}>
                                       <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, paddingLeft: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>{sub.title}</div>
                                       <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                         {sub.items.map((item, itemIdx) => {
                                           const val = likert[item.id];
                                           return (
                                             <div key={item.id} style={{
                                               display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                                               background: itemIdx % 2 === 0 ? "#fafafa" : "#fff",
                                               borderBottom: "1px solid #f1f5f9", fontSize: 12,
                                             }}>
                                               <span style={{ flex: 1, color: "#334155", lineHeight: 1.4 }}>{item.text}</span>
                                               <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                                                 {[1,2,3,4,5].map(n => (
                                                   <span key={n} style={{
                                                     width: 22, height: 22, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                                                     fontSize: 11, fontWeight: 700,
                                                     background: val === n ? SECTION_COLORS[si] : "#f1f5f9",
                                                     color: val === n ? "#fff" : "#64748b",
                                                   }}>{n}</span>
                                                 ))}
                                               </div>
                                             </div>
                                           );
                                         })}
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               ))}

                               {/* Suggestion */}
                               {r.suggestion && (
                                 <div style={{ marginTop: 8, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#059669", lineHeight: 1.6 }}>
                                   💬 {r.suggestion}
                                 </div>
                               )}

                               {/* Meta */}
                               <div style={{ marginTop: 8, display: "flex", gap: 12, fontSize: 11, color: "#64748b" }}>
                                 <span>UID: {r.uid}</span>
                                 <span>Source: {r.source_code || r.source}</span>
                                 <span>Version: {r.survey_version}</span>
                               </div>
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>

                   {/* Pagination */}
                   {totalPages > 1 && (
                     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 20 }}>
                       <button onClick={() => setIndivPage(p => Math.max(1, p - 1))} disabled={indivPage === 1}
                         style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: indivPage === 1 ? "#f8fafc" : "#fff", color: indivPage === 1 ? "#cbd5e1" : "#1e293b", cursor: indivPage === 1 ? "default" : "pointer", fontSize: 13 }}>←</button>
                       {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                         <button key={p} onClick={() => setIndivPage(p)}
                           style={{
                             padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                             background: indivPage === p ? "#059669" : "#f1f5f9",
                             color: indivPage === p ? "#fff" : "#64748b",
                           }}>{p}</button>
                       ))}
                       <button onClick={() => setIndivPage(p => Math.min(totalPages, p + 1))} disabled={indivPage === totalPages}
                         style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: indivPage === totalPages ? "#f8fafc" : "#fff", color: indivPage === totalPages ? "#cbd5e1" : "#1e293b", cursor: indivPage === totalPages ? "default" : "pointer", fontSize: 13 }}>→</button>
                       <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>หน้า {indivPage}/{totalPages} · แสดง {startIdx + 1}-{Math.min(indivPage * indivPageSize, filtered.length)} จาก {filtered.length}</span>
                     </div>
                   )}
                 </>
               );
             })()}
           </div>
         )}

        {/* LINKS TAB */}
        {activeTab === "links" && (
          <div>
            {/* Actions bar */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={generateAllRegionLinks}
                disabled={generatingAll}
                style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  color: "#fff", fontSize: 15, fontWeight: 700, cursor: generatingAll ? "not-allowed" : "pointer",
                }}
              >
                {generatingAll ? "⏳ กำลังสร้าง..." : `🚀 สร้างลิงก์ทุกภาค (${REGION_DATA.length} ภาค)`}
              </button>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                ลิงก์ที่สร้างแล้ว: <strong style={{ color: "#059669" }}>{sources.length}</strong> / {REGION_DATA.length}
              </span>
            </div>

            {/* Add custom source */}
            <div style={{ ...chartCardStyle, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#64748b", margin: "0 0 12px" }}>➕ เพิ่มแหล่งที่มาเพิ่มเติม (กรณีพิเศษ)</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  value={newSourceName}
                  onChange={e => setNewSourceName(e.target.value)}
                  placeholder="ชื่อแหล่ง"
                  style={{ flex: 1, minWidth: 150, padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", background: "#f1f5f9", color: "#1e293b", fontSize: 13, outline: "none" }}
                />
                <select value={newSourceRegion} onChange={e => setNewSourceRegion(e.target.value)}
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", background: "#f1f5f9", color: "#1e293b", fontSize: 13, outline: "none" }}>
                  <option value="">-- ภาค --</option>
                  {REGIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
                <input type="number" value={newSourceTarget} onChange={e => setNewSourceTarget(e.target.value)} placeholder="เป้าหมาย"
                  style={{ width: 80, padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", background: "#f1f5f9", color: "#1e293b", fontSize: 13, outline: "none", textAlign: "center" }} />
                <button onClick={addSource} disabled={addingSource || !newSourceName.trim()}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: newSourceName.trim() ? "#059669" : "#e2e8f0", color: newSourceName.trim() ? "#fff" : "#64748b", fontSize: 13, fontWeight: 700, cursor: newSourceName.trim() ? "pointer" : "not-allowed" }}>
                  {addingSource ? "..." : "+ เพิ่ม"}
                </button>
              </div>
            </div>

            {/* Province links grouped by region */}
            {REGIONS.map(reg => {
              const regionSources = sources.filter(s => s.region === reg.name);
              if (regionSources.length === 0) return null;
              return (
                <div key={reg.name} style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: reg.color, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: reg.color }} />
                    {reg.name} ({regionSources.length} ลิงก์)
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    {regionSources.map(src => {
                      const count = responses.filter(r => r.source === src.code).length;
                      const tgt = src.target || 0;
                      const pct = tgt > 0 ? Math.min((count / tgt) * 100, 100) : 0;
                      const link = getSurveyLink(src.code);
                      return (
                        <div key={src.id} style={{
                          background: "#f8fafc", borderRadius: 14, padding: 16,
                          border: `1px solid ${count >= tgt && tgt > 0 ? "rgba(16,185,129,0.3)" : "#e2e8f0"}`,
                        }}>
                          {/* Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div>
                              <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>📍 {src.name}</span>
                              <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8, background: "#f1f5f9", padding: "2px 8px", borderRadius: 6 }}>{src.code}</span>
                            </div>
                            <span style={{
                              background: count >= tgt && tgt > 0 ? "#ecfdf5" : "#f0fdf4",
                              color: count >= tgt && tgt > 0 ? "#10b981" : "#059669",
                              padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                            }}>{count}{tgt > 0 ? ` / ${tgt}` : ""}</span>
                          </div>

                          {/* Progress bar */}
                          {tgt > 0 && (
                            <div style={{ background: "#e2e8f0", borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 12 }}>
                              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: count >= tgt ? "#10b981" : reg.color, transition: "width 0.3s" }} />
                            </div>
                          )}

                          {/* QR Code */}
                          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                            <div style={{ background: "#fff", borderRadius: 10, padding: 8, flexShrink: 0 }}>
                              <QRCodeSVG value={link} size={100} level="M" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, wordBreak: "break-all", lineHeight: 1.5 }}>{link}</div>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button onClick={() => copyLink(src.code)} style={{
                                  padding: "6px 14px", borderRadius: 8, border: "none",
                                  background: "rgba(59,130,246,0.15)", color: "#3b82f6",
                                  cursor: "pointer", fontSize: 11, fontWeight: 600,
                                }}><Copy size={11} style={{ marginRight: 3 }} /> คัดลอก</button>
                                <button onClick={() => printQR(src.name, src.code)} style={{
                                  padding: "6px 14px", borderRadius: 8, border: "none",
                                  background: "rgba(168,85,247,0.15)", color: "#a855f7",
                                  cursor: "pointer", fontSize: 11, fontWeight: 600,
                                }}><Printer size={11} style={{ marginRight: 3 }} /> พิมพ์ QR</button>
                                <button onClick={() => toggleSource(src.id, src.is_active)} style={{
                                  padding: "6px 14px", borderRadius: 8, border: "none",
                                  background: src.is_active ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                  color: src.is_active ? "#10b981" : "#ef4444",
                                  cursor: "pointer", fontSize: 11, fontWeight: 600,
                                }}>{src.is_active ? "✅" : "❌"}</button>
                                <button onClick={() => deleteSource(src.id, src.code)} style={{
                                  padding: "6px 14px", borderRadius: 8, border: "none",
                                  background: "rgba(239,68,68,0.1)", color: "#ef4444",
                                  cursor: "pointer", fontSize: 11, fontWeight: 600,
                                }}>🗑</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* Preview & Export Modal */}
      {showPreview && (() => {
        const previewData = responses;
        const headers = getHeaders();
        const rows = buildRows(previewData);
        const previewRows = rows.slice(0, 10);
        const likertIds = getAllLikertIds();
        const personalIds = PERSONAL_QUESTIONS.map(q => q.id);

        // Summary stats
        const totalLikert = likertIds.length;
        const filledCounts = previewData.map(r => {
          const ld = r.likert_data || {};
          return likertIds.filter(id => ld[id] != null && ld[id] !== "").length;
        });
        const avgFilled = filledCounts.length ? (filledCounts.reduce((a,b) => a+b, 0) / filledCounts.length).toFixed(1) : 0;
        const completePct = filledCounts.length ? ((filledCounts.filter(c => c === totalLikert).length / filledCounts.length) * 100).toFixed(1) : 0;

        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }} onClick={() => setShowPreview(false)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "#fff", borderRadius: 20, maxWidth: 960, width: "100%", maxHeight: "90vh",
              display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}>
              {/* Modal Header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}><Eye size={20} /> ตัวอย่างข้อมูลก่อน Export</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>แสดง 10 รายการแรกจากทั้งหมด {previewData.length} รายการ · {headers.length} คอลัมน์</p>
                </div>
                <button onClick={() => setShowPreview(false)} style={{
                  width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc",
                  cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b",
                }}>✕</button>
              </div>

              {/* Data Quality Summary */}
              <div style={{ padding: "16px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[
                    { label: "จำนวนรายการ", value: previewData.length, color: "#059669" },
                    { label: "คอลัมน์ทั้งหมด", value: headers.length, color: "#3b82f6" },
                    { label: "Likert เฉลี่ย", value: `${avgFilled}/${totalLikert}`, color: "#8b5cf6" },
                    { label: "ตอบครบ 100%", value: `${completePct}%`, color: "#f59e0b" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "10px 16px", border: "1px solid #e2e8f0", flex: "1 1 120px", minWidth: 120 }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column Groups Legend */}
              <div style={{ padding: "12px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
                <span style={{ color: "#059669", fontWeight: 600 }}>● Meta ({9} cols)</span>
                <span style={{ color: "#3b82f6", fontWeight: 600 }}>● ข้อมูลทั่วไป ({personalIds.length} cols)</span>
                <span style={{ color: "#8b5cf6", fontWeight: 600 }}>● Likert ({likertIds.length} cols)</span>
              </div>

              {/* Scrollable Table */}
              <div style={{ flex: 1, overflow: "auto", padding: "0" }}>
                <table style={{ borderCollapse: "collapse", fontSize: 11, whiteSpace: "nowrap", minWidth: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ position: "sticky", top: 0, left: 0, zIndex: 3, background: "#f0fdf4", padding: "8px 10px", borderBottom: "2px solid #059669", borderRight: "2px solid #e2e8f0", color: "#059669", fontWeight: 700, textAlign: "center" }}>#</th>
                      {headers.map((h, i) => {
                        const isMeta = i < 9;
                        const isPersonal = i >= 9 && i < 9 + personalIds.length;
                        const bg = isMeta ? "#f0fdf4" : isPersonal ? "#eff6ff" : "#f5f3ff";
                        const color = isMeta ? "#059669" : isPersonal ? "#3b82f6" : "#7c3aed";
                        return (
                          <th key={h} style={{
                            position: "sticky", top: 0, zIndex: 2, background: bg, padding: "8px 10px",
                            borderBottom: `2px solid ${color}`, color, fontWeight: 600, textAlign: "left",
                          }}>{h}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ position: "sticky", left: 0, zIndex: 1, background: ri % 2 === 0 ? "#fff" : "#fafafa", padding: "6px 10px", borderRight: "2px solid #e2e8f0", color: "#64748b", fontWeight: 600, textAlign: "center" }}>{ri + 1}</td>
                        {headers.map((h, i) => {
                          const val = row[h];
                          const isLikert = i >= 9 + personalIds.length;
                          const isEmpty = val === "" || val == null;
                          return (
                            <td key={h} style={{
                              padding: "6px 10px", borderBottom: "1px solid #f1f5f9",
                              color: isEmpty ? "#cbd5e1" : isLikert ? "#1e293b" : "#334155",
                              fontWeight: isLikert && !isEmpty ? 600 : 400,
                              background: isEmpty && isLikert ? "#fef2f2" : "transparent",
                            }}>{isEmpty ? "-" : String(val)}</td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div style={{ padding: "12px 24px", textAlign: "center", color: "#64748b", fontSize: 12, background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                    ... แสดง 10 จาก {previewData.length} รายการ (Export จะได้ข้อมูลทั้งหมด)
                  </div>
                )}
              </div>

              {/* Export Actions */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", background: "#f8fafc", borderRadius: "0 0 20px 20px" }}>
                <button onClick={() => { exportCSV(responses); setShowPreview(false); }} style={{
                  padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.4)",
                  background: "rgba(16,185,129,0.1)", color: "#10b981", cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}><Download size={14} style={{ marginRight: 4 }} /> CSV</button>
                <button onClick={() => { exportExcel(responses); setShowPreview(false); }} style={{
                  padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(59,130,246,0.4)",
                  background: "rgba(59,130,246,0.1)", color: "#3b82f6", cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}><Download size={14} style={{ marginRight: 4 }} /> Excel</button>
                <button onClick={() => { exportMplusBoth(responses); setShowPreview(false); }} style={{
                  padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(168,85,247,0.4)",
                  background: "rgba(168,85,247,0.1)", color: "#a855f7", cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}><Download size={14} style={{ marginRight: 4 }} /> Mplus (CFA + SEM)</button>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
};

export default AdminPage;
