import React, { useState } from "react";
import { ResumeData } from "../../types";
import { 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  Settings, 
  Award, 
  Layers, 
  HelpCircle, 
  FileText, 
  Sparkles, 
  Check, 
  BookOpen, 
  Globe, 
  Wand2, 
  PlusCircle, 
  X,
  Languages
} from "lucide-react";

export const ATSBuilder: React.FC = () => {
  const [resume, setResume] = useState<ResumeData>({
    fullName: "John Doe",
    title: "Software Engineer",
    email: "john.doe@email.com",
    phone: "+62 812 3456 7890",
    website: "linkedin.com/in/johndoe",
    address: "Jakarta, Indonesia",
    summary: "Seorang Software Engineer berorientasi solusi dengan keahlian mendalam mendesain SPA React & API NodeJS. Berpengalaman 3+ tahun mengotomatisasi sistem logistik dan meluncurkan dashboard analitik finansial dengan penurunan latensi 40%.",
    experience: [
      {
        id: "exp-1",
        company: "PT Global Solusi Digital",
        position: "Software Engineer React",
        startDate: "Mar 2024",
        endDate: "Sekarang",
        description: "Memimpin penataan ulang kode frontend dashboard pergudangan dengan React dan Redux Toolkit. Mengurangi bundle size sebesar 34% dan meningkatkan Google Lighthouse score hingga 92%."
      }
    ],
    education: [
      {
        id: "edu-1",
        school: "Universitas Bina Nusantara",
        degree: "S1 Teknik Informatika - IPK 3.82",
        startDate: "2018",
        endDate: "2022",
        description: "Menjadi koordinator asisten laboratorium pemrograman web dan aktif dalam UKM riset kecerdasan buatan."
      }
    ],
    skills: ["React", "JavaScript", "TypeScript", "Node.js", "Git", "Tailwind CSS", "REST API"],
    template: "modern"
  });

  // Additional stats in image 4
  const [certifications, setCertifications] = useState([
    { id: "c-1", name: "AWS Certified Developer", issuer: "Amazon Web Services", year: "2023" }
  ]);
  const [languageItems, setLanguageItems] = useState([
    { id: "l-1", lang: "Indonesian (Native)" },
    { id: "l-2", lang: "English (Professional)" }
  ]);

  // Modals / Helpers input state
  const [newSkill, setNewSkill] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("johndoe.com");
  
  // Suggested skills to click & add!
  const [suggestedSkills, setSuggestedSkills] = useState(["Docker", "CI/CD", "AWS", "MongoDB"]);

  // Temp form states
  const [isEnhancingId, setIsEnhancingId] = useState<string | null>(null);

  // New certification temp fields
  const [certInputName, setCertInputName] = useState("");
  const [certInputIssuer, setCertInputIssuer] = useState("");
  const [certInputYear, setCertInputYear] = useState("");

  // Language temp fields
  const [langInputText, setLangInputText] = useState("");

  const handleAddField = (type: "work" | "edu") => {
    if (type === "work") {
      setResume({
        ...resume,
        experience: [
          ...resume.experience,
          {
            id: `exp-${Date.now()}`,
            company: "PT Solusi Sukses",
            position: "Frontend Developer",
            startDate: "Jan 2022",
            endDate: "Des 2023",
            description: "Berkolaborasi dalam menyusun pustaka komponen desain modular dengan Tailwind CSS. Mengakomodasi 10+ modul visual dashboard klien."
          }
        ]
      });
    } else {
      setResume({
        ...resume,
        education: [
          ...resume.education,
          {
            id: `edu-${Date.now()}`,
            school: "Universitas Indonesia",
            degree: "S1 Sistem Informasi",
            startDate: "2016",
            endDate: "2020",
            description: "Lulus dengan fokus studi analisis proses bisnis korporasi."
          }
        ]
      });
    }
  };

  const handleRemoveField = (type: "work" | "edu", id: string) => {
    if (type === "work") {
      setResume({
        ...resume,
        experience: resume.experience.filter((x) => x.id !== id)
      });
    } else {
      setResume({
        ...resume,
        education: resume.education.filter((x) => x.id !== id)
      });
    }
  };

  const handleUpdateField = (type: "work" | "edu", id: string, key: string, value: string) => {
    if (type === "work") {
      const idx = resume.experience.findIndex((x) => x.id === id);
      const copy = [...resume.experience];
      copy[idx] = { ...copy[idx], [key]: value };
      setResume({ ...resume, experience: copy });
    } else {
      const idx = resume.education.findIndex((x) => x.id === id);
      const copy = [...resume.education];
      copy[idx] = { ...copy[idx], [key]: value };
      setResume({ ...resume, education: copy });
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (resume.skills.includes(newSkill.trim())) {
      setNewSkill("");
      return;
    }
    setResume({
      ...resume,
      skills: [...resume.skills, newSkill.trim()]
    });
    setNewSkill("");
  };

  const handleAddSuggestedSkill = (sk: string) => {
    if (resume.skills.includes(sk)) return;
    setResume({
      ...resume,
      skills: [...resume.skills, sk]
    });
    setSuggestedSkills(suggestedSkills.filter(s => s !== sk));
  };

  const handleRemoveSkill = (skill: string) => {
    setResume({
      ...resume,
      skills: resume.skills.filter((s) => s !== skill)
    });
    if (["Docker", "CI/CD", "AWS", "MongoDB"].includes(skill) && !suggestedSkills.includes(skill)) {
      setSuggestedSkills([...suggestedSkills, skill]);
    }
  };

  // Enhance with AI Simulation
  const handleEnhanceWithAI = (expId: string, currentDesc: string) => {
    setIsEnhancingId(expId);
    
    setTimeout(() => {
      // Simulate rewriting with rich bullet points and action words
      const enhancedText = "Developed and maintained high-performance web applications using React and TypeScript. Collaborated with cross-functional product teams to deliver complex user-facing features on schedule. Optimized asset bundling and network payloads, yielding an immediate 30% increase in layout performance.";
      
      setResume(prev => {
        const copyExps = prev.experience.map(exp => {
          if (exp.id === expId) {
            return { ...exp, description: enhancedText };
          }
          return exp;
        });
        return { ...prev, experience: copyExps };
      });
      setIsEnhancingId(null);
    }, 1200);
  };

  // Apply suggested keywords simulation
  const handleApplyKeywordsSuggested = () => {
    const keywords = ["Agile", "REST API", "Git"];
    const appendSkills = keywords.filter(k => !resume.skills.includes(k));
    
    if (appendSkills.length === 0) {
      return;
    }
    
    setResume({
      ...resume,
      skills: [...resume.skills, ...appendSkills]
    });
  };

  // Add Additional info helpers
  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certInputName || !certInputIssuer) return;
    setCertifications([
      ...certifications,
      {
        id: `c-${Date.now()}`,
        name: certInputName,
        issuer: certInputIssuer,
        year: certInputYear || "2024"
      }
    ]);
    setCertInputName("");
    setCertInputIssuer("");
    setCertInputYear("");
  };

  const handleDeleteCert = (id: string) => {
    setCertifications(certifications.filter(c => c.id !== id));
  };

  const handleAddLang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!langInputText.trim()) return;
    setLanguageItems([
      ...languageItems,
      {
        id: `l-${Date.now()}`,
        lang: langInputText.trim()
      }
    ]);
    setLangInputText("");
  };

  const handleDeleteLang = (id: string) => {
    setLanguageItems(languageItems.filter(l => l.id !== id));
  };

  const handleSimulateDownload = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Title & Subtitle */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
          AI ATS Resume Builder
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto font-medium">
          Create a professional ATS-friendly resume with AI assistance. Keep your data neat and look like paper draft instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CV Configurations Inputs (Left Column - Spans 8) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xs text-left max-h-[85vh] overflow-y-auto block">
          
          {/* Card: Personal Information */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-xs"></span>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resume.fullName}
                  onChange={(e) => setResume({ ...resume, fullName: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 bg-slate-50/20 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Professional Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resume.title}
                  onChange={(e) => setResume({ ...resume, title: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 bg-slate-50/20 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={resume.email}
                  onChange={(e) => setResume({ ...resume, email: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 bg-slate-50/20 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resume.phone}
                  onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 bg-slate-50/20 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Location (City, Country)
                </label>
                <input
                  type="text"
                  value={resume.address}
                  onChange={(e) => setResume({ ...resume, address: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 bg-slate-50/20 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  value={resume.website}
                  onChange={(e) => setResume({ ...resume, website: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 bg-slate-50/20 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Portfolio URL
                </label>
                <input
                  type="text"
                  value={portfolioLink}
                  onChange={(e) => setPortfolioLink(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 bg-slate-50/20 font-semibold"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">
                  Professional Summary
                </label>
                <span className="text-[10px] text-purple-600 font-bold">★ Spark AI Advice</span>
              </div>
              <textarea
                rows={3}
                value={resume.summary}
                onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 bg-slate-50/20 font-medium"
              />
              <p className="text-[10px] text-slate-400 italic mt-1 font-medium">
                AI Tip: Keep it concise (2-3 sentences) and focus on your unique value proposition.
              </p>
            </div>
          </div>

          {/* Card: Work Experience */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-xs"></span>
                Work Experience
              </h2>
              <button
                onClick={() => handleAddField("work")}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Experience
              </button>
            </div>

            <div className="space-y-6">
              {resume.experience.map((exp, index) => (
                <div key={exp.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/30 relative space-y-4">
                  <button
                    onClick={() => handleRemoveField("work", exp.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100/40 inline-block pointer-events-none">
                    Experience #{index + 1}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => handleUpdateField("work", exp.id, "position", e.target.value)}
                        className="w-full text-xs p-3 border rounded-xl bg-white focus:ring-1 focus:ring-blue-500 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleUpdateField("work", exp.id, "company", e.target.value)}
                        className="w-full text-xs p-3 border rounded-xl bg-white focus:ring-1 focus:ring-blue-500 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Start Date</label>
                      <input
                        type="text"
                        placeholder="e.g. Mar 2024"
                        value={exp.startDate}
                        onChange={(e) => handleUpdateField("work", exp.id, "startDate", e.target.value)}
                        className="w-full text-xs p-3 border rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">End Date</label>
                      <input
                        type="text"
                        placeholder="e.g. Present"
                        value={exp.endDate}
                        onChange={(e) => handleUpdateField("work", exp.id, "endDate", e.target.value)}
                        className="w-full text-xs p-3 border rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  {/* Responsibilities */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                      Responsibilities & Achievements
                    </label>
                    <textarea
                      rows={3}
                      value={exp.description}
                      onChange={(e) => handleUpdateField("work", exp.id, "description", e.target.value)}
                      className="w-full text-xs p-3 border rounded-xl bg-white font-medium"
                      placeholder="List achievements with bullet points..."
                    />

                    {/* AI ENHANCEMENT BUTTON */}
                    <button
                      type="button"
                      disabled={isEnhancingId === exp.id}
                      onClick={() => handleEnhanceWithAI(exp.id, exp.description)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition cursor-pointer"
                    >
                      {isEnhancingId === exp.id ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-purple-200 border-t-purple-700 animate-spin"></div>
                          <span>Polishing with AI...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 stroke-[2] text-purple-600" />
                          <span>Enhance with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Education */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-xs"></span>
                Education
              </h2>
              <button
                onClick={() => handleAddField("edu")}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Education
              </button>
            </div>

            <div className="space-y-4">
              {resume.education.map((edu, index) => (
                <div key={edu.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/20 relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRemoveField("edu", edu.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100/40 inline-block pointer-events-none">
                      Education #{index + 1}
                    </span>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                      Degree / Major <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleUpdateField("edu", edu.id, "degree", e.target.value)}
                      className="w-full text-xs p-3 border rounded-xl bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                      Institution / School <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => handleUpdateField("edu", edu.id, "school", e.target.value)}
                      className="w-full text-xs p-3 border rounded-xl bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Start Year</label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) => handleUpdateField("edu", edu.id, "startDate", e.target.value)}
                      className="w-full text-xs p-3 border rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">End Year / Graduated</label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={(e) => handleUpdateField("edu", edu.id, "endDate", e.target.value)}
                      className="w-full text-xs p-3 border rounded-xl bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Skills */}
          <div className="space-y-4 border-t pt-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-xs"></span>
              Technical Skills
            </h2>

            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter skill title..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="text-xs p-3 border border-slate-205 rounded-xl flex-1 bg-slate-55/10 bg-slate-50/40 font-medium"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition"
              >
                Add Skill
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {resume.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold px-3 py-1.5 bg-slate-50 border border-slate-150 text-slate-705 rounded-lg select-none"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-red-500 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* AI Skill Suggestions */}
            {suggestedSkills.length > 0 && (
              <div className="bg-purple-50/30 border border-purple-100 p-4 rounded-2xl space-y-2 mt-4">
                <span className="text-[10px] font-extrabold text-purple-705 uppercase tracking-wider block">
                  💡 Based on your experience, consider adding these skills:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {suggestedSkills.map(sk => (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => handleAddSuggestedSkill(sk)}
                      className="px-2.5 py-1 text-[10px] font-bold text-purple-600 border border-purple-200 bg-white hover:bg-purple-50 rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <span>+</span> {sk}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Information: Certifications & Languages */}
          <div className="space-y-6 border-t pt-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-xs"></span>
              Additional Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Certifications Block */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Certifications</h3>
                
                {/* Add Cert Form */}
                <form onSubmit={handleAddCert} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/20 space-y-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Cert Name (e.g. AWS Certified)"
                    value={certInputName}
                    onChange={(e) => setCertInputName(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Issuer"
                      value={certInputIssuer}
                      onChange={(e) => setCertInputIssuer(e.target.value)}
                      className="p-2 border rounded-lg bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Year"
                      value={certInputYear}
                      onChange={(e) => setCertInputYear(e.target.value)}
                      className="p-2 border rounded-lg bg-white"
                    />
                  </div>
                  <button type="submit" className="w-full py-1.5 bg-slate-900 text-white rounded-lg font-bold text-[10px] uppercase">
                    + Add Certification
                  </button>
                </form>

                {/* List */}
                <div className="space-y-2">
                  {certifications.map(c => (
                    <div key={c.id} className="p-3 border rounded-xl flex justify-between items-center bg-slate-50/20">
                      <div>
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{c.issuer} · {c.year}</p>
                      </div>
                      <button onClick={() => handleDeleteCert(c.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages Block */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Languages</h3>
                
                {/* Add Lang Form */}
                <form onSubmit={handleAddLang} className="flex gap-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indonesian (Native)"
                    value={langInputText}
                    onChange={(e) => setLangInputText(e.target.value)}
                    className="flex-grow p-2 border rounded-xl bg-white"
                  />
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px]">
                    Add
                  </button>
                </form>

                {/* List */}
                <div className="space-y-2">
                  {languageItems.map(l => (
                    <div key={l.id} className="p-2.5 border rounded-xl flex justify-between items-center bg-slate-50/25">
                      <span className="font-bold text-slate-800">{l.lang}</span>
                      <button onClick={() => handleDeleteLang(l.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Configurations column (Right Side - Spans 4) */}
        <div className="lg:col-span-4 space-y-6 text-left">
          
          {/* Card: Select Template */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest border-b pb-2">
              Select Template
            </h3>

            <div className="space-y-3">
              {[
                { id: "modern", title: "Modern ATS (Tech focus)", desc: "Clean, proportional and high machine parser score." },
                { id: "corporate", title: "Corporate ATS (Traditional)", desc: "Formal serif layout preferred by finance companies." },
                { id: "minimalist", title: "Fresh Graduate (Entry level)", desc: "Clean and compact focusing on projects." }
              ].map(tpl => (
                <label key={tpl.id} className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="resume-template-choice"
                    checked={resume.template === tpl.id}
                    onChange={() => setResume({ ...resume, template: tpl.id as any })}
                    className="w-4.5 h-4.5 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-850 block">{tpl.title}</span>
                    <span className="text-[10px] text-slate-400 block leading-normal">{tpl.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={() => handleSimulateDownload()}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs uppercase"
            >
              Preview Template Layout
            </button>
          </div>

          {/* Card: AI Assistant */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-xs text-purple-700 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 fill-purple-105" /> AI Assistant Advisor
            </h3>

            <div className="space-y-3.5 text-xs text-slate-550">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">✓ Use Action Verbs</span>
                <p className="text-[10px] leading-normal text-slate-400">
                  Use strong action verbs like "Led", "Developed", "Implemented" to start your bullet points.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">✓ Keyword Optimization</span>
                <p className="text-[10px] leading-normal text-slate-400">
                  Include keywords: React, JavaScript, TypeScript, Git, Agile.
                </p>
                <button
                  type="button"
                  onClick={handleApplyKeywordsSuggested}
                  className="text-[10px] text-blue-600 font-extrabold hover:underline"
                >
                  Apply Keywords →
                </button>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">✓ Quantify Achievements</span>
                <p className="text-[10px] leading-normal text-slate-400">
                  Add numbers and metrics to demonstrate impact (e.g., "Increased performance by 30%").
                </p>
              </div>
            </div>
          </div>

          {/* Card: Actions */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-500">Actions</h3>
            
            <button
              onClick={handleSimulateDownload}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl shadow-sm tracking-wider flex items-center justify-center gap-1 transition"
            >
              <Printer className="w-4 h-4" /> Download PDF (ATS OK)
            </button>
            <button
              onClick={handleSimulateDownload}
              className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs uppercase rounded-xl text-center"
            >
              Preview Paper
            </button>
          </div>

        </div>
      </div>

      {/* Global Bottom Actions row */}
      <div className="mt-8 flex justify-between items-center gap-4 border-t pt-6">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 border border-slate-205 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase transition"
        >
          Save Draft
        </button>

        <button
          onClick={() => {
            window.print();
          }}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-105"
        >
          Generate Resume
        </button>
      </div>
    </div>
  );
};
