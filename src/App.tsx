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
  BadgeCheck,
  Zap,
  Image as ImageIcon
} from 'lucide-react';

// Biểu tượng Zalo SVG tùy chỉnh
const ZaloIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3l-1.5 4.5Z" />
    <path d="M12 13V13" /><path d="M8 13V13" /><path d="M16 13V13" />
  </svg>
);

const STYLES = [
  { id: 'pro_photo', name: 'Nhiếp ảnh Studio', prompt: 'high-end studio photography, soft commercial lighting, clean professional background, sharp focus' },
  { id: 'business_ads', name: 'Poster Doanh nghiệp', prompt: 'modern business advertisement style, clean graphic elements, professional color grading, minimalist layout' },
  { id: '3d_premium', name: '3D Render Cao cấp', prompt: 'premium 3D product render, soft global illumination, octane render style, stylized environment' },
  { id: 'editorial', name: 'Tạp chí Fashion', prompt: 'editorial fashion magazine style, high-end aesthetics, dramatic lighting, premium feel' },
];

const PLATFORMS = [
  { id: 'fb_post', name: 'Facebook Feed', icon: <Facebook size={18} /> },
  { id: 'insta_square', name: 'Instagram Square', icon: <Instagram size={18} /> },
  { id: 'zalo_diary', name: 'Zalo Nhật ký', icon: <ZaloIcon size={18} /> },
];

interface ImageData {
  preview: string | null;
  base64: string | null;
}

// API Key mặc định để trống, hệ thống sẽ tự nạp tại runtime hoặc lấy từ biến môi trường
const apiKey = "";

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
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
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

  const generateDesign = async () => {
    if (!images.human.base64 || !images.product.base64) {
      setError("Bạn cần tải lên ít nhất ảnh Nhân vật và ảnh Sản phẩm.");
      return;
    }
    
    // Cách lấy API Key an toàn để tránh lỗi biên dịch "import.meta"
    let finalKey = apiKey;
    if (!finalKey) {
      try {
        // @ts-ignore
        finalKey = (import.meta as any).env.VITE_GEMINI_API_KEY || "";
      } catch (e) {
        finalKey = "";
      }
    }
    
    if (!finalKey) {
      setError("Lỗi: Không tìm thấy API Key. Hãy cấu hình VITE_GEMINI_API_KEY trên Vercel và chọn Redeploy.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResultImage(null);
    
    try {
      // BƯỚC 1: Sử dụng Gemini 1.5 Flash để phân tích ảnh và viết Prompt
      setStatusMsg("Đang phân tích diện mạo và sản phẩm...");
      
      const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${finalKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Analyze these images. Image 1: Person's face. Image 2: Product. ${images.reference.base64 ? 'Image 3: Style reference.' : ''} 
              Create a detailed English prompt for Imagen 4.0. The person from Image 1 must be interacting with the product from Image 2. 
              The background style should be: ${selectedStyle.prompt}. 
              Include text overlay: "${mainTitle}". Ensure it looks like a professional commercial poster.` },
              { inlineData: { mimeType: "image/png", data: images.human.base64 } },
              { inlineData: { mimeType: "image/png", data: images.product.base64 } },
              ...(images.reference.base64 ? [{ inlineData: { mimeType: "image/png", data: images.reference.base64 } }] : [])
            ]
          }]
        })
      });

      const analysisData = await analysisResponse.json();
      if (analysisData.error) throw new Error(analysisData.error.message);
      
      const promptText = analysisData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!promptText) throw new Error("Không thể tạo kịch bản thiết kế.");

      // BƯỚC 2: Sử dụng Imagen 4.0 để tạo ảnh (Đây là mô hình tạo ảnh ổn định nhất)
      setStatusMsg("AI đang vẽ thiết kế marketing...");
      const imagenResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${finalKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: promptText }],
          parameters: { sampleCount: 1 }
        })
      });

      const imagenData = await imagenResponse.json();
      if (imagenData.error) throw new Error(imagenData.error.message);

      const base64Image = imagenData.predictions?.[0]?.bytesBase64Encoded;
      if (base64Image) {
        setResultImage(`data:image/png;base64,${base64Image}`);
      } else {
        throw new Error("Không nhận được ảnh từ hệ thống tạo ảnh.");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
      setStatusMsg("");
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
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100"><Sparkles className="text-white" size={20} /></div>
          <div>
            <h1 className="font-black tracking-tighter uppercase text-lg leading-none">AI DESIGNER <span className="text-indigo-600">PRO</span></h1>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Marketing Studio AI v4.0</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* Panel Điều khiển */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-widest mb-5 flex items-center gap-2">
              <Zap size={14} className="text-indigo-500" /> 1. Nguồn hình ảnh
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <UploadBox type="human" label="Nhân vật" icon={User} colorClass="bg-blue-50 text-blue-600" subLabel="Gương mặt" />
              <UploadBox type="product" label="Sản phẩm" icon={Package} colorClass="bg-emerald-50 text-emerald-600" subLabel="Vật thể" />
              <UploadBox type="reference" label="Tham chiếu" icon={FileSearch} colorClass="bg-amber-50 text-amber-600" subLabel="Bối cảnh" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-widest mb-5 flex items-center gap-2">
               <ImageIcon size={14} className="text-indigo-500" /> 2. Nền tảng & Phong cách
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setSelectedPlatform(p)} className={`px-5 py-2.5 rounded-full text-[10px] font-black border-2 transition-all flex items-center gap-2 ${selectedPlatform.id === p.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map(style => (
                <button key={style.id} onClick={() => setSelectedStyle(style)} className={`p-3 rounded-2xl text-[9px] font-black border-2 transition-all uppercase ${selectedStyle.id === style.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <Zap size={14} className="text-indigo-500" /> 3. Thông điệp
            </h2>
            <input type="text" value={mainTitle} onChange={e => setMainTitle(e.target.value)} placeholder="Tiêu đề quảng cáo (ví dụ: Sale Off 50%)..." className="w-full p-5 border-2 border-slate-100 rounded-3xl text-xs outline-none bg-slate-50 focus:border-indigo-500 font-bold uppercase transition-all shadow-inner" />
            <button onClick={generateDesign} disabled={isGenerating} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50">
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {isGenerating ? "Hệ thống đang xử lý..." : "Xuất bản thiết kế ngay"}
            </button>
            {error && (
              <div className="p-5 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-600 text-[10px] font-black uppercase flex items-start gap-3 animate-pulse">
                <AlertCircle size={16} className="shrink-0" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel Kết quả */}
        <div className="bg-slate-900 rounded-[4rem] p-8 flex items-center justify-center border-[12px] border-slate-800 shadow-2xl relative min-h-[600px] overflow-hidden">
          {resultImage ? (
            <div className="relative group animate-in fade-in zoom-in duration-700">
              <img src={resultImage} alt="Kết quả AI" className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl backdrop-blur-sm">
                <a href={resultImage} download={`ai-marketing-${Date.now()}.png`} className="bg-white text-indigo-600 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform">
                  <Download size={24} />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-30">
              <Monitor size={80} className="mx-auto text-slate-500" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Preview Studio</p>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center text-white z-10 p-10 text-center animate-in fade-in">
               <Loader2 className="animate-spin text-indigo-500 mb-6" size={50} strokeWidth={2} />
               <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2">Imagen 4.0 System</h3>
               <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest leading-relaxed">{statusMsg}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
