import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Type, 
  Sparkles, 
  Download, 
  Sliders, 
  Eye, 
  Smile, 
  Check, 
  Upload,
  RefreshCw,
  Copy
} from 'lucide-react';

export default function ThumbnailStudio({ projectData }) {
  const canvasRef = useRef(null);

  // Thumbnail Text States
  const [headline, setHeadline] = useState('IT HAPPENED!');
  const [subText, setSubText] = useState('THE 1% SECRET');
  const [fillColor, setFillColor] = useState('#FFE600'); // Neon Yellow
  const [fontSize, setFontSize] = useState(82);
  const [strokeWidth, setStrokeWidth] = useState(10);
  const [template, setTemplate] = useState('mrbeast'); // 'mrbeast', 'mystery', 'versus', 'neon'
  const [sticker, setSticker] = useState('arrow'); // 'arrow', 'shock', 'warning', 'free', 'none'
  const [uploadedFace, setUploadedFace] = useState(null);

  // Sync with projectData if generated
  useEffect(() => {
    if (projectData?.thumbnail?.recommended) {
      setHeadline(projectData.thumbnail.recommended.textOverlay || 'IT HAPPENED!');
    }
  }, [projectData]);

  // Redraw canvas whenever options change
  useEffect(() => {
    renderCanvas();
  }, [headline, subText, fillColor, fontSize, strokeWidth, template, sticker, uploadedFace]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = 1280;
    const h = 720;

    // 1. Draw Background based on template
    if (template === 'mrbeast') {
      // Split Cyan / Red Contrast
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#06b6d4'); // Cyan
      grad.addColorStop(0.48, '#0891b2');
      grad.addColorStop(0.52, '#dc2626'); // Red
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Center diagonal lightning divider
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(w * 0.52, 0);
      ctx.lineTo(w * 0.48, h);
      ctx.stroke();

    } else if (template === 'mystery') {
      // Moody Vox Documentary Slate
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, w, h);

      // Golden Spotlight
      const radial = ctx.createRadialGradient(w * 0.7, h * 0.4, 20, w * 0.7, h * 0.4, 450);
      radial.addColorStop(0, 'rgba(234, 179, 8, 0.45)');
      radial.addColorStop(1, 'rgba(11, 15, 25, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);

    } else if (template === 'versus') {
      // Diagonal Neon Green vs Dark Purple
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#052e16');
      grad.addColorStop(0.5, '#16a34a');
      grad.addColorStop(0.5, '#4c1d95');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

    } else {
      // Cyberpunk Violet / Indigo
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#4338ca');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Light grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    }

    // 2. Draw Uploaded Face/Asset Image if present
    if (uploadedFace) {
      ctx.drawImage(uploadedFace, w * 0.58, h * 0.15, 480, 560);
    }

    // 3. Draw Stickers
    if (sticker === 'arrow') {
      ctx.save();
      ctx.translate(w * 0.72, h * 0.35);
      ctx.rotate(-0.35);
      // Giant Red Curved Arrow
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 90, 0, Math.PI * 0.75);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(90, 20);
      ctx.lineTo(60, -25);
      ctx.lineTo(135, -15);
      ctx.fill();
      ctx.restore();
    } else if (sticker === 'shock') {
      ctx.font = '140px sans-serif';
      ctx.fillText('😱', w * 0.75, h * 0.55);
    } else if (sticker === 'warning') {
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.font = '900 120px sans-serif';
      ctx.strokeText('⚠️', w * 0.78, h * 0.5);
      ctx.fillText('⚠️', w * 0.78, h * 0.5);
      ctx.restore();
    } else if (sticker === 'free') {
      ctx.save();
      ctx.translate(w * 0.8, h * 0.3);
      ctx.rotate(0.2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-100, -35, 200, 70);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(-100, -35, 200, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('100% FREE', 0, 2);
      ctx.restore();
    }

    // 4. Draw Bold 3D Text Overlay (Impact / High-CTR style)
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Subtext Banner
    if (subText && subText.trim()) {
      ctx.font = `900 38px Impact, system-ui, sans-serif`;
      const subMetrics = ctx.measureText(subText);
      // Dark pill background
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(70, 110, subMetrics.width + 40, 60);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(subText, 90, 120);
    }

    // Main Headline Text with Thick 3D Stroke & Glow
    if (headline && headline.trim()) {
      ctx.font = `900 ${fontSize}px Impact, system-ui, sans-serif`;

      // 3D Shadow layer
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillText(headline, 76, 206);

      // Black Stroke
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.strokeText(headline, 70, 200);

      // Vibrant Fill
      ctx.fillStyle = fillColor;
      ctx.fillText(headline, 70, 200);
    }

    ctx.restore();
  };

  // Upload face image
  const handleFaceUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setUploadedFace(img);
    };
  };

  // Download High-Res PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    // Trigger local download
    const link = document.createElement('a');
    link.download = `viral_thumbnail_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    // Also persist to server
    fetch('/api/thumbnail/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename: `thumbnail_${Date.now()}.png` })
    }).catch((err) => console.error('Save thumbnail error:', err));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            Viral Thumbnail Studio & High-CTR Canvas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Design high click-through rate thumbnails with 3D text overlays, viral contrast styles, and emotional cues.
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download 1280x720 PNG
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Canvas Controls & Text Customization (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Text Overlays */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-400" />
              1. Punchy Text Overlays
            </h3>

            {/* Headline */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Main Punch Headline (2-4 Words Max):
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. IT HAPPENED!"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-black uppercase focus:outline-none tracking-wider"
              />
            </div>

            {/* Subtext */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Top Subtext / Category Badge:
              </label>
              <input
                type="text"
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                placeholder="e.g. THE 1% SECRET"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white uppercase focus:outline-none"
              />
            </div>

            {/* Color & Size Selectors */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Text Fill Color:
                </label>
                <div className="flex gap-2">
                  {[
                    { color: '#FFE600', name: 'Neon Yellow' },
                    { color: '#FFFFFF', name: 'White' },
                    { color: '#00FF66', name: 'Neon Green' },
                    { color: '#FF1744', name: 'Fiery Red' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setFillColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        fillColor === c.color ? 'border-white scale-110 shadow-md' : 'border-transparent'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Font Size ({fontSize}px):
                </label>
                <input
                  type="range"
                  min="50"
                  max="120"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Style Template & Stickers */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              2. Contrast Style & Viral Stickers
            </h3>

            {/* Background Style Presets */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                High-CTR Visual Template:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'mrbeast', name: '🔥 MrBeast Split Cyan/Red' },
                  { id: 'mystery', name: '🧠 Vox Dark Documentary' },
                  { id: 'versus', name: '⚔️ Extreme Before/After' },
                  { id: 'neon', name: '⚡ Neon Cyber Tech' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                      template === t.id
                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sticker Badges */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                Attention-Grabbing Sticker:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'arrow', label: '↗️ Red Arrow' },
                  { id: 'shock', label: '😱 Shock Face' },
                  { id: 'warning', label: '⚠️ Warning Badge' },
                  { id: 'free', label: '🏷️ 100% Free' },
                  { id: 'none', label: 'None' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSticker(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      sticker === s.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Face Upload */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Add Face / Subject Cutout (PNG):
              </label>
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 hover:border-amber-500 bg-slate-950 cursor-pointer text-xs text-slate-300 transition">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>{uploadedFace ? 'Face image loaded' : 'Upload transparent cutout'}</span>
                <input type="file" accept="image/*" onChange={handleFaceUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live High-Def Canvas & YouTube Feed Mockup (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1280x720 Canvas Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Live 1280x720 HD Canvas (YouTube Standard)
              </h3>
              <span className="text-[11px] font-mono text-slate-400">16:9 • Under 2MB</span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black aspect-video flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* YouTube Feed Simulator (Test Clickability) */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              YouTube Feed Simulator (Standout Test)
            </h4>
            <p className="text-xs text-slate-400">
              Here is how your thumbnail looks when viewers scroll through the competitive YouTube homepage:
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-sm mx-auto shadow-xl space-y-2.5">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video border border-slate-800">
                <canvas
                  width={1280}
                  height={720}
                  ref={(mockCanvas) => {
                    if (mockCanvas && canvasRef.current) {
                      const mCtx = mockCanvas.getContext('2d');
                      mCtx.drawImage(canvasRef.current, 0, 0, 1280, 720);
                    }
                  }}
                  className="w-full h-full object-contain"
                />
                <span className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white">
                  10:24
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-indigo-600 shrink-0 flex items-center justify-center text-white font-bold text-xs">
                  YT
                </div>
                <div>
                  <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {headline} - The Hidden Secret You Must Know in 2026
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">AutoStudio Channel • 240K views • 2 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
