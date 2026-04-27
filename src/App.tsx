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
  Zap
} from 'lucide-react';

// Biểu tượng Zalo SVG tùy chỉnh
const ZaloIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3l-1.5 4.5Z" />
    <path d="M12 13V13" /><path d="M8 13V13" /><path d="M16 13V13" />
  </svg>
);

const STYLES = [
  { id: 'pro_photo', name: 'Nhiếp ảnh Studio', prompt: 'high-end studio photography, soft commercial lighting, clean background' },
  { id: 'business_ads', name: 'Poster Doanh nghiệp', prompt: 'modern business poster style, sleek graphic elements, corporate colors' },
  { id: '3d_premium', name: '3D Render Cao cấp', prompt: 'premium 3D render, soft global illumination, octane style' },
  { id: 'editorial', name: 'Tạp chí Fashion', prompt: 'editorial fashion magazine style, high-end aesthetics, sharp focus' },
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

// API Key được cung cấp tự động bởi môi trường chạy tại runtime
const apiKey = "";

export default function App() {
  const [images, setImages] = useState<{
    human: ImageData;
    product: ImageData;
  }>({
    human: { preview: null, base64: null },
    product: { preview: null, base64: null }
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
      setError("Hãy tải lên ảnh Nhân vật và ảnh Sản phẩm.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setResultImage(null);
    
    try {
      // BƯỚC 1: Sử dụng Gemini 2.5 Flash để phân tích và viết Prompt
      setStatusMsg("Đang phân tích diện mạo và sản phẩm...");
      
      const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Phân tích hai hình ảnh này. Ảnh 1 là một người. Ảnh 2 là một sản phẩm. 
              Hãy tạo một prompt tiếng Anh chi tiết cho công cụ tạo ảnh AI để tạo ra một poster quảng cáo chuyên nghiệp. 
              Người trong ảnh nên cầm hoặc tương tác với sản phẩm một cách tự nhiên. 
              Mô tả ngoại hình của người, sản phẩm và bối cảnh. 
              Phong cách: ${selectedStyle.prompt}. 
              Thêm tiêu đề văn bản: ${mainTitle}` },
              { inlineData: { mimeType: "image/png", data: images.human.base64 } },
              { inlineData: { mimeType: "image/png", data: images.product.base64 } }
            ]
          }]
        })
      });

      const analysisData = await analysisResponse.json();
      if (analysisData.error) throw new Error(analysisData.error.message);
      
      const promptText = analysisData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!promptText) throw new Error("Không thể tạo prompt từ phân tích ảnh.");

      // BƯỚC 2: Sử dụng Imagen 4.0 để tạo ảnh từ Prompt đã phân tích
      setStatusMsg("AI đang vẽ thiết kế marketing...");
      const imagenResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
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
        throw new Error("Không nhận được ảnh từ Imagen. Vui lòng thử lại.");
      }

    } catch (err: any) {
      setError("Lỗi: " + err.message);
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
          <span className="text-[10px] font-black uppercase">{label}</span>
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
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Thiết kế bởi Imagen 4.0</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-widest mb-5 flex items-center gap-2">
              <Zap size={14} className="text-indigo-500" /> 1. Nguồn hình ảnh
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <UploadBox type="human" label="Nhân vật" icon={User} colorClass="bg-blue-50 text-blue-600" subLabel="Diện mạo" />
              <UploadBox type="product" label="Sản phẩm" icon={Package} colorClass="bg-emerald-50 text-emerald-600" subLabel="Sản phẩm" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-widest mb-5">2. Nền tảng & Phong cách</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setSelectedPlatform(p)} className={`px-5 py-2.5 rounded-full text-[10px] font-black border-2 transition-all flex items-center gap-2 ${selectedPlatform.id === p.id ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map(style => (
                <button key={style.id} onClick={() => setSelectedStyle(style)} className={`p-3 rounded-2xl text-[9px] font-black border-2 transition-all uppercase ${selectedStyle.id === style.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-100 bg-slate-50'}`}>
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest mb-2">3. Nội dung thông điệp</h2>
            <input type="text" value={mainTitle} onChange={e => setMainTitle(e.target.value)} placeholder="Tiêu đề quảng cáo (ví dụ: Giảm giá 50%)..." className="w-full p-5 border-2 border-slate-100 rounded-3xl text-xs outline-none bg-slate-50 focus:border-indigo-500 font-bold uppercase transition-all" />
            <button onClick={generateDesign} disabled={isGenerating} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {isGenerating ? "AI ĐANG XỬ LÝ..." : "XUẤT BẢN THIẾT KẾ"}
            </button>
            {error && (
              <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-600 text-[10px] font-bold flex items-center gap-2 animate-pulse">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[4rem] p-8 flex items-center justify-center border-[12px] border-slate-800 shadow-2xl relative min-h-[600px] overflow-hidden">
          {resultImage ? (
            <div className="relative group animate-in fade-in zoom-in duration-700">
              <img src={resultImage} alt="Kết quả AI" className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl backdrop-blur-sm">
                <a href={resultImage} download="ai-marketing-poster.png" className="bg-white text-indigo-600 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform">
                  <Download size={24} />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-30">
              <Monitor size={80} className="mx-auto text-slate-500" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Kết quả thiết kế</p>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center text-white z-10 p-10 text-center">
               <Loader2 className="animate-spin text-indigo-500 mb-4" size={50} strokeWidth={2} />
               <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2">HỆ THỐNG IMAGEN 4.0</h3>
               <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">{statusMsg}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
