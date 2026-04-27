import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Layout, 
  Palette, 
  Type, 
  Download, 
  Loader2, 
  Smartphone, 
  Facebook, 
  Instagram, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  User, 
  Package, 
  FileSearch, 
  Monitor, 
  ShieldCheck, 
  Accessibility,
  ScanFace,
  Languages,
  BadgeCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Biểu tượng Zalo tùy chỉnh (SVG)
const ZaloIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3l-1.5 4.5Z" />
    <path d="M12 13V13" /><path d="M8 13V13" /><path d="M16 13V13" />
  </svg>
);

const STYLES = [
  { id: 'pro_photo', name: 'Nhiếp ảnh Studio', prompt: 'high-end studio portrait photography, ultra-sharp facial details, professional lighting, 8k raw photo, cinematic depth' },
  { id: 'business_ads', name: 'Poster Doanh nghiệp', prompt: 'modern business advertisement style, clean graphic design elements, professional color grading, minimalist corporate layout' },
  { id: '3d_premium', name: '3D Render Cao cấp', prompt: 'premium 3D character render, soft global illumination, octane render, stylized professional office environment' },
  { id: 'editorial', name: 'Tạp chí Thời thượng', prompt: 'editorial magazine cover style, minimalist fashion layout, soft shadows, high-fashion corporate aesthetic' },
];

const PLATFORMS = [
  { id: 'fb_post', name: 'Facebook Feed', icon: <Facebook size={18} />, ratio: '1080x1350', aspect: '4/5' },
  { id: 'insta_square', name: 'Instagram Square', icon: <Instagram size={18} />, ratio: '1080x1080', aspect: '1/1' },
  { id: 'zalo_diary', name: 'Zalo Nhật ký', icon: <ZaloIcon size={18} />, ratio: '1080x1080', aspect: '1/1' },
  { id: 'story_reels', name: 'Story / Reels', icon: <Smartphone size={18} />, ratio: '1080x1920', aspect: '9/16' },
  { id: 'zalo_oa', name: 'Zalo OA Cover', icon: <ZaloIcon size={18} />, ratio: '1200x628', aspect: '1.91/1' },
];

const POSE_TEMPLATES = [
  { id: 'none', name: 'Tự do', path: null },
  { id: 'crossed', name: 'Khoanh tay', path: '<circle cx="50" cy="20" r="10"/><line x1="50" y1="30" x2="50" y2="65"/><path d="M30 45 L50 55 L70 45"/><path d="M50 65 L40 95"/><path d="M50 65 L60 95"/>' },
  { id: 'point_right', name: 'Chỉ tay', path: '<circle cx="50" cy="20" r="10"/><line x1="50" y1="30" x2="50" y2="65"/><path d="M50 40 L35 55"/><path d="M50 40 L85 30"/><path d="M50 65 L40 95"/><path d="M50 65 L60 95"/>' },
  { id: 'holding', name: 'Cầm sản phẩm', path: '<circle cx="50" cy="20" r="10"/><line x1="50" y1="30" x2="50" y2="65"/><path d="M30 50 L45 45"/><path d="M70 50 L55 45"/><rect x="45" y="35" width="10" height="10" fill="currentColor" stroke="none"/><path d="M50 65 L40 95"/><path d="M50 65 L60 95"/>' },
  { id: 'presenting', name: 'Thuyết trình', path: '<circle cx="50" cy="20" r="10"/><line x1="50" y1="30" x2="50" y2="65"/><path d="M50 40 L20 25"/><path d="M50 40 L80 25"/><path d="M50 65 L40 95"/><path d="M50 65 L60 95"/>' },
  { id: 'sitting', name: 'Ngồi làm', path: '<circle cx="40" cy="30" r="10"/><line x1="40" y1="40" x2="40" y2="70"/><path d="M40 50 L60 50 L60 70"/><path d="M40 70 L60 70 L60 95"/><path d="M30 65 L50 65 L50 95"/><rect x="60" y="65" width="25" height="5" fill="currentColor" stroke="none"/><line x1="70" y1="65" x2="70" y2="55"/><line x1="80" y1="65" x2="80" y2="50"/>' }
];

const apiKey = ""; // Sẽ được cung cấp qua Environment Variable

export default function App() {
  const [images, setImages] = useState({
    human: { preview: null, base64: null },
    product: { preview: null, base64: null },
    reference: { preview: null, base64: null }
  });
  
  const [description, setDescription] = useState('');
  const [mainTitle, setMainTitle] = useState('');
  const [selectedPose, setSelectedPose] = useState(POSE_TEMPLATES[0]);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState(null);

  const handleImageUpload = (type, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => ({
          ...prev,
          [type]: { preview: reader.result, base64: reader.result?.toString().split(',')[1] }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const convertSvgToPngBase64 = async (svgPath) => {
    return new Promise((resolve) => {
      if (!svgPath) return resolve(null);
      const svgContent = `<svg width="512" height="512" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="100" height="100" fill="white" stroke="none" />${svgPath}</svg>`;
      const encoded = btoa(unescape(encodeURIComponent(svgContent)));
      const url = `data:image/svg+xml;base64,${encoded}`;
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 512, 512);
          resolve(canvas.toDataURL('image/png').split(',')[1]);
        }
      };
      img.src = url;
    });
  };

  const generateDesign = async () => {
    if (!images.human.base64 || !images.product.base64) {
      setError("Cần tải ảnh Nhân vật & Sản phẩm.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);

    const parts = [];
    let corePrompt = `TASK: Marketing Image for ${selectedPlatform.name}. Style: ${selectedStyle.prompt}. Text: ${mainTitle}. Keep facial identity.`;

    if (selectedPose.path) {
      const poseBase64 = await convertSvgToPngBase64(selectedPose.path);
      parts.push({ text: "ACTION POSE GUIDE:" }, { inlineData: { mimeType: "image/png", data: poseBase64 } });
    }

    parts.push(
      { text: "HUMAN FACE SOURCE:" }, { inlineData: { mimeType: "image/png", data: images.human.base64 } },
      { text: "PRODUCT SOURCE:" }, { inlineData: { mimeType: "image/png", data: images.product.base64 } },
      { text: corePrompt }
    );

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } })
      });

      const data = await response.json();
      const base64 = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (base64) setResultImage(`data:image/png;base64,${base64}`);
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const UploadBox = ({ type, label, icon: Icon, colorClass, subLabel }: any) => (
    <div onClick={() => (document.getElementById(`upload-${type}`) as any).click()} className="border-2 border-dashed border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all aspect-square relative overflow-hidden group">
      <input id={`upload-${type}`} type="file" onChange={(e) => handleImageUpload(type, e)} accept="image/*" className="hidden" />
      {images[type as keyof typeof images].preview ? (
        <img src={images[type as keyof typeof images].preview || ""} className="absolute inset-0 w-full h-full object-cover rounded-3xl" alt={label} />
      ) : (
        <>
          <div className={`${colorClass} p-3 rounded-2xl mb-2`}><Icon size={20} /></div>
          <span className="text-[10px] font-bold uppercase">{label}</span>
          <span className="text-[8px] text-slate-400 uppercase tracking-widest">{subLabel}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl"><Sparkles className="text-white" size={20} /></div>
          <h1 className="font-black tracking-tighter uppercase">AI Designer <span className="text-indigo-600">Pro</span></h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* Panel Trái */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-widest mb-4">1. Nguồn hình ảnh</h2>
            <div className="grid grid-cols-3 gap-3">
              <UploadBox type="human" label="Nhân vật" icon={User} colorClass="bg-blue-100 text-blue-600" subLabel="Diện mạo" />
              <UploadBox type="product" label="Sản phẩm" icon={Package} colorClass="bg-emerald-100 text-emerald-600" subLabel="Ghép vào" />
              <UploadBox type="reference" label="Tham chiếu" icon={FileSearch} colorClass="bg-purple-100 text-purple-600" subLabel="Tùy chọn" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-widest mb-4">2. Dáng đứng & Nền tảng</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {PLATFORMS.slice(0, 3).map(p => (
                <button key={p.id} onClick={() => setSelectedPlatform(p)} className={`px-4 py-2 rounded-full text-[10px] font-bold border-2 transition-all ${selectedPlatform.id === p.id ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-100 bg-slate-50'}`}>{p.name}</button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {POSE_TEMPLATES.map(pose => (
                <button key={pose.id} onClick={() => setSelectedPose(pose)} className={`p-2 rounded-xl border-2 transition-all ${selectedPose.id === pose.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}>
                  <div className="w-8 h-8 mx-auto" dangerouslySetInnerHTML={{ __html: pose.path || '' }} />
                  <div className="text-[8px] font-bold text-center mt-1 uppercase">{pose.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-3">
             <input type="text" value={mainTitle} onChange={e => setMainTitle(e.target.value)} placeholder="Tiêu đề nội dung quảng cáo..." className="w-full p-4 border rounded-2xl text-xs outline-none bg-slate-50 focus:border-indigo-500 font-bold uppercase" />
             <button onClick={generateDesign} disabled={isGenerating} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
               {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
               {isGenerating ? "Đang xử lý AI..." : "Xuất bản thiết kế"}
             </button>
          </div>
        </div>

        {/* Panel Phải */}
        <div className="bg-slate-900 rounded-[3rem] p-6 flex items-center justify-center border-[10px] border-slate-800 shadow-2xl relative min-h-[500px]">
          {resultImage ? (
            <img src={resultImage} alt="Kết quả" className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in fade-in zoom-in" />
          ) : (
            <div className="text-center text-slate-700">
              <Monitor size={60} className="mx-auto opacity-20 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Kết quả thiết kế sẽ hiện tại đây</p>
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10 rounded-[2rem]">
               <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
               <p className="text-xs font-black uppercase animate-pulse">Đang ghép nhân dạng & sản phẩm...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
