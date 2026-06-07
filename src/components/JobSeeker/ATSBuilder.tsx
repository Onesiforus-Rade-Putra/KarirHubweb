import React, { useEffect, useState } from "react";
import { ResumeData } from "../../types";
import {
  enhanceResumeExperience,
  fetchResumeDraft,
  fetchResumeKeywordSuggestions,
  generateResume,
  ResumeDraftPayload,
  saveResumeDraft
} from "../../lib/karirHubApi";
import {
  Award,
  BookOpen,
  Briefcase,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Languages,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2
} from "lucide-react";

type TemplateId = ResumeData["template"];

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";
const textareaClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

const SectionHeader = ({
  icon: Icon,
  title,
  tone,
  action
}: {
  icon: React.ElementType;
  title: string;
  tone: string;
  action?: React.ReactNode;
}) => (
  <div className="mb-7 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
    </div>
    {action}
  </div>
);

const Field = ({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black text-slate-500">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
  </label>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-100">
    {children}
  </section>
);

export const ATSBuilder: React.FC = () => {
  const [resume, setResume] = useState<ResumeData>({
    fullName: "John Doe",
    title: "Frontend Developer",
    email: "john.doe@email.com",
    phone: "+62 812 3456 7890",
    website: "linkedin.com/in/johndoe",
    address: "Jakarta, Indonesia",
    summary: "Write a brief summary of your professional background and career goals...",
    experience: [
      {
        id: "exp-1",
        company: "Tech Company",
        position: "Frontend Developer",
        startDate: "",
        endDate: "",
        description:
          "Developed and maintained web applications using React and TypeScript\nCollaborated with cross-functional teams to deliver features\nImproved application performance by 30%"
      }
    ],
    education: [
      {
        id: "edu-1",
        school: "University Name",
        degree: "Bachelor of Computer Science",
        startDate: "2018",
        endDate: "2022",
        description: "3.8/4.0"
      }
    ],
    skills: ["React", "JavaScript", "TypeScript", "Node.js", "Git", "Tailwind CSS", "REST API"],
    template: "modern"
  });
  const [portfolioLink, setPortfolioLink] = useState("johndoe.com");
  const [newSkill, setNewSkill] = useState("");
  const [suggestedSkills, setSuggestedSkills] = useState(["Docker", "CI/CD", "AWS", "MongoDB"]);
  const [isEnhancingId, setIsEnhancingId] = useState<string | null>(null);
  const [certifications, setCertifications] = useState([
    { id: "c-1", name: "AWS Certified Developer", issuer: "Amazon Web Services", year: "2023" }
  ]);
  const [languageItems, setLanguageItems] = useState([
    { id: "l-1", lang: "Indonesian", level: "Native" },
    { id: "l-2", lang: "English", level: "Professional" }
  ]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const buildDraftPayload = (
    resumeValue = resume,
    certificationsValue = certifications,
    languageValue = languageItems,
    portfolioValue = portfolioLink
  ): ResumeDraftPayload => ({
    resume: resumeValue,
    certifications: certificationsValue,
    languages: languageValue,
    portfolioLink: portfolioValue
  });

  useEffect(() => {
    fetchResumeDraft()
      .then(({ draft }) => {
        const data = draft?.resume_data;
        if (!data) return;
        if (data.resume) setResume(data.resume);
        if (Array.isArray(data.certifications)) setCertifications(data.certifications);
        if (Array.isArray(data.languages)) setLanguageItems(data.languages);
        if (data.portfolioLink) setPortfolioLink(data.portfolioLink);
        setStatusMessage("Draft resume berhasil dimuat.");
      })
      .catch(() => {
        const localDraft = window.localStorage.getItem("karirhub_resume_draft");
        if (!localDraft) return;
        try {
          const parsed = JSON.parse(localDraft);
          if (parsed.resume) {
            setResume(parsed.resume);
            setCertifications(parsed.certifications || certifications);
            setLanguageItems(parsed.languages || languageItems);
            setPortfolioLink(parsed.portfolioLink || portfolioLink);
          } else {
            setResume(parsed);
          }
          setStatusMessage("Draft lokal dimuat. Login untuk sinkron ke database.");
        } catch {
          setStatusMessage("");
        }
      });
  }, []);

  const updateResume = (patch: Partial<ResumeData>) => setResume((prev) => ({ ...prev, ...patch }));

  const handleAddField = (type: "work" | "edu") => {
    if (type === "work") {
      updateResume({
        experience: [
          ...resume.experience,
          {
            id: `exp-${Date.now()}`,
            company: "Tech Company",
            position: "Frontend Developer",
            startDate: "",
            endDate: "",
            description: "Describe responsibilities and achievements with measurable impact."
          }
        ]
      });
      return;
    }

    updateResume({
      education: [
        ...resume.education,
        {
          id: `edu-${Date.now()}`,
          school: "University Name",
          degree: "Bachelor Degree",
          startDate: "2020",
          endDate: "2024",
          description: "3.8/4.0"
        }
      ]
    });
  };

  const handleRemoveField = (type: "work" | "edu", id: string) => {
    if (type === "work") {
      updateResume({ experience: resume.experience.filter((item) => item.id !== id) });
      return;
    }

    updateResume({ education: resume.education.filter((item) => item.id !== id) });
  };

  const handleUpdateField = (type: "work" | "edu", id: string, key: string, value: string) => {
    if (type === "work") {
      updateResume({
        experience: resume.experience.map((item) => (item.id === id ? { ...item, [key]: value } : item))
      });
      return;
    }

    updateResume({
      education: resume.education.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    });
  };

  const handleAddSkill = (event: React.FormEvent) => {
    event.preventDefault();
    const skill = newSkill.trim();
    if (!skill || resume.skills.includes(skill)) {
      setNewSkill("");
      return;
    }

    updateResume({ skills: [...resume.skills, skill] });
    setNewSkill("");
  };

  const handleRemoveSkill = (skill: string) => {
    updateResume({ skills: resume.skills.filter((item) => item !== skill) });
    if (["Docker", "CI/CD", "AWS", "MongoDB"].includes(skill) && !suggestedSkills.includes(skill)) {
      setSuggestedSkills([...suggestedSkills, skill]);
    }
  };

  const handleAddSuggestedSkill = (skill: string) => {
    if (!resume.skills.includes(skill)) updateResume({ skills: [...resume.skills, skill] });
    setSuggestedSkills(suggestedSkills.filter((item) => item !== skill));
  };

  const handleSaveDraft = async () => {
    const payload = buildDraftPayload();
    setIsSaving(true);
    try {
      await saveResumeDraft(payload);
      window.localStorage.setItem("karirhub_resume_draft", JSON.stringify(payload));
      setStatusMessage("Draft resume tersimpan ke database.");
    } catch (error) {
      window.localStorage.setItem("karirhub_resume_draft", JSON.stringify(payload));
      setStatusMessage(error instanceof Error ? `${error.message} Draft disimpan lokal.` : "Draft disimpan lokal.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateResume = async () => {
    const payload = buildDraftPayload();
    setIsGenerating(true);
    try {
      await generateResume(payload);
      setStatusMessage("Resume berhasil digenerate dan disimpan.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Generate resume gagal.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhanceWithAI = async (id: string) => {
    const target = resume.experience.find((item) => item.id === id);
    if (!target) return;
    setIsEnhancingId(id);
    try {
      const { enhancedText } = await enhanceResumeExperience({
        text: target.description,
        jobTitle: target.position || resume.title
      });
      updateResume({
        experience: resume.experience.map((item) =>
          item.id === id
            ? {
                ...item,
                description: enhancedText
              }
            : item
        )
      });
      setStatusMessage("Experience berhasil diperbaiki dengan AI.");
    } catch {
      updateResume({
        experience: resume.experience.map((item) =>
          item.id === id
            ? {
                ...item,
                description:
                  "Led development of responsive React interfaces serving key customer workflows.\nImplemented reusable TypeScript components that reduced delivery time by 25%.\nOptimized frontend performance and improved page responsiveness by 30%."
              }
            : item
        )
      });
      setStatusMessage("AI backend belum tersedia. Menggunakan hasil simulasi lokal.");
    } finally {
      setIsEnhancingId(null);
    }
  };

  const handleApplyKeywordsSuggested = async () => {
    try {
      const { keywords } = await fetchResumeKeywordSuggestions({
        jobTitle: resume.title,
        skills: resume.skills
      });
      updateResume({ skills: Array.from(new Set([...resume.skills, ...keywords])) });
      setSuggestedSkills((prev) => prev.filter((item) => !keywords.includes(item)));
      setStatusMessage("Keyword rekomendasi berhasil ditambahkan.");
    } catch {
      const keywords = ["Agile", "REST API", "Git"];
      updateResume({ skills: Array.from(new Set([...resume.skills, ...keywords])) });
      setStatusMessage("Keyword backend belum tersedia. Menggunakan rekomendasi lokal.");
    }
  };

  const handleAddCertification = () => {
    setCertifications([
      ...certifications,
      { id: `c-${Date.now()}`, name: "New Certification", issuer: "Issuer Name", year: "2024" }
    ]);
  };

  const handleAddLanguage = () => {
    setLanguageItems([...languageItems, { id: `l-${Date.now()}`, lang: "New Language", level: "Professional" }]);
  };

  const handlePrint = () => window.print();

  const templates: Array<{ id: TemplateId; title: string; desc: string }> = [
    { id: "modern", title: "Modern ATS", desc: "Clean and professional" },
    { id: "corporate", title: "Corporate ATS", desc: "Traditional and formal" },
    { id: "minimalist", title: "Fresh Graduate", desc: "Entry-level focused" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-14 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-9 text-left">
          <h1 className="text-[40px] font-black leading-tight tracking-tight text-slate-950">AI ATS Resume Builder</h1>
          <p className="mt-2 text-xl font-medium text-slate-500">Create a professional ATS-friendly resume with AI assistance</p>
          {statusMessage && (
            <p className="mt-4 inline-flex rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              {statusMessage}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-6">
            <Card>
              <SectionHeader icon={FileText} title="Personal Information" tone="bg-blue-100 text-blue-600" />

              <div className="grid grid-cols-1 gap-x-20 gap-y-5 md:grid-cols-2">
                <Field label="Full Name" required>
                  <input className={inputClass} value={resume.fullName} onChange={(event) => updateResume({ fullName: event.target.value })} placeholder="John Doe" />
                </Field>
                <Field label="Email" required>
                  <input className={inputClass} value={resume.email} onChange={(event) => updateResume({ email: event.target.value })} placeholder="john.doe@email.com" type="email" />
                </Field>
                <Field label="Phone Number" required>
                  <input className={inputClass} value={resume.phone} onChange={(event) => updateResume({ phone: event.target.value })} placeholder="+62 812 3456 7890" />
                </Field>
                <Field label="Location">
                  <input className={inputClass} value={resume.address} onChange={(event) => updateResume({ address: event.target.value })} placeholder="Jakarta, Indonesia" />
                </Field>
                <Field label="LinkedIn URL">
                  <input className={inputClass} value={resume.website} onChange={(event) => updateResume({ website: event.target.value })} placeholder="linkedin.com/in/johndoe" />
                </Field>
                <Field label="Portfolio URL">
                  <input className={inputClass} value={portfolioLink} onChange={(event) => setPortfolioLink(event.target.value)} placeholder="johndoe.com" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Professional Summary">
                    <textarea className={textareaClass} rows={5} value={resume.summary} onChange={(event) => updateResume({ summary: event.target.value })} placeholder="Write a brief summary of your professional background and career goals..." />
                  </Field>
                  <p className="mt-3 text-sm font-medium text-slate-400">AI Tip: Keep it concise (2-3 sentences) and focus on your unique value proposition</p>
                </div>
              </div>
            </Card>

            <Card>
              <SectionHeader
                icon={Briefcase}
                title="Work Experience"
                tone="bg-emerald-100 text-emerald-600"
                action={
                  <button onClick={() => handleAddField("work")} className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Add Experience
                  </button>
                }
              />

              <div className="space-y-5">
                {resume.experience.map((exp, index) => (
                  <div key={exp.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-800">Experience #{index + 1}</h3>
                      <button onClick={() => handleRemoveField("work", exp.id)} className="text-red-500 hover:text-red-600" title="Delete experience">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                      <Field label="Job Title" required>
                        <input className={inputClass} value={exp.position} onChange={(event) => handleUpdateField("work", exp.id, "position", event.target.value)} placeholder="Frontend Developer" />
                      </Field>
                      <Field label="Company" required>
                        <input className={inputClass} value={exp.company} onChange={(event) => handleUpdateField("work", exp.id, "company", event.target.value)} placeholder="Tech Company" />
                      </Field>
                      <Field label="Start Date">
                        <input className={inputClass} value={exp.startDate} onChange={(event) => handleUpdateField("work", exp.id, "startDate", event.target.value)} />
                      </Field>
                      <div>
                        <Field label="End Date">
                          <input className={inputClass} value={exp.endDate} onChange={(event) => handleUpdateField("work", exp.id, "endDate", event.target.value)} />
                        </Field>
                        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                          Currently working here
                        </label>
                      </div>
                      <div className="md:col-span-2">
                        <Field label="Responsibilities & Achievements">
                          <textarea className={textareaClass} rows={5} value={exp.description} onChange={(event) => handleUpdateField("work", exp.id, "description", event.target.value)} />
                        </Field>
                        <button onClick={() => handleEnhanceWithAI(exp.id)} disabled={isEnhancingId === exp.id} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-purple-50 px-4 text-sm font-black text-purple-700 hover:bg-purple-100">
                          <Sparkles className="h-4 w-4" />
                          {isEnhancingId === exp.id ? "Enhancing..." : "Enhance with AI"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader
                icon={GraduationCap}
                title="Education"
                tone="bg-purple-100 text-purple-600"
                action={
                  <button onClick={() => handleAddField("edu")} className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Add Education
                  </button>
                }
              />

              <div className="space-y-5">
                {resume.education.map((edu, index) => (
                  <div key={edu.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-800">Education #{index + 1}</h3>
                      <button onClick={() => handleRemoveField("edu", edu.id)} className="text-red-500 hover:text-red-600" title="Delete education">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                      <Field label="Degree" required>
                        <input className={inputClass} value={edu.degree} onChange={(event) => handleUpdateField("edu", edu.id, "degree", event.target.value)} placeholder="Bachelor of Computer Science" />
                      </Field>
                      <Field label="Institution" required>
                        <input className={inputClass} value={edu.school} onChange={(event) => handleUpdateField("edu", edu.id, "school", event.target.value)} placeholder="University Name" />
                      </Field>
                      <Field label="Start Year">
                        <input className={inputClass} value={edu.startDate} onChange={(event) => handleUpdateField("edu", edu.id, "startDate", event.target.value)} placeholder="2018" />
                      </Field>
                      <Field label="End Year">
                        <input className={inputClass} value={edu.endDate} onChange={(event) => handleUpdateField("edu", edu.id, "endDate", event.target.value)} placeholder="2022" />
                      </Field>
                      <Field label="GPA (Optional)">
                        <input className={inputClass} value={edu.description} onChange={(event) => handleUpdateField("edu", edu.id, "description", event.target.value)} placeholder="3.8/4.0" />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader icon={Award} title="Skills" tone="bg-orange-100 text-orange-600" />

              <form onSubmit={handleAddSkill} className="mb-6">
                <Field label="Add Skills">
                  <div className="flex gap-3">
                    <input className={inputClass} value={newSkill} onChange={(event) => setNewSkill(event.target.value)} placeholder="Type a skill and press Enter" />
                    <button type="submit" className="h-12 rounded-lg bg-blue-600 px-7 text-sm font-black text-white hover:bg-blue-700">
                      Add
                    </button>
                  </div>
                </Field>
              </form>

              <p className="mb-3 text-xs font-black text-slate-500">Current Skills</p>
              <div className="mb-7 flex flex-wrap gap-3">
                {resume.skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="text-blue-400 hover:text-red-500" title={`Remove ${skill}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {suggestedSkills.length > 0 && (
                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
                  <h3 className="flex items-center gap-2 text-base font-black text-purple-700">
                    <Sparkles className="h-5 w-5" />
                    AI Skill Suggestions
                  </h3>
                  <p className="mt-2 text-sm font-medium text-purple-600">Based on your experience, consider adding these skills:</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {suggestedSkills.map((skill) => (
                      <button key={skill} onClick={() => handleAddSuggestedSkill(skill)} className="rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-sm font-black text-purple-700 hover:bg-purple-100">
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <SectionHeader icon={Languages} title="Additional Information" tone="bg-indigo-100 text-indigo-600" />

              <div className="space-y-8">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-black text-slate-500">Certifications</p>
                    <button onClick={handleAddCertification} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white">
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-3">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                        <div>
                          <p className="font-black text-slate-800">{cert.name}</p>
                          <p className="text-sm font-medium text-slate-500">{cert.issuer} • {cert.year}</p>
                        </div>
                        <button onClick={() => setCertifications(certifications.filter((item) => item.id !== cert.id))} className="text-red-500">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-black text-slate-500">Languages</p>
                    <button onClick={handleAddLanguage} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-black text-white">
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                      {languageItems.map((item) => (
                        <div key={item.id}>
                          <p className="font-black text-slate-800">{item.lang}</p>
                          <p className="text-sm font-medium text-slate-500">{item.level}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setLanguageItems(languageItems.slice(0, -1))} className="text-red-500">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button onClick={handleSaveDraft} disabled={isSaving} className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-base font-black text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                <Save className="h-5 w-5" />
                {isSaving ? "Saving..." : "Save Draft"}
              </button>
              <button onClick={handleGenerateResume} disabled={isGenerating} className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-blue-600 text-base font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
                <Sparkles className="h-5 w-5" />
                {isGenerating ? "Generating..." : "Generate Resume"}
              </button>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <Card>
              <h3 className="mb-5 text-lg font-black text-slate-800">Select Template</h3>
              <div className="space-y-3">
                {templates.map((template) => {
                  const selected = resume.template === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => updateResume({ template: template.id })}
                      className={`flex min-h-[74px] w-full items-center gap-4 rounded-xl border px-4 text-left transition ${selected ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 bg-white hover:border-slate-300"}`}
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-blue-600" : "border-slate-300"}`}>
                        {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                      </span>
                      <span>
                        <span className="block text-sm font-black text-slate-800">{template.title}</span>
                        <span className="block text-xs font-medium text-slate-500">{template.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button onClick={handlePrint} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-100 text-sm font-black text-slate-600 hover:bg-slate-200">
                <Eye className="h-4 w-4" />
                Preview Template
              </button>
            </Card>

            <Card>
              <h3 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-800">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Assistant
              </h3>
              <div className="space-y-4">
                {[
                  ["Add Action Verbs", "Use strong action verbs like 'Led', 'Developed', 'Implemented' to start your bullet points."],
                  ["Keyword Optimization", "Include keywords: React, JavaScript, TypeScript, Git, Agile"],
                  ["Quantify Achievements", "Add numbers and metrics to demonstrate impact (e.g., 'Increased conversion by 25%')"]
                ].map(([title, desc], index) => (
                  <div key={title} className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-black text-purple-700">{index + 1}</span>
                      <div>
                        <h4 className="font-black text-purple-700">{title}</h4>
                        <p className="mt-1 text-sm font-medium leading-5 text-purple-600">{desc}</p>
                        {index === 1 && (
                          <button onClick={handleApplyKeywordsSuggested} className="mt-2 text-sm font-black text-purple-700 hover:underline">
                            Apply Keywords -&gt;
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="mb-5 text-lg font-black text-slate-800">Resume Actions</h3>
              <button onClick={handleGenerateResume} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-black text-white hover:bg-blue-700">
                <Download className="h-5 w-5" />
                Generate Resume
              </button>
              <button onClick={handlePrint} className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-600 hover:bg-slate-50">
                <Eye className="h-5 w-5" />
                Preview Resume
              </button>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};
