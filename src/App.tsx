import React, { useState, useRef, useEffect } from "react";
import { FrontCard, CardData } from "./components/FrontCard";
import { BackCard } from "./components/BackCard";

const ADDRESS_OPTIONS = [
  '上海市浦东新区海阳西路556号前滩东方广场二期8楼',
  '香港湾仔港湾道25号海港中心2605室',
  '美国德克萨斯州达拉斯市麦金尼大道3131号'
];

const EN_ADDRESS_OPTIONS = [
  '8F, 556 West Haiyang Road, Pudong, Shanghai, China',
  'Room 2605, Harbour Centre, 25 Harbour Road, Wan Chai, Hong Kong',
  '3131 McKinney Avenue，Dallas, Texas, USA'
];

const initialData: CardData = {
  companyName: "Cango Inc.",
  name: "",
  enName: "",
  title: "",
  enTitle: "",
  phone: "",
  email: "",
  address: ADDRESS_OPTIONS[0],
  enAddress: EN_ADDRESS_OPTIONS[0],
  website: "ir.cangoonline.com",
};

export default function App() {
  const [data, setData] = useState<CardData>(() => initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
    link?: string;
  } | null>(null);

  const frontSvgRef = useRef<SVGSVGElement>(null);
  const backSvgRef = useRef<SVGSVGElement>(null);

  // Clear tracking of form modifications and initial reset on load
  useEffect(() => {
    setData(initialData);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    // Reset finalized state if they edit the form again
    setIsFinalized(false);
  };

  const resetForm = () => {
    setData(initialData);
    setIsFinalized(false);
    setStatusMsg(null);
  };

  const handleFinalize = async () => {
    // Validate fields
    const requiredFields: (keyof CardData)[] = ['companyName', 'name', 'enName', 'title', 'enTitle', 'phone', 'email', 'address', 'enAddress', 'website'];
    const missingFields = requiredFields.filter(f => !data[f]);
    if (missingFields.length > 0) {
      setStatusMsg({
        type: 'error',
        text: '请填写所有项后再确认定稿。'
      });
      return;
    }

    if (!frontSvgRef.current || !backSvgRef.current) return;

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const frontSvgString = new XMLSerializer().serializeToString(
        frontSvgRef.current,
      );
      const backSvgString = new XMLSerializer().serializeToString(
        backSvgRef.current,
      );

      const frontBlob = new Blob([frontSvgString], { type: "image/svg+xml" });
      const backBlob = new Blob([backSvgString], { type: "image/svg+xml" });

      const formData = new FormData();
      formData.append("frontSvg", frontBlob, "front.svg");
      formData.append("backSvg", backBlob, "back.svg");
      formData.append("name", data.name);

      const response = await fetch("/api/submit-card", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setIsFinalized(true);
        setStatusMsg({
          type: "success",
          text: "已发起制作申请，预计一周内完成，后续请留意Slack领用通知，谢谢！",
          link: result.previewUrl,
        });
      } else {
        setStatusMsg({
          type: "error",
          text: "生成失败，请重试：" + result.message,
        });
      }
    } catch (error) {
      console.error("Submit error", error);
      setStatusMsg({
        type: "error",
        text: "网络错误，请稍后重试",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!isFinalized) {
      setStatusMsg({
        type: 'error',
        text: '请先确认定稿后再下载 SVG。'
      });
      return;
    }

    if (!frontSvgRef.current || !backSvgRef.current) return;

    const frontSvgString = new XMLSerializer().serializeToString(frontSvgRef.current);
    const backSvgString = new XMLSerializer().serializeToString(backSvgRef.current);

    const downloadFile = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    downloadFile(frontSvgString, 'business-card-front.svg');
    downloadFile(backSvgString, 'business-card-back.svg');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 md:px-10 font-sans text-gray-800">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Side: Form */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-100">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-2">
            自助生成名片 (Business Card Generator)
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                公司名称 (Company Name)
              </label>
              <input
                type="text"
                name="companyName"
                value={data.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                姓名 (Name)
              </label>
              <input
                type="text"
                name="name"
                value={data.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                英文名 (English Name)
              </label>
              <input
                type="text"
                name="enName"
                value={data.enName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                职位 (Title)
              </label>
              <input
                type="text"
                name="title"
                value={data.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                英文职位 (English Title)
              </label>
              <input
                type="text"
                name="enTitle"
                value={data.enTitle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                电话 (Phone)
              </label>
              <input
                type="text"
                name="phone"
                value={data.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                邮箱 (Email)
              </label>
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                办公地址 (Address)
              </label>
              <select
                name="address"
                value={data.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition bg-white"
              >
                {ADDRESS_OPTIONS.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                英文办公地址 (English Address)
              </label>
              <select
                name="enAddress"
                value={data.enAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition bg-white"
              >
                {EN_ADDRESS_OPTIONS.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                官方网址 (Website)
              </label>
              <input
                type="text"
                name="website"
                value={data.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between space-x-4">
            <button
              onClick={resetForm}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
            >
              重新输入 (Reset)
            </button>
            <div className="flex space-x-4">
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition flex items-center shadow-sm"
              >
                下载 SVG (Download)
              </button>
              <button
                onClick={handleFinalize}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-70 flex items-center shadow-sm"
              >
                {isSubmitting ? "提交中..." : "确认定稿 (Finalize & Send)"}
              </button>
            </div>
          </div>

          {statusMsg && (
            <div
              className={`mt-6 p-4 rounded-lg text-sm ${statusMsg.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
            >
              <p>{statusMsg.text}</p>
              {statusMsg.link && (
                <a
                  href={statusMsg.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 font-medium underline text-blue-600"
                >
                  [开发者测试] 查看生成的邮件附件
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Preview */}
        <div className="flex flex-col space-y-8">
          <div>
            <h2 className="text-sm font-semibold uppercase text-gray-500 mb-3 tracking-wider">
              实时预览 - 正面 (Front Preview)
            </h2>
            <div className="bg-white p-2 rounded-xl shadow-md border border-gray-200 aspect-[1.8] flex items-center justify-center overflow-hidden">
              <FrontCard data={data} svgRef={frontSvgRef} />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase text-gray-500 mb-3 tracking-wider">
              实时预览 - 反面 (Back Preview)
            </h2>
            <div className="bg-white p-2 rounded-xl shadow-md border border-gray-200 aspect-[1.8] flex items-center justify-center overflow-hidden">
              <BackCard data={data} svgRef={backSvgRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
