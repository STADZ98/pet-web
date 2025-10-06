import React, { useMemo, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import catImg from "../home/images/แมว4.jpg";
import catn1ipImg from "../home/images/ปกแมว1.jpg";
import dog2ipImg from "../home/images/หมา2.jpg";
import dog3ipImg from "../home/images/มือ.webp";
import cat2ipImg from "../home/images/แมว4.jpg";
import catLickingImg from "../home/images/cat-licking-fur-1024x538.jpg";
import puppyHomeImg from "../home/images/dogg.jpg";
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
  <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 text-xs">
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
const ArticleDetail4 = () => {
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
      { id: "intro", label: "ภาพรวม: สังเกตแมวของคุณ" },
      { id: "behavioral", label: "การเปลี่ยนแปลงพฤติกรรม" },
      { id: "physical", label: "สัญญาณจากร่างกาย" },
      { id: "appetite", label: "การเปลี่ยนแปลงการกินและการขับถ่าย" },
      { id: "faq", label: "คำถามพบบ่อย" },
    ],
    []
  );

  // --- Checklist state
  const [checklist, setChecklist] = useState({
    hiding: false,
    appetite: false,
    thirst: false,
    weight: false,
    vomiting: false,
    grooming: false,
    vocalization: false,
  });

  const allSymptoms = useMemo(
    () => Object.values(checklist).filter(Boolean).length,
    [checklist]
  );

  return (
    <section ref={progressRef} className="bg-gray-50 min-h-screen">
      {/* Reading progress bar */}
      <div className="sticky top-0 z-50 h-1 w-full bg-gray-200">
        <div
          className="h-1 bg-rose-500 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* -------- Main -------- */}
          <article className="flex-1 max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 lg:p-8 border-b bg-gradient-to-b from-white to-rose-50/40">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                
                <span className="ml-auto">
                  <Badge>Cat Symptoms</Badge>
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 leading-snug mt-4">
                สัญญาณแปลก ๆ ที่เตือนว่าแมวกำลังป่วย
              </h1>
              <p className="text-gray-600 mt-3">
                เรียนรู้ที่จะสังเกตการเปลี่ยนแปลงเล็กๆ น้อยๆ
                เพื่อช่วยให้แมวของคุณได้รับการรักษาที่ทันท่วงที
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
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100"
                >
                  แบบเช็คลิสต์อาการป่วย
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
                src={catImg}
                alt="cat showing unusual symptoms cover"
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
                      <a href={`#${t.id}`} className="hover:text-rose-700">
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
              <div className="hidden lg:block mb-8 rounded-xl border border-rose-100 bg-rose-50 p-5">
                <div className="text-sm font-semibold text-rose-800 mb-2">
                  📜 สารบัญ
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-rose-900">
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
                  ภาพรวม: สังเกตแมวของคุณ
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  แมวมักซ่อนอาการป่วยไว้ จนกระทั่งอาการรุนแรงขึ้น การสังเกต
                  รายละเอียดเล็ก ๆ เช่น พฤติกรรมการกิน การขับถ่าย การเลียขน
                  หรือนิสัยการนอน สามารถช่วยให้เจอสัญญาณเตือนแต่เนิ่น ๆ
                </p>
                <div className="mt-4 grid sm:grid-cols-3 gap-3">
                  <KeyPoint
                    title="พฤติกรรม"
                    desc="การซ่อนตัว หงุดหงิด หรือเปลี่ยนบุคลิก"
                  />
                  <KeyPoint
                    title="การกิน"
                    desc="เบื่ออาหารหรือดื่มน้ำมากกว่าปกติ"
                  />
                  <KeyPoint
                    title="การขับถ่าย"
                    desc="เปลี่ยนแปลงรูป แบบหรือบ่อยครั้งผิดปกติ"
                  />
                </div>
              </section>

              <hr className="my-8" />

              <section id="behavioral" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  การเปลี่ยนแปลงพฤติกรรม
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  พฤติกรรมที่เปลี่ยนไปเป็นหนึ่งในสัญญาณแรกของการป่วย
                  ให้สังเกตการตอบสนองต่อเจ้าของ ของเล่น และสภาพแวดล้อม
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>
                    ซ่อนตัว/หลบหนี:
                    ไม่ต้องการปฏิสัมพันธ์กับคนหรือสัตว์เลี้ยงอื่น
                  </li>
                  <li>
                    เปลี่ยนเสียงร้อง: ร้องบ่อยขึ้น, ร้องแบบเจ็บปวด
                    หรือเงียบผิดปกติ
                  </li>
                  <li>
                    ก้าวร้าวหรือหดหู่: แสดงพฤติกรรมไม่เหมือนเดิม เช่นขู่หรือกัด
                  </li>
                  <li>กิจกรรมลดลง: ไม่อยากเล่นหรือปีนป่ายเหมือนเดิม</li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="physical" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  สัญญาณจากร่างกาย
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  สัญญาณทางกายภาพที่เห็นได้ชัด เช่น สภาพขน ตา จมูก และการหายใจ
                  เป็นตัวบ่งชี้ที่สำคัญ หมั่นตรวจร่างกายแมวเป็นประจำ
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>น้ำหนักเปลี่ยนเร็ว: ลดหรือเพิ่มอย่างต่อเนื่องควรตรวจ</li>
                  <li>
                    ขนแห้ง หยาบ หรือเป็นแผง: อาจบ่งชี้ปัญหาผิวหนัง โภชนาการ
                    หรือเจ็บป่วย
                  </li>
                  <li>ดวงตา: ตาแดง น้ำตาไหล ขี้ตา หรือเปลี่ยนสี</li>
                  <li>จมูก: น้ำมูกมากหรือจมูกแห้งมากผิดปกติ</li>
                  <li>การหายใจ: หายใจเร็ว หายใจลำบาก หรือไอเรื้อรัง</li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="appetite" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  การเปลี่ยนแปลงการกินและการขับถ่าย
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  ระบบทางเดินอาหารและระบบขับถ่ายมักแสดงอาการชัดเจนเมื่อแมวป่วย
                  ควรสังเกตทั้งปริมาณ กลิ่น สี ความถี่ และลักษณะอุจจาระ/ปัสสาวะ
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>
                    เบื่ออาหารหรือลดการกินเป็นวัน: อาจเกิดจากปวด, ติดเชื้อ,
                    หรือปัญหาในช่องปาก
                  </li>
                  <li>
                    ดื่มน้ำมากผิดปกติหรือหิวน้ำน้อยลง: สัญญาณของโรคไต, เบาหวาน,
                    หรือปัญหาเมตาบอลิซึม
                  </li>
                  <li>
                    อาเจียน/ท้องเสียต่อเนื่อง: ถ้าเกิน 24–48 ชม. ต้องพบสัตวแพทย์
                  </li>
                  <li>
                    เลือดในอุจจาระหรือปัสสาวะ: เป็นสัญญาณฉุกเฉินที่ต้องรีบตรวจ
                  </li>
                </ul>
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 text-orange-900 text-sm">
                  ⚠️ หากพบเลือดในอุจจาระ/ปัสสาวะ หรืออาเจียนซ้ำ ๆ
                  ควรพาไปพบสัตวแพทย์ทันที
                </div>
              </section>

              <hr className="my-8" />

              <section id="common-causes" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  สาเหตุที่พบบ่อยของอาการผิดปกติ
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  อาการที่แมวแสดงออกอาจมีสาเหตุหลากหลาย เราสามารถแบ่งคร่าว ๆ
                  ได้ตามระบบต่าง ๆ ดังนี้:
                </p>
                <div className="mt-4 grid sm:grid-cols-2 gap-4 text-gray-700">
                  <div>
                    <strong>ระบบทางเดินหายใจ</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>หวัดแมว, การติดเชื้อแบคทีเรียหรือไวรัส</li>
                      <li>ภูมิแพ้, หลอดลมหดเกร็ง หรือมะเร็งบางชนิด</li>
                    </ul>
                  </div>
                  <div>
                    <strong>ระบบทางเดินอาหาร</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>
                        การกินสิ่งแปลกปลอม, ปรสิต, หรืออุบัติเหตุทางโภชนาการ
                      </li>
                      <li>ภาวะอักเสบของลำไส้หรือลำไส้แปรปรวน</li>
                    </ul>
                  </div>
                  <div>
                    <strong>ระบบขับถ่ายและไต</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>โรคไตเฉียบพลัน/เรื้อรัง, นิ่วในกระเพาะปัสสาวะ</li>
                    </ul>
                  </div>
                  <div>
                    <strong>ผิวหนังและภายนอก</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>เห็บ หมัด ภูมิแพ้ หรือการติดเชื้อผิวหนัง</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="my-8" />

              <section id="emergency" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  สัญญาณฉุกเฉิน (ต้องรีบพาไปหาสัตวแพทย์)
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  สัญญาณต่อไปนี้ถือเป็นเหตุฉุกเฉิน
                  ต้องรีบพาแมวไปหาสัตวแพทย์ทันที:
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>หายใจลำบากหรือหายใจไม่ออก</li>
                  <li>สติสัมปชัญญะเปลี่ยน เช่น ชัก หมดสติ</li>
                  <li>
                    เลือดออกไม่หยุด หรือมีเลือดในอุจจาระ/ปัสสาวะอย่างชัดเจน
                  </li>
                  <li>อาเจียนหรือท้องเสียรุนแรง ร่วมกับซึมและขาดน้ำ</li>
                  <li>แพ้สารอย่างรุนแรง (บวมที่ใบหน้า หายใจดัง มีผื่น)</li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="first-aid" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  การปฐมพยาบาลเบื้องต้นที่บ้าน
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  มีขั้นตอนพื้นฐานที่เจ้าของสามารถทำได้ก่อนพาสัตว์เลี้ยงไปรักษา:
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>หากเลือดออก ให้กดแผลด้วยผ้าสะอาดและรีบพาไปพบสัตวแพทย์</li>
                  <li>
                    หากแมวหมดสติหรือชัก ให้วางในที่ปลอดภัย ห้ามใส่ของในปาก
                    และรีบขนไปคลินิกฉุกเฉิน
                  </li>
                  <li>
                    ถ้าแมวโดนสารพิษ โทรสายด่วนสัตวแพทย์หรือฉุกเฉินทันที
                    พร้อมนำภาชนะหรือฉลากสารไปด้วย
                  </li>
                  <li>
                    เติมน้ำโดยการให้จิบเล็ก ๆ หากแมวไม่อาเจียน
                    และหากมีเครื่องมือ ให้วัดอาการขาดน้ำ
                  </li>
                </ul>
                <div className="mt-3 text-xs text-gray-500">
                  การปฐมพยาบาลไม่ได้แทนการรักษาของสัตวแพทย์ —
                  รีบไปพบผู้เชี่ยวชาญเมื่อจำเป็น
                </div>
              </section>

              <hr className="my-8" />

              <section id="monitoring" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  การติดตามอาการและบันทึก
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  การบันทึกสิ่งที่สังเกตได้ช่วยให้สัตวแพทย์วินิจฉัยได้รวดเร็วขึ้น
                  จดวันที่ เวลา ลักษณะอาการ และความถี่
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>จดปริมาณอาหารและน้ำที่กินในแต่ละวัน</li>
                  <li>ถ่ายรูป/วิดีโอพฤติกรรมหรืออาการที่เห็นได้ชัด</li>
                  <li>
                    บันทึกสี/ลักษณะของอุจจาระและปัสสาวะ (เช่น เลือด น้ำตาล
                    กลิ่นผิดปกติ)
                  </li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="prevention" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  การป้องกันและการดูแลระยะยาว
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  การป้องกันเป็นก้าวสำคัญ: การฉีดวัคซีน การป้องกันปรสิต
                  และการดูแลโภชนาการที่ดีล้วนช่วยลดความเสี่ยงโรคได้มาก
                </p>
                <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                  <li>ฉีดวัคซีนตามตารางและติดตามบันทึก</li>
                  <li>ทำการป้องกันหมัด เห็บ และถ่ายพยาธิตามคำแนะนำ</li>
                  <li>ให้อาหารที่มีคุณภาพและเหมาะสมตามวัย</li>
                  <li>ดูแลสุขอนามัย เช่น ทำความสะอาดกระบะทรายเป็นประจำ</li>
                </ul>
              </section>

              <hr className="my-8" />

              <section id="when-to-call" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  เมื่อไรควรติดต่อสัตวแพทย์
                </h2>
                <p className="mt-3 text-gray-700 leading-7">
                  โดยทั่วไป หากอาการไม่ดีขึ้นภายใน 24–48 ชั่วโมง
                  หรือมีอาการรุนแรง ควรนัดหมายหรือพาไปพบสัตวแพทย์ทันที
                </p>
                <div className="mt-3 grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <strong>ติดต่อทันที</strong>
                    <ul className="list-disc pl-6 mt-2">
                      <li>หายใจลำบาก</li>
                      <li>ชัก หมดสติ หรือไม่ตอบสนอง</li>
                      <li>มีเลือดในอุจจาระ/ปัสสาวะ</li>
                    </ul>
                  </div>
                  <div>
                    <strong>นัดหมาย</strong>
                    <ul className="list-disc pl-6 mt-2">
                      <li>เบื่ออาหารมากกว่า 24–48 ชั่วโมง</li>
                      <li>อาเจียนหรือท้องเสียเรื้อรัง</li>
                      <li>ขนร่วงเป็นหย่อม ๆ หรือผิวหนังมีแผล</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="my-8" />

              <section id="examples" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">
                  กรณีศึกษาและตัวอย่างสัญญาณ
                </h2>
                <div className="mt-3 text-gray-700 space-y-3">
                  <div>
                    <strong>ตัวอย่างที่ 1:</strong> แมวที่เลิกกินและซ่อนตัว 3
                    วัน ร่วมกับน้ำหนักลด —
                    อาจเป็นการติดเชื้อภายในหรือปัญหาในระบบทางเดินอาหาร
                    ควรรีบตรวจ
                  </div>
                  <div>
                    <strong>ตัวอย่างที่ 2:</strong>{" "}
                    แมวที่มีปัสสาวะบ่อยและเลือดปน
                    อาจเป็นโรคทางเดินปัสสาวะหรือนิ่ว ต้องตรวจปัสสาวะและภาพรังสี
                  </div>
                </div>
              </section>

              <hr className="my-8" />

              <section id="faq" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-gray-800">คำถามพบบ่อย</h2>
                <div className="mt-3 grid sm:grid-cols-2 gap-4">
                  <KeyPoint
                    title="แมวซ่อนอาการ ทำไงดี?"
                    desc="จดบันทึกอาการและพฤติกรรม ถ้าเปลี่ยนมากให้พบสัตวแพทย์"
                  />
                  <KeyPoint
                    title="อาการไหนรีบที่สุด?"
                    desc="หายใจลำบาก ชัก หมดสติ หรือเลือดในอุจจาระ/ปัสสาวะ"
                  />
                  <KeyPoint
                    title="ควรเตรียมอะไรเมื่อพาไปคลินิก?"
                    desc="นำตัวอย่างอุจจาระ/ปัสสาวะ ถ่ายรูปอาการ และบันทึกประวัติย่อ"
                  />
                  <KeyPoint
                    title="ต้องฉีดวัคซีนบ่อยแค่ไหน?"
                    desc="ตามตารางที่สัตวแพทย์กำหนด ขึ้นกับอายุและความเสี่ยง"
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
                คู่มือการสังเกตสัญญาณผิดปกติในแมว
                เพื่อช่วยให้คุณสามารถพาแมวไปพบสัตวแพทย์ได้ทันท่วงที
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>Cat Health</Badge>
                <Badge>Symptoms</Badge>
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
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100"
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
        title="Key Takeaways: สัญญาณป่วยของแมว"
      >
        <div className="space-y-3 text-sm text-gray-700">
          <div className="grid sm:grid-cols-2 gap-3">
            <KeyPoint
              title="พฤติกรรม"
              desc="ซึม, ซ่อนตัว, ก้าวร้าว, หรือร้องผิดปกติ"
            />
            <KeyPoint title="รูปร่าง" desc="น้ำหนักเปลี่ยน, ขนไม่เรียบ" />
            <KeyPoint title="การขับถ่าย" desc="ปัสสาวะ/อุจจาระผิดปกติ" />
            <KeyPoint
              title="การกิน"
              desc="เบื่ออาหาร หรือกิน-ดื่มน้ำมากผิดปกติ"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={openChecklist}
        onClose={() => setOpenChecklist(false)}
        title="แบบเช็คลิสต์อาการป่วยเบื้องต้น"
      >
        <div className="space-y-4">
          <div className="rounded-xl border p-4 bg-gray-50 text-sm">
            <div className="font-semibold text-gray-800 mb-2">
              จำนวนอาการที่พบ: {allSymptoms}
            </div>
            <p className="text-gray-600">
              *หากมีอาการใดๆ ที่ตรง ควรปรึกษาสัตวแพทย์ทันที
            </p>
          </div>
          <div className="space-y-2">
            {[
              { key: "hiding", label: "ซ่อนตัวหรือหลีกเลี่ยงการเข้าสังคม" },
              { key: "appetite", label: "เบื่ออาหาร หรือกินน้อยลง" },
              { key: "thirst", label: "ดื่มน้ำบ่อยกว่าปกติ" },
              { key: "weight", label: "น้ำหนักลดลงหรือเพิ่มขึ้นอย่างรวดเร็ว" },
              { key: "vomiting", label: "อาเจียนหรือท้องเสีย" },
              { key: "grooming", label: "เลิกเลียขนหรือแปรงขนตัวเอง" },
              { key: "vocalization", label: "ร้องเสียงดังหรือเงียบผิดปกติ" },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-lg border bg-white cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={checklist[item.key]}
                  onChange={(e) =>
                    setChecklist((prev) => ({
                      ...prev,
                      [item.key]: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded-md border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={openRefs}
        onClose={() => setOpenRefs(false)}
        title="แหล่งอ้างอิง & อ่านต่อ"
      >
        <div className="text-sm text-gray-700 space-y-3">
          <p>
            เนื้อหาเรียบเรียงขึ้นจากแนวทางปฏิบัติทั่วไปและข้อมูลจากสัตวแพทย์
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>ปรึกษาสัตวแพทย์สำหรับคำแนะนำที่เฉพาะเจาะจงกับแมวของคุณ</li>
          </ul>
        </div>
      </Modal>
    </section>
  );
};

export default ArticleDetail4;
