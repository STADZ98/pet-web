import React, { useMemo, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import puppyHomeImg from "../home/images/dogg.jpg";
import catLickingImg from "../home/images/cat-licking-fur-1024x538.jpg";
import catn1ipImg from "../home/images/ปกแมว1.jpg";
import dog2ipImg from "../home/images/หมา2.jpg";
import dog3ipImg from "../home/images/มือ.webp";
import cat2ipImg from "../home/images/แมว4.jpg";
// ====== Reusable Modal (ไฟล์เดียวจบ) ======
const Modal = ({ open, onClose, title, children }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-800">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="ปิดหน้าต่าง"
            ref={dialogRef}
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// ====== Small UI bits ======
const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs">
    {children}
  </span>
);

const KeyPoint = ({ title, desc }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
    <div className="font-medium text-gray-800">{title}</div>
    <div className="text-sm text-gray-600 mt-1">{desc}</div>
  </div>
);

// ====== Main Page ======
const ArticleDetail6 = () => {
  // --- Modal states
  const [openSummary, setOpenSummary] = useState(false);
  const [openChecklist, setOpenChecklist] = useState(false);
  const [openRefs, setOpenRefs] = useState(false);

  // --- Reading progress
  const progressRef = useRef(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = progressRef.current;
      if (!el) return;
      const total = el.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY - (el.offsetTop || 0);
      const pct = Math.min(100, Math.max(0, (scrolled / total) * 100));
      setProgress(isNaN(pct) ? 0 : pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- TOC
  const toc = useMemo(
    () => [
      { id: "intro", label: "ภาพรวม: การมาถึงของสมาชิกใหม่" },
      { id: "puppy-proofing", label: "การเตรียมบ้านให้พร้อม (Puppy-Proofing)" },
      { id: "supplies", label: "เตรียมของใช้จำเป็น" },
      { id: "first-day", label: "วันแรกในบ้านใหม่" },
      { id: "routine", label: "วางแผนกิจวัตรประจำวัน" },
      { id: "faq", label: "คำถามพบบ่อย" },
    ],
    []
  );

  return (
    <section ref={progressRef} className="bg-gray-50 min-h-screen">
      {/* Reading progress bar */}
      <div className="sticky top-0 z-50 h-1 w-full bg-gray-200">
        <div
          className="h-1 bg-emerald-500 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* -------- Main -------- */}
          <article className="flex-1 max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 lg:p-8 border-b bg-gradient-to-b from-white to-emerald-50/40">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                
                <span className="ml-auto">
                  <Badge>New Puppy</Badge>
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 leading-snug mt-4">
                เตรียมความพร้อมก่อนรับเลี้ยงสุนัข ฉบับมือโปร
              </h1>
              <p className="text-gray-600 mt-3">
                ทุกสิ่งที่คุณต้องรู้เพื่อเตรียมบ้านและครอบครัวให้พร้อมสำหรับสมาชิกสี่ขาตัวใหม่
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => setOpenSummary(true)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:border-gray-300 hover:bg-gray-50"
                >
                  สรุปย่อ (Key Takeaways)
                </button>
                <button
                  onClick={() => setOpenChecklist(true)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100"
                >
                  เช็คลิสต์เตรียมของ
                </button>
                <button
                  onClick={() => setOpenRefs(true)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm hover:border-gray-300 hover:bg-gray-50"
                >
                  แหล่งอ้างอิง
                </button>
              </div>
            </div>

            {/* Cover */}
            <div className="overflow-hidden">
              <img
                src={puppyHomeImg}
                alt="puppy in new home"
                className="w-full h-64 lg:h-80 object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* TOC (mobile button) */}
            <div className="px-6 lg:px-8 py-5 border-b bg-white lg:hidden">
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-700 font-medium flex items-center justify-between">
                  สารบัญ
                  <span className="text-gray-400 group-open:rotate-180 transition">
                    ⌄
                  </span>
                </summary>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="hover:text-emerald-700">
                        • {t.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8">
              {/* Desktop TOC inline tip */}
              <div className="hidden lg:block mb-8 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="text-sm font-semibold text-emerald-800 mb-2">
                  📜 สารบัญ
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-emerald-900">
                  {toc.map((t) => (
                    <a
                      key={t.id}
                      href={`#${t.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {t.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <section id="intro" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  ภาพรวม: การมาถึงของสมาชิกใหม่
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  การรับเลี้ยงสุนัขไม่ใช่แค่การนำสัตว์ตัวหนึ่งเข้ามาในบ้าน
                  แต่เป็นการสร้างความสัมพันธ์ระยะยาวที่ต้องใช้เวลาและความตั้งใจ
                  บทความนี้จัดให้เป็นคู่มือปฏิบัติที่ครอบคลุมตั้งแต่การเตรียม
                  พื้นที่ การเลือกอุปกรณ์ การวางตารางกิจวัตร การดูแลด้านสุขภาพ
                  และการเริ่มต้นฝึกพฤติกรรมพื้นฐาน
                  เพื่อให้การเปลี่ยนผ่านเป็นไปอย่างนุ่มนวลทั้งสำหรับสุนัขและครอบครัว
                </p>
                <div className="mt-4 grid sm:grid-cols-3 gap-3">
                  <KeyPoint
                    title="ความปลอดภัย"
                    desc="ตรวจจุดเสี่ยงและจัดการสิ่งของให้พ้นจากการเข้าถึง"
                  />
                  <KeyPoint
                    title="การปรับตัว"
                    desc="ค่อย ๆ ให้สุนัขสำรวจพื้นที่และสร้างกิจวัตรที่ชัดเจน"
                  />
                  <KeyPoint
                    title="เตรียมพร้อม"
                    desc="มีอุปกรณ์พื้นฐานและแผนไปพบสัตวแพทย์ภายในสัปดาห์แรก"
                  />
                </div>
              </section>

              <hr className="my-8" />

              <section id="puppy-proofing" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  การเตรียมบ้านให้พร้อม (Puppy-Proofing)
                </h2>
                <p className="mt-3 text-gray-700">
                  ลูกหมาสนใจสำรวจทุกสิ่งรอบตัวและมักจะชอบกัดแทะสิ่งที่พบ
                  ดังนั้นการเตรียมบ้านก่อนนำสุนัขเข้ามาจะช่วยลดอุบัติเหตุ
                  และป้องกันการกินสิ่งที่เป็นอันตรายได้หลายอย่าง
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>
                    สายไฟและปลั๊ก: เก็บสายไฟให้เรียบร้อยหรือใช้ท่อครอบสาย
                    ปลั๊กที่มีฝาปิดเพื่อลดความเสี่ยงจากการกัด
                  </li>
                  <li>
                    ของมีค่าและชิ้นเล็ก: เก็บรองเท้า รีโมท และของเล่นชิ้นเล็ก
                    ที่ลูกหมาอาจกลืนได้
                  </li>
                  <li>
                    สารเคมีและยา: เก็บยาทุกชนิด น้ำยาทำความสะอาด
                    และสารเคมีไว้ในตู้ที่ลูกหมาไม่สามารถเข้าถึงได้
                  </li>
                  <li>
                    พืชที่มีพิษ: ตรวจสอบพืชในบ้านและสวน
                    หากไม่แน่ใจให้ย้ายไปไว้ที่สูง
                  </li>
                  <li>
                    ขยะและอาหารบนพื้น:
                    ปิดฝาถังขยะและอย่าวางอาหารบนโต๊ะที่เข้าถึงได้ง่าย
                  </li>
                </ul>
                <div className="mt-4 text-sm text-gray-600">
                  เคล็ดลับเพิ่มเติม: ใช้รั้วกั้น (pet gate)
                  เพื่อจำกัดพื้นที่ในช่วงแรก
                  และเตรียมมุมสงบให้ลูกหมาเป็นพื้นที่พักผ่อนที่ปลอดภัย
                </div>
              </section>

              <hr className="my-8" />

              <section id="supplies" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  เตรียมของใช้จำเป็น
                </h2>
                <p className="mt-3 text-gray-700">
                  ของใช้พื้นฐานที่มีคุณภาพจะช่วยให้การดูแลสุนัขเป็นเรื่องง่ายขึ้น
                  และลดปัญหาจากอุปกรณ์ที่ไม่เหมาะสมในระยะยาว
                </p>

                <h4 className="mt-4 font-medium text-gray-800">
                  สุขภาพ & ความปลอดภัย
                </h4>
                <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-2">
                  <li>ปลอกคอหรือฮาร์เนสและป้ายระบุชื่อพร้อมเบอร์โทร</li>
                  <li>ไมโครชิพและลงทะเบียนข้อมูลเจ้าของ (หากบริการมี)</li>
                  <li>
                    ชุดปฐมพยาบาลเบื้องต้นสำหรับสัตว์ (ผ้าพันแผล ยาฆ่าเชื้อ)
                  </li>
                </ul>

                <h4 className="mt-4 font-medium text-gray-800">การให้อาหาร</h4>
                <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-2">
                  <li>ชามอาหารและชามน้ำสแตนเลส — ทำความสะอาดง่าย</li>
                  <li>
                    อาหารสูตรลูกสุนัข (puppy)
                    ตามคำแนะนำของผู้เพาะเลี้ยงหรือสัตวแพทย์
                  </li>
                  <li>
                    เครื่องให้อาหารอัตโนมัติหรือของเล่นที่ให้ของรางวัลเพื่อชะลอการกิน
                  </li>
                </ul>

                <h4 className="mt-4 font-medium text-gray-800">
                  การนอน & การพักผ่อน
                </h4>
                <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-2">
                  <li>เตียงหรือเบาะที่รองรับสรีระและทำความสะอาดได้</li>
                  <li>
                    ผ้าห่มหรือของที่มีกลิ่นคุ้นเคยจากที่เดิมเพื่อลดความเครียด
                  </li>
                </ul>

                <h4 className="mt-4 font-medium text-gray-800">
                  การดูแลและเล่น
                </h4>
                <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-2">
                  <li>ของเล่นชนิดเคี้ยว (chew toys) และของเล่นฝึกสมอง</li>
                  <li>อุปกรณ์แปรงขนและตะไบเล็บ</li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="first-day" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  วันแรกในบ้านใหม่
                </h2>
                <p className="mt-3 text-gray-700">
                  วันแรกควรเน้นการแนะนำให้สุนัขรู้สึกปลอดภัยมากกว่าการฝึกที่จริงจัง
                  ให้เวลาสุนัขสำรวจพื้นที่เองอย่างช้า ๆ
                  และหลีกเลี่ยงงานเลี้ยงต้อนรับที่วุ่นวาย
                </p>
                <ol className="list-decimal pl-6 mt-3 text-gray-700 space-y-2">
                  <li>พาเดินภายนอกสั้น ๆ เพื่อให้สุนัขผ่อนคลายและขับถ่าย</li>
                  <li>แนะนำมุมที่นอน ชามอาหาร และพื้นที่ขับถ่ายที่ต้องการ</li>
                  <li>
                    ให้สมาชิกในบ้านทักทายอย่างสงบและหลีกเลี่ยงการจับกุมที่รุนแรง
                  </li>
                  <li>
                    สังเกตสัญญาณความเครียด เช่น หลีกเลี่ยงการเข้าหา
                    หรือส่งเสียงคราง
                  </li>
                  <li>
                    อย่าออกจากสุนัขคนเดียวเป็นเวลานาน — ค่อย ๆ เพิ่มเวลาการแยก
                  </li>
                </ol>
              </section>

              <hr className="my-8" />

              <section id="routine" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  วางแผนกิจวัตรประจำวัน
                </h2>
                <p className="mt-3 text-gray-700">
                  กิจวัตรที่สม่ำเสมอช่วยให้การขับถ่ายเป็นปกติและลดปัญหาพฤติกรรม
                  ตัวอย่างต่อไปนี้ปรับได้ตามวัยและสายพันธุ์ของสุนัข
                </p>
                <h4 className="mt-4 font-medium text-gray-800">
                  ลูกสุนัข (2–6 เดือน)
                </h4>
                <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-2">
                  <li>เช้า: พาไปขับถ่ายและให้อาหารตามตาราง</li>
                  <li>สาย: ช่วงฝึกสั้น ๆ และพักผ่อน</li>
                  <li>บ่าย: เล่นและสำรวจภายนอกสั้น ๆ</li>
                  <li>เย็น: ให้อาหารเย็นและฝึกคำสั่งเบื้องต้น</li>
                  <li>
                    กลางคืน: พาไปขับถ่ายก่อนนอนและวางสุนัขในมุมที่เตรียมไว้
                  </li>
                </ul>

                <h4 className="mt-4 font-medium text-gray-800">สุนัขโต</h4>
                <ul className="list-disc pl-6 mt-2 text-gray-700 space-y-2">
                  <li>เช้า: เดินยาว 20–30 นาที</li>
                  <li>
                    กลางวัน: ให้ของเล่นหรือกิจกรรมช้า ๆ ถ้าต้องอยู่บ้านคนเดียว
                  </li>
                  <li>เย็น: กิจกรรมที่ใช้พลังงานตามสายพันธุ์</li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="health" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  การดูแลสุขภาพ & นัดสัตวแพทย์
                </h2>
                <p className="mt-3 text-gray-700">
                  นัดสัตวแพทย์ภายใน 3–7 วันหลังรับเลี้ยงเพื่อตรวจร่างกาย
                  วางแผนวัคซีน และปรึกษาการป้องกันเห็บหมัดและพยาธิ
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>ตรวจอุจจาระเพื่อตรวจพยาธิภายใน</li>
                  <li>เริ่มชุดวัคซีนพื้นฐานตามคำแนะนำของสัตวแพทย์</li>
                  <li>ประเมินความจำเป็นของการทำหมันและเวลาเหมาะสม</li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="training" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  การฝึกพื้นฐาน
                </h2>
                <p className="mt-3 text-gray-700">
                  ใช้วิธีเสริมแรงเชิงบวก (ของรางวัลและคำชม)
                  ในการฝึกคำสั่งพื้นฐาน และฝึกเป็นช่วงสั้น ๆ หลายครั้งต่อวัน
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>ฝึกคำสั่ง "มา" "นั่ง" "คอย" ด้วยขนมรางวัล</li>
                  <li>ฝึกการเดินกับสายจูงโดยหยุดเมื่อดึง</li>
                  <li>สอนการขับถ่ายในที่กำหนดโดยใช้ตารางเวลา</li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="costs" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  ประมาณค่าใช้จ่ายเบื้องต้น
                </h2>
                <p className="mt-3 text-gray-700">
                  เตรียมงบสำหรับอุปกรณ์พื้นฐาน การตรวจครั้งแรก วัคซีน
                  และค่าอาหาร โดยแยกเป็นค่าเริ่มต้นและค่าใช้จ่ายประจำ
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>ค่าเริ่มต้น (อุปกรณ์): 1,000–6,000 บาท</li>
                  <li>ค่าตรวจและวัคซีนเริ่มต้น: 1,000–4,000 บาท</li>
                  <li>ค่าอาหารต่อเดือน: 800–4,000 บาท</li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="multipet" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  กรณีมีสัตว์เลี้ยงหรือเด็กในบ้าน
                </h2>
                <p className="mt-3 text-gray-700">
                  การแนะนำสุนัขใหม่ให้สัตว์เดิมควรทำอย่างค่อยเป็นค่อยไป
                  ใช้วิธีแลกกลิ่นและพบกันในพื้นที่เป็นกลางก่อนปล่อยให้ใช้พื้นที่ร่วมกัน
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>สลับผ้าหรือของใช้เพื่อแลกกลิ่นก่อนพบตัวจริง</li>
                  <li>ให้การพบกันครั้งแรกเป็นไปภายใต้การดูแล</li>
                  <li>
                    สอนเด็กให้เคารพสัญญาณของสุนัขและไม่รบกวนขณะกินหรือหลับ
                  </li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="faq" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">คำถามพบบ่อย</h2>
                <div className="mt-3 grid sm:grid-cols-2 gap-4">
                  <KeyPoint
                    title="ควรรับเลี้ยงลูกสุนัขหรือสุนัขโตดี?"
                    desc="ลูกสุนัขต้องการการดูแลและฝึกมากกว่า สุนัขโตอาจปรับตัวเร็วกว่าขึ้นกับประสบการณ์เดิม"
                  />
                  <KeyPoint
                    title="สุนัขใหม่ฉี่ไม่เป็นที่ ทำอย่างไร?"
                    desc="ยึดตารางการพาออกไปขับถ่ายบ่อย ๆ ใช้คำสั่งและรางวัลเมื่อทำถูกที่"
                  />
                  <KeyPoint
                    title="ต้องเตรียมงบฉุกเฉินเท่าไร?"
                    desc="แนะนำสำรอง 10,000–30,000 บาท หรือพิจารณาประกันสัตว์เลี้ยง"
                  />
                </div>
              </section>

              {/* Footer meta */}
             
            </div>
          </article>

          {/* -------- Sidebar -------- */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            {/* About */}
            <div className="bg-white rounded-2xl shadow p-6 mb-8">
              <h3 className="font-bold text-gray-800 mb-3">
                ℹ เกี่ยวกับบทความ
              </h3>
              <p className="text-gray-600 text-sm">
                คู่มือการเตรียมบ้านและจิตใจ
                เพื่อต้อนรับลูกหมาตัวใหม่ให้เป็นไปอย่างราบรื่น
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>Puppy</Badge>
                <Badge>First-time owner</Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOpenSummary(true)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs hover:bg-gray-100"
                >
                  สรุปย่อ
                </button>
                <button
                  onClick={() => setOpenChecklist(true)}
                  className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-100"
                >
                  เช็คลิสต์
                </button>
              </div>
            </div>

            {/* Latest */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">📰 บทความล่าสุด</h3>
              <ul className="space-y-4">
                {[
                  "คู่มือให้อาหารแมวเลี้ยงในบ้าน (Indoor)",
                  "คู่มือการออกกำลังกายสำหรับสุนัข",
                  "มือใหม่ต้องรู้: ดูแลลูกหมาตัวใหม่ อย่างไรให้แข็งแรง",
                  "สัญญาณแปลก ๆ ที่เตือนว่าแมวกำลังป่วย",
                  "แมวเลียขนบ่อยมากเกินไป: ทำไมแมวถึงมีพฤติกรรมเช่นนั้น และแก้ไขอย่างไรดี? ",
                  "เตรียมความพร้อมก่อนรับเลี้ยงสุนัข ฉบับมือโปร",
                ].map((title, i) => (
                  <li key={i}>
                    <Link
                      to={`/article/${i + 1}`}
                      className="flex gap-3 items-center group"
                    >
                      <div className="w-14 h-14 overflow-hidden rounded-lg shadow">
                        <img
                          src={
                            i === 1
                              ? dog2ipImg
                              : i === 2
                              ? dog3ipImg
                              : i == 3
                              ? cat2ipImg
                              : i == 4
                              ? catLickingImg
                              : i == 5
                              ? puppyHomeImg
                              : catn1ipImg
                          }
                          alt="thumb"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <span className="text-sm text-gray-700 leading-snug group-hover:text-orange-700">
                        {title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* ===== Modals ===== */}
      <Modal
        open={openSummary}
        onClose={() => setOpenSummary(false)}
        title="Key Takeaways: การเตรียมตัวรับเลี้ยงสุนัข"
      >
        <div className="space-y-3 text-sm text-gray-700">
          <div className="grid sm:grid-cols-2 gap-3">
            <KeyPoint title="เตรียมบ้าน" desc="เก็บของอันตรายให้พ้นจากลูกหมา" />
            <KeyPoint
              title="เตรียมของใช้"
              desc="จัดหาอุปกรณ์ที่จำเป็นล่วงหน้า"
            />
            <KeyPoint
              title="สร้างกิจวัตร"
              desc="กำหนดตารางการกิน การนอน และการขับถ่ายให้ชัดเจน"
            />
            <KeyPoint
              title="การปรับตัว"
              desc="ใช้ความอดทนและเข้าใจในการปรับตัวช่วงแรก"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={openChecklist}
        onClose={() => setOpenChecklist(false)}
        title="เช็คลิสต์: ของใช้จำเป็นสำหรับลูกหมา"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <p>ตรวจสอบให้แน่ใจว่าคุณมีของเหล่านี้พร้อมก่อนวันรับลูกหมา</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>อาหารลูกสุนัข (สูตรเดียวกับที่ฟาร์ม)</li>
            <li>ชามอาหารและชามน้ำ</li>
            <li>ปลอกคอและสายจูง</li>
            <li>ที่นอนหรือกรง</li>
            <li>ของเล่นสำหรับกัดแทะ</li>
            <li>แผ่นรองซับหรือกระบะขับถ่าย</li>
            <li>แชมพูและอุปกรณ์แปรงขน</li>
          </ul>
        </div>
      </Modal>

      <Modal
        open={openRefs}
        onClose={() => setOpenRefs(false)}
        title="แหล่งอ้างอิง & อ่านต่อ"
      >
        <div className="text-sm text-gray-700 space-y-3">
          <p>
            เนื้อหาเรียบเรียงจากแนวทางปฏิบัติทั่วไปและข้อมูลจากผู้เชี่ยวชาญด้านการเลี้ยงสุนัข
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>PURINA®: Preparing for a New Puppy</li>
            <li>ควรปรึกษาสัตวแพทย์เพื่อขอคำแนะนำเฉพาะสำหรับลูกหมาของคุณ</li>
          </ul>
        </div>
      </Modal>
    </section>
  );
};

export default ArticleDetail6;
