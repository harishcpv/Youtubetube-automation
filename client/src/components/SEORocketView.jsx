import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Sparkles, 
  Copy, 
  Check, 
  Hash, 
  FileText, 
  Tag, 
  TrendingUp, 
  Clock, 
  Loader2 
} from 'lucide-react';

export default function SEORocketView({ projectData }) {
  const [topic, setTopic] = useState('5 Mind-Blowing AI Tools in 2026');
  const [niche, setNiche] = useState('Tech & AI');
  const [isGenerating, setIsGenerating] = useState(false);

  const [titles, setTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsFormatted, setTagsFormatted] = useState('');
  const [hashtags, setHashtags] = useState([]);

  const [copiedItem, setCopiedItem] = useState('');

  // Sync if projectData was generated in autopilot
  useEffect(() => {
    if (projectData?.seo) {
      setTitles(projectData.seo.titles || []);
      setSelectedTitle(projectData.seo.selectedTitle || '');
      setDescription(projectData.seo.description || '');
      setTagsFormatted(projectData.seo.tagsFormatted || '');
      setHashtags(projectData.seo.hashtags || []);
    } else {
      handleGenerateSEO();
    }
  }, [projectData]);

  const handleGenerateSEO = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, niche })
      });
      const data = await res.json();
      if (data.success) {
        setTitles(data.titles);
        setSelectedTitle(data.selectedTitle);
        setDescription(data.description);
        setTagsFormatted(data.tagsFormatted);
        setHashtags(data.hashtags);
      }
    } catch (err) {
      console.error('SEO Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(''), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-indigo-400" />
            SEO & Viral Metadata Rocket Agent
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Engineered for maximum search discovery, suggested video algorithms, and YouTube Studio 1-click publishing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {copiedItem && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✓ Copied {copiedItem}!
            </span>
          )}
          <button
            onClick={handleGenerateSEO}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Viral Metadata
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 5 High-CTR Titles (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                1. High-CTR Titles (A/B Test Options)
              </h3>
              <span className="text-[10px] text-slate-400">Under 60 chars optimal for mobile</span>
            </div>

            <div className="space-y-3">
              {titles.map((t, idx) => {
                const isSelected = selectedTitle === t.title;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-indigo-300">{t.style}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-400">
                          {t.ctrEstimate} CTR
                        </span>
                        <button
                          onClick={() => copyToClipboard(t.title, `Title #${idx + 1}`)}
                          className="p-1 text-slate-400 hover:text-white rounded"
                          title="Copy title"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p
                      onClick={() => setSelectedTitle(t.title)}
                      className="text-xs font-bold text-white cursor-pointer hover:text-indigo-200 transition"
                    >
                      {t.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      <span>Length: {t.charCount} chars</span>
                      <span>•</span>
                      <span>Focus Word: <b className="text-amber-400">{t.capitalizedKeyword}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* YouTube Studio 500-Character Tags Box */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                2. YouTube Studio Backend Tags
              </h3>
              <button
                onClick={() => copyToClipboard(tagsFormatted, 'All Tags')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy All Tags
              </button>
            </div>

            <textarea
              rows={4}
              value={tagsFormatted}
              onChange={(e) => setTagsFormatted(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white focus:outline-none custom-scrollbar"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Formatted with commas for direct paste into YouTube Studio.</span>
              <span className={`font-mono font-bold ${tagsFormatted.length > 500 ? 'text-red-400' : 'text-emerald-400'}`}>
                {tagsFormatted.length} / 500 chars
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: High-Retention Description & Hashtags (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Video Description */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                3. SEO Description with Chapters
              </h3>
              <button
                onClick={() => copyToClipboard(description, 'Description')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Description
              </button>
            </div>

            <textarea
              rows={12}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed focus:outline-none custom-scrollbar font-mono"
            />
            <p className="text-[10px] text-slate-500">
              Includes high-conversion first 2 lines hook, value bullets, auto timestamp chapters, and social links.
            </p>
          </div>

          {/* Viral Hashtags */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Hash className="w-4 h-4 text-rose-400" />
                4. Viral Hashtags
              </h3>
              <button
                onClick={() => copyToClipboard(hashtags.join(' '), 'Hashtags')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <Copy className="w-3 h-3" />
                Copy All
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {hashtags.map((h, idx) => (
                <span
                  key={idx}
                  onClick={() => copyToClipboard(h, h)}
                  className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold cursor-pointer hover:bg-rose-500/20 transition"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
