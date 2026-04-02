import { QRCodeSVG } from "qrcode.react";
import { Sun, MapPin, GraduationCap, ArrowLeft, Clipboard, Printer, ScanLine } from "lucide-react";

const REGION_DATA = [
  { name: "ภาคตะวันออกเฉียงเหนือ", code: "northeast", color: "#3b82f6", provinces: ["ขอนแก่น", "เลย", "ร้อยเอ็ด", "ปากช่อง", "สุรินทร์", "อุบลราชธานี", "สกลนคร"] },
  { name: "ภาคเหนือ", code: "north", color: "#10b981", provinces: ["กำแพงเพชร", "เชียงใหม่", "แพร่", "เพชรบูรณ์", "แม่สอด", "พิษณุโลก", "เชียงราย"] },
  { name: "ภาคใต้", code: "south", color: "#06b6d4", provinces: ["สุราษฎร์ธานี", "ทุ่งสง", "หาดใหญ่", "ชุมพร"] },
  { name: "ภาคตะวันออก", code: "east", color: "#f59e0b", provinces: ["ระยอง", "กบินทร์บุรี", "ชลบุรี", "จันทบุรี"] },
  { name: "ภาคกลาง", code: "central", color: "#8b5cf6", provinces: ["สุพรรณบุรี", "ปทุมธานี", "สิงห์บุรี", "นครปฐม", "อยุธยา"] },
  { name: "กรุงเทพฯ และปริมณฑล", code: "bangkok", color: "#ec4899", provinces: ["กรุงเทพมหานคร", "นนทบุรี", "สมุทรปราการ", "ปทุมธานี"] },
  { name: "ภาคตะวันตก", code: "west", color: "#ef4444", provinces: ["เพชรบุรี", "กาญจนบุรี", "ราชบุรี"] },
];

const QRCodesPage = () => {
  const baseUrl = window.location.origin;

  const printSingle = (region) => {
    const link = `${baseUrl}?src=${region.code}`;
    const w = window.open("", "_blank", "width=500,height=700");
    w.document.write(`<html><head><title>QR - ${region.name}</title><style>
      body{font-family:'Sarabun',sans-serif;text-align:center;padding:40px}
      h2{margin:0 0 8px;font-size:22px}
      p{color:#666;font-size:14px;margin:4px 0}
      .link{font-size:11px;color:#999;word-break:break-all;margin-top:16px}
    </style></head><body>
      <h2>แบบสอบถามวิจัย Solar Rooftop</h2>
      <p style="font-size:18px;font-weight:700;color:${region.color}">${region.name}</p>
      <p>มหาวิทยาลัยธนบุรี</p>
      <div style="margin:24px auto"><img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}" width="300" height="300"/></div>
      <p>สแกน QR Code เพื่อทำแบบสอบถาม</p>
      <p class="link">${link}</p>
      <script>setTimeout(()=>window.print(),600)<\/script>
    </body></html>`);
    w.document.close();
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc", padding: "32px 20px",
      fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: 16, background: "#ecfdf5", marginBottom: 16,
          }}><Sun size={32} color="#059669" /></div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>
            แบบสอบถามวิจัย Solar Rooftop
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            ปัจจัยที่ส่งผลต่อการตัดสินใจติดตั้งโซลาร์รูฟท็อปของผู้บริโภคในประเทศไทย
          </p>
          <p style={{ fontSize: 13, color: "#059669", margin: "8px 0 0", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <GraduationCap size={16} /> หลักสูตรบริหารธุรกิจดุษฎีบัณฑิต มหาวิทยาลัยธนบุรี
          </p>
          <a
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              marginTop: 16, padding: "10px 24px", borderRadius: 10,
              background: "#fff", border: "1.5px solid #e2e8f0",
              color: "#334155", fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              transition: "all 0.2s",
            }}
          >
            <ArrowLeft size={16} /> กลับหน้าแบบสอบถาม
          </a>
        </div>

        {/* Instruction */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "16px 24px", marginBottom: 32,
          border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <p style={{ margin: 0, fontSize: 14, color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <ScanLine size={18} color="#059669" /> สแกน QR Code หรือคลิกลิงก์ของภาคที่ท่านอยู่ เพื่อเริ่มทำแบบสอบถาม
          </p>
        </div>

        {/* QR Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {REGION_DATA.map(region => {
            const link = `${baseUrl}?src=${region.code}`;
            return (
              <div key={region.code} style={{
                background: "#fff", borderRadius: 20, padding: 24,
                border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column", alignItems: "center",
                borderTop: `4px solid ${region.color}`,
              }}>
                {/* Region Name */}
                <h3 style={{ fontSize: 16, fontWeight: 700, color: region.color, margin: "0 0 4px", textAlign: "center", display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={18} /> {region.name}
                </h3>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 16px", textAlign: "center" }}>
                  {region.provinces.join(" · ")}
                </p>

                {/* QR Code */}
                <div style={{
                  background: "#fff", borderRadius: 16, padding: 12,
                  border: "2px solid #f1f5f9", marginBottom: 16,
                }}>
                  <QRCodeSVG value={link} size={180} level="M" fgColor={region.color} />
                </div>

                {/* Link */}
                <a href={link} target="_blank" rel="noopener noreferrer" style={{
                  display: "block", fontSize: 12, color: "#64748b", textAlign: "center",
                  wordBreak: "break-all", marginBottom: 12, textDecoration: "none",
                  padding: "8px 12px", background: "#f8fafc", borderRadius: 8, width: "100%", boxSizing: "border-box",
                }}>
                  {link}
                </a>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <button
                    onClick={() => { navigator.clipboard.writeText(link); alert("คัดลอกลิงก์แล้ว!"); }}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid #e2e8f0",
                      background: "#f8fafc", color: "#334155", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    }}
                  ><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clipboard size={14} /> คัดลอก</span></button>
                  <button
                    onClick={() => printSingle(region)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
                      background: region.color, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    }}
                  ><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Printer size={14} /> พิมพ์</span></button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 40, padding: "20px 0", borderTop: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            © 2025 งานวิจัย Solar Rooftop · มหาวิทยาลัยธนบุรี
          </p>
          <p style={{ fontSize: 11, color: "#cbd5e1", margin: "4px 0 0" }}>
            พัฒนาระบบโดย therdpume@hotmail.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodesPage;
