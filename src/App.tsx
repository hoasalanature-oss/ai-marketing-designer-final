import React, { useState } from 'react';
import { 
  Download, 
  Loader2, 
  Smartphone, 
  Facebook, 
  Instagram, 
  Sparkles, 
  User, 
  Package, 
  FileSearch, 
  Monitor, 
  AlertCircle,
  BadgeCheck
} from 'lucide-react';

// Biểu tượng Zalo SVG tùy chỉnh
const ZaloIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
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

interface ImageData {
  preview: string | null;
  base64: string | null;
}

export default function App() {
  const [images, setImages] = useState<{
    human: ImageData;
    product: ImageData;
    reference: ImageData;
  }>({
    human: { preview: null, base64: null },
    product: { preview: null, base64: null },
    reference: { preview: null, base64: null }
  });
  
  const [mainTitle, setMainTitle] = useState('');
  const [selectedPose, setSelectedPose] = useState(POSE_TEMPLATES[0]);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (type: keyof typeof images, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => ({
          ...prev,
          [type]: { preview: reader.result as string, base64: (reader.result as string).split(',')[1] }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const convertSvgToPngBase64 = async (svgPath: string | null): Promise<string | null> => {
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
      setError("Hệ thống cần ít nhất ảnh NHÂN VẬT và ảnh SẢN PHẨM.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);

    // Cách lấy API Key an toàn cho môi trường build
    let activeKey = "";
    try {
      // @ts-ignore
      activeKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    } catch (e) {
      console.warn("Không tìm thấy biến môi trường.");
    }

    if (!activeKey) {
      setError("KHÔNG TÌM THẤY API KEY: Hãy cấu hình VITE_GEMINI_API_KEY trong Environment Variables trên Vercel và nhấn REDEPLOY.");
      setIsGenerating(false);
      return;
    }

    const parts: any[] = [];
    const corePrompt = `TASK: Professional Marketing Image for ${selectedPlatform.name}. Style: ${selectedStyle.prompt}. Main Message: "${mainTitle}". Preserve facial identity.`;

    if (selectedPose.path) {
      const poseBase64 = await convertSvgToPngBase64(selectedPose.path);
      if (poseBase64) {
        parts.push({ text: "POSE GUIDE:" }, { inlineData: { mimeType: "image/png", data: poseBase64 } });
      }
    }

    parts.push(
      { text: "HUMAN FACE:" }, { inlineData: { mimeType: "image/png", data: images.human.base64 } },
      { text: "PRODUCT:" }, { inlineData: { mimeType: "image/png", data: images.product.base64 } },
      { text: corePrompt }
    );

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${activeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts }], 
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } 
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Lỗi từ Google AI.");
      }

      const base64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      if (base64) {
        setResultImage(`data:image/png;base64,${base64}`);
      } else {
        throw new Error("AI không trả về ảnh. Hãy thử lại.");
      }
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setIsGenerating(false);
    }
  };

  const UploadBox = ({ type, label, icon: Icon, colorClass, subLabel }: any) => (
    <div onClick={() => (document.getElementById(`upload-${type}`) as HTMLInputElement).click()} className="border-2 border-dashed border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all aspect-square relative overflow-hidden group">
      <input id={`upload-${type}`} type="file" onChange={(e) => handleImageUpload(type, e)} accept="image/*" className="hidden" />
      {images[type as keyof typeof images].preview ? (
        <img src={images[type as keyof typeof images].preview as string} className="absolute inset-0 w-full h-full object-cover rounded-3xl" alt={label} />
      ) : (
        <>
          <div className={`${colorClass} p-3 rounded-2xl mb-2 shadow-sm`}><Icon size={20} /></div>
          <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
          <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">{subLabel}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg"><Sparkles className="text-white" size={20} /></div>
          <div>
            <h1 className="font-black tracking-tighter uppercase text-lg leading-none">AI DESIGNER <span className="text-indigo-600">PRO</span></h1>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Marketing Studio AI</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span> 
              Nguồn hình ảnh
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <UploadBox type="human" label="Nhân vật" icon={User} colorClass="bg-blue-50 text-blue-600" subLabel="Gương mặt" />
              <UploadBox type="product" label="Sản phẩm" icon={Package} colorClass="bg-emerald-50 text-emerald-600" subLabel="Vật thể" />
              <UploadBox type="reference" label="Bối cảnh" icon={FileSearch} colorClass="bg-amber-50 text-amber-600" subLabel="Tùy chọn" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span> 
              Nền tảng & Tư thế
            </h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {PLATFORMS.slice(0, 3).map(p => (
                <button key={p.id} onClick={() => setSelectedPlatform(p)} className={`px-5 py-2.5 rounded-full text-[10px] font-black border-2 transition-all flex items-center gap-2 ${selectedPlatform.id === p.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-2">
              {POSE_TEMPLATES.map(pose => (
                <button key={pose.id} onClick={() => setSelectedPose(pose)} className={`p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedPose.id === pose.id ? 'border-indigo-600 bg-indigo-50/50 shadow-inner' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className={`w-8 h-8 ${selectedPose.id === pose.id ? 'text-indigo-600' : 'text-slate-400'}`} dangerouslySetInnerHTML={{ __html: pose.path || '<rect width="100" height="100" fill="currentColor" opacity="0.1" rx="10"/>' }} />
                  <span className="text-[7px] font-black uppercase text-center">{pose.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span> 
              Nội dung & Phong cách
            </h2>
            <input type="text" value={mainTitle} onChange={e => setMainTitle(e.target.value)} placeholder="Nhập câu tiêu đề quảng cáo..." className="w-full p-5 border-2 border-slate-100 rounded-3xl text-xs outline-none bg-slate-50 focus:border-indigo-500 font-bold uppercase transition-all" />
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map(style => (
                <button key={style.id} onClick={() => setSelectedStyle(style)} className={`p-3 rounded-2xl text-[9px] font-black border-2 transition-all uppercase tracking-tighter ${selectedStyle.id === style.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                  {style.name}
                </button>
              ))}
            </div>
            
            <button onClick={generateDesign} disabled={isGenerating} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {isGenerating ? "AI ĐANG THIẾT KẾ..." : "XUẤT BẢN THIẾT KẾ NGAY"}
            </button>

            {error && (
              <div className="bg-rose-50 border-2 border-rose-100 p-5 rounded-3xl flex items-start gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-tight">Cảnh báo hệ thống</p>
                  <p className="text-[9px] font-bold leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[4rem] p-8 flex items-center justify-center border-[12px] border-slate-800 shadow-2xl relative min-h-[600px] overflow-hidden">
          {resultImage ? (
            <div className="relative group animate-in fade-in zoom-in duration-700">
              <img src={resultImage} alt="Kết quả AI" className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-2xl backdrop-blur-sm">
                <a href={resultImage} download={`marketing-${Date.now()}.png`} className="bg-white text-indigo-600 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform">
                  <Download size={24} />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-30">
              <Monitor size={80} className="mx-auto text-slate-500" strokeWidth={1} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Preview Studio</p>
                <p className="text-[8px] font-bold text-slate-600 uppercase mt-2 tracking-widest italic text-center">Chưa có bản thảo thiết kế</p>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center text-white z-10 p-10 text-center">
               <div className="relative mb-8">
                 <Loader2 className="animate-spin text-indigo-500" size={60} strokeWidth={1.5} />
                 <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" size={24} />
               </div>
               <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2 text-center">AI Marketing Agent</h3>
               <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest max-w-[200px] leading-relaxed text-center">Đang xử lý tách nền, ghép nhân dạng và phối cảnh sản phẩm...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
