import React, { useEffect, useMemo, useState } from "react";
import { ResumeData } from "../../types";
import {
  createResumeCheckout,
  downloadResumeExport,
  fetchResumeDraft,
  fetchResumePaymentStatus,
  generateResume,
  requestResumeAI,
  ResumeAiAction,
  ResumeAiData,
  ResumeDraftPayload,
  ResumePurchase,
  saveResumeDraft,
  simulateResumePaymentSuccess
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
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X
} from "lucide-react";

type TemplateId = ResumeData["template"];
type Certification = ResumeDraftPayload["certifications"][number];
type LanguageItem = ResumeDraftPayload["languages"][number];
type CheckoutPackageId = "pdf" | "pdf-html" | "all";
type PaymentMethodId = "qris" | "gopay" | "ovo" | "dana" | "shopeepay" | "bca-va" | "mandiri-va";
type AiSuggestion =
  | { kind: "summary"; title: string; professionalSummary: string }
  | { kind: "experience"; title: string; experienceId: string; enhancedBullets: string[] }
  | { kind: "keywords"; title: string; suggestedKeywords: string[] }
  | { kind: "skills"; title: string; suggestedSkills: string[] };
type LastAiRequest = { action: ResumeAiAction; experienceId?: string };

interface GeneratedResume {
  personal: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
  };
  summary: string;
  experience: Array<{ position: string; company: string; period: string; bullets: string[] }>;
  education: Array<{ degree: string; school: string; period: string; details: string }>;
  skills: string[];
  certifications: Certification[];
  languages: LanguageItem[];
  template: TemplateId;
  atsScore: number;
  scoreBreakdown: string[];
  generatedAt: string;
}

const blankResume: ResumeData = {
  fullName: "",
  title: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
  template: "modern"
};

const starterResume: ResumeData = {
  fullName: "John Doe",
  title: "Frontend Developer",
  email: "john.doe@email.com",
  phone: "+62 812 3456 7890",
  website: "linkedin.com/in/johndoe",
  address: "Jakarta, Indonesia",
  summary: "Frontend Developer with experience building responsive web applications using React, TypeScript, and REST APIs. Strong collaborator focused on measurable product impact and clean user experiences.",
  experience: [
    {
      id: "exp-1",
      company: "Tech Company",
      position: "Frontend Developer",
      startDate: "2023",
      endDate: "Present",
      description: "Developed reusable React components that reduced feature delivery time by 25%.\nImproved application performance by 30% through code splitting and rendering optimization.\nCollaborated with product and design teams to ship accessible customer workflows."
    }
  ],
  education: [
    {
      id: "edu-1",
      school: "University Name",
      degree: "Bachelor of Computer Science",
      startDate: "2018",
      endDate: "2022",
      description: "GPA 3.8/4.0"
    }
  ],
  skills: ["React", "TypeScript", "JavaScript", "REST API", "Git", "Tailwind CSS"],
  template: "modern"
};

const inputClass =
  "h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";
const textareaClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";
const actionButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60";
const checkoutPackages: Array<{ id: CheckoutPackageId; title: string; description: string; price: number }> = [
  { id: "pdf", title: "Paket PDF", description: "File final siap cetak lewat dialog print browser.", price: 10000 },
  { id: "pdf-html", title: "Paket PDF + HTML", description: "PDF print-ready dan file HTML yang bisa dibuka ulang.", price: 15000 },
  { id: "all", title: "Semua format", description: "Akses semua format export resume ATS.", price: 25000 }
];
const paymentMethods: Array<{ id: PaymentMethodId; title: string; description: string; prototype?: boolean }> = [
  { id: "qris", title: "QRIS", description: "Scan QRIS demo KarirHub.", prototype: true },
  { id: "gopay", title: "GoPay", description: "Bayar lewat saldo GoPay." },
  { id: "ovo", title: "OVO", description: "Bayar lewat saldo OVO." },
  { id: "dana", title: "DANA", description: "Bayar lewat saldo DANA." },
  { id: "shopeepay", title: "ShopeePay", description: "Bayar lewat ShopeePay." },
  { id: "bca-va", title: "BCA VA", description: "Transfer virtual account BCA.", prototype: true },
  { id: "mandiri-va", title: "Mandiri VA", description: "Transfer virtual account Mandiri.", prototype: true }
];
const adminFeeRate = 0.025;

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
  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
    </div>
    {action}
  </div>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black text-slate-500">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
  </label>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100 lg:p-8">{children}</section>
);

const splitBullets = (text: string) =>
  text
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

const getTemplateTheme = (template: TemplateId) => {
  if (template === "corporate") {
    return {
      page: "font-serif",
      header: "border-b-4 border-slate-900 pb-5 text-center",
      name: "text-3xl font-bold uppercase tracking-[0.08em] text-slate-950",
      section: "border-b border-slate-300 pb-1 font-bold uppercase tracking-[0.12em] text-slate-950",
      accent: "text-slate-800"
    };
  }
  if (template === "minimalist") {
    return {
      page: "font-sans",
      header: "border-l-4 border-emerald-500 pl-5",
      name: "text-4xl font-black text-slate-950",
      section: "font-black uppercase tracking-[0.08em] text-emerald-700",
      accent: "text-emerald-700"
    };
  }
  return {
    page: "font-sans",
    header: "border-b border-blue-200 pb-5",
    name: "text-4xl font-black text-slate-950",
    section: "font-black uppercase tracking-[0.08em] text-blue-700",
    accent: "text-blue-700"
  };
};

const calculateAtsScore = (payload: ResumeDraftPayload) => {
  const { resume, certifications, languages, portfolioLink } = payload;
  const required = [resume.fullName, resume.email, resume.phone, resume.title, resume.summary];
  const contactScore = required.filter((item) => item.trim()).length * 6;
  const structureScore =
    Math.min(resume.experience.length, 3) * 8 +
    Math.min(resume.education.length, 2) * 6 +
    (certifications.length ? 4 : 0) +
    (languages.length ? 4 : 0);
  const keywordText = `${resume.title} ${resume.summary} ${resume.skills.join(" ")} ${resume.experience.map((item) => item.description).join(" ")}`.toLowerCase();
  const keywordMatches = ["react", "typescript", "javascript", "api", "sql", "agile", "lead", "develop", "implement", "improve", "collaborat", "analyt"].filter((word) =>
    keywordText.includes(word)
  ).length;
  const keywordScore = Math.min(30, resume.skills.length * 2 + keywordMatches * 2);
  const impactScore = resume.experience.some((item) => /\d|%|increased|reduced|improved|optimized/i.test(item.description)) ? 10 : 0;
  const linkScore = resume.website || portfolioLink ? 4 : 0;
  const score = Math.min(100, contactScore + structureScore + keywordScore + impactScore + linkScore);
  const breakdown = [
    contactScore >= 24 ? "Kontak dan headline lengkap." : "Lengkapi nama, email, telepon, headline, dan summary.",
    structureScore >= 20 ? "Struktur utama resume sudah terbaca ATS." : "Tambahkan pengalaman, pendidikan, sertifikasi, atau bahasa.",
    keywordScore >= 22 ? "Keyword relevan cukup kuat." : "Tambahkan skill dan kata kerja yang sesuai target posisi.",
    impactScore ? "Bullet sudah punya dampak terukur." : "Tambahkan angka, persen, atau hasil bisnis pada bullet pengalaman."
  ];
  return { score, breakdown };
};

const buildGeneratedResume = (payload: ResumeDraftPayload): GeneratedResume => {
  const { score, breakdown } = calculateAtsScore(payload);
  const { resume } = payload;

  return {
    personal: {
      fullName: resume.fullName,
      title: resume.title,
      email: resume.email,
      phone: resume.phone,
      location: resume.address,
      linkedin: resume.website,
      portfolio: payload.portfolioLink
    },
    summary: resume.summary,
    experience: resume.experience.map((item) => ({
      position: item.position,
      company: item.company,
      period: [item.startDate, item.endDate].filter(Boolean).join(" - "),
      bullets: splitBullets(item.description)
    })),
    education: resume.education.map((item) => ({
      degree: item.degree,
      school: item.school,
      period: [item.startDate, item.endDate].filter(Boolean).join(" - "),
      details: item.description
    })),
    skills: resume.skills,
    certifications: payload.certifications,
    languages: payload.languages,
    template: resume.template,
    atsScore: score,
    scoreBreakdown: breakdown,
    generatedAt: new Date().toISOString()
  };
};

const renderResumeHtml = (generated: GeneratedResume) => {
  const isCorporate = generated.template === "corporate";
  const isFresh = generated.template === "minimalist";
  const accent = isCorporate ? "#0f172a" : isFresh ? "#047857" : "#1d4ed8";
  const fontFamily = isCorporate ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif";
  const sectionBorder = isCorporate ? "border-bottom:1px solid #cbd5e1;padding-bottom:4px;" : "";
  const contact = [generated.personal.email, generated.personal.phone, generated.personal.location, generated.personal.linkedin, generated.personal.portfolio].filter(Boolean).join(" | ");
  const section = (title: string, body: string) =>
    body
      ? `<section style="margin-top:22px;"><h2 style="margin:0 0 10px;color:${accent};font-size:13px;letter-spacing:.08em;text-transform:uppercase;${sectionBorder}">${title}</h2>${body}</section>`
      : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${generated.personal.fullName || "Resume"}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f8fafc; color: #0f172a; font-family: ${fontFamily}; }
    main { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 18mm; }
    h1 { margin: 0; font-size: ${isCorporate ? "28px" : "34px"}; text-transform: ${isCorporate ? "uppercase" : "none"}; letter-spacing: ${isCorporate ? ".08em" : "0"}; }
    p { margin: 0; line-height: 1.5; }
    ul { margin: 8px 0 0 18px; padding: 0; }
    li { margin: 4px 0; line-height: 1.45; }
    .header { ${isFresh ? `border-left: 5px solid ${accent}; padding-left: 18px;` : isCorporate ? "text-align:center;border-bottom:4px solid #0f172a;padding-bottom:18px;" : "border-bottom:1px solid #bfdbfe;padding-bottom:18px;"} }
    .title { margin-top: 5px; color: ${accent}; font-weight: 700; }
    .contact { margin-top: 8px; font-size: 12px; color: #475569; }
    .item { margin-top: 12px; }
    .row { display:flex; justify-content:space-between; gap:18px; font-weight:700; }
    .meta { color:#475569; font-size:12px; white-space:nowrap; }
    .skills { display:flex; flex-wrap:wrap; gap:6px; }
    .skill { border:1px solid #cbd5e1; padding:4px 8px; font-size:12px; }
    @media print { body { background: #fff; } main { width: auto; min-height: auto; margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <main>
    <header class="header">
      <h1>${generated.personal.fullName || "Your Name"}</h1>
      <p class="title">${generated.personal.title || "Target Role"}</p>
      <p class="contact">${contact}</p>
    </header>
    ${section("Professional Summary", generated.summary ? `<p>${generated.summary}</p>` : "")}
    ${section(
      "Experience",
      generated.experience
        .map(
          (item) => `<div class="item"><div class="row"><span>${item.position || "Role"} - ${item.company || "Company"}</span><span class="meta">${item.period}</span></div><ul>${item.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul></div>`
        )
        .join("")
    )}
    ${section(
      "Education",
      generated.education
        .map((item) => `<div class="item"><div class="row"><span>${item.degree || "Degree"} - ${item.school || "School"}</span><span class="meta">${item.period}</span></div>${item.details ? `<p>${item.details}</p>` : ""}</div>`)
        .join("")
    )}
    ${section("Skills", generated.skills.length ? `<div class="skills">${generated.skills.map((skill) => `<span class="skill">${skill}</span>`).join("")}</div>` : "")}
    ${section("Certifications", generated.certifications.map((item) => `<p>${item.name} - ${item.issuer}${item.year ? `, ${item.year}` : ""}</p>`).join(""))}
    ${section("Languages", generated.languages.map((item) => `<p>${item.lang} - ${item.level}</p>`).join(""))}
  </main>
</body>
</html>`;
};

const ResumePreview = ({ generated }: { generated: GeneratedResume }) => {
  const theme = getTemplateTheme(generated.template);
  const contact = [generated.personal.email, generated.personal.phone, generated.personal.location, generated.personal.linkedin, generated.personal.portfolio].filter(Boolean);

  return (
    <article className={`mx-auto min-h-[980px] max-w-[820px] bg-white p-10 text-slate-900 shadow-sm print:shadow-none ${theme.page}`}>
      <header className={theme.header}>
        <h1 className={theme.name}>{generated.personal.fullName || "Your Name"}</h1>
        <p className={`mt-2 text-base font-bold ${theme.accent}`}>{generated.personal.title || "Target Role"}</p>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{contact.join(" | ")}</p>
      </header>

      <div className="mt-8 space-y-7">
        {generated.summary ? (
          <section>
            <h2 className={theme.section}>Professional Summary</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{generated.summary}</p>
          </section>
        ) : null}

        <section>
          <h2 className={theme.section}>Experience</h2>
          {generated.experience.length ? (
            <div className="mt-3 space-y-5">
              {generated.experience.map((item, index) => (
                <div key={`${item.company}-${index}`}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-black">{item.position || "Role"} - {item.company || "Company"}</p>
                    <p className="text-sm font-bold text-slate-500">{item.period}</p>
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                    {item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-slate-400">No experience added yet.</p>
          )}
        </section>

        {generated.education.length ? (
          <section>
            <h2 className={theme.section}>Education</h2>
            <div className="mt-3 space-y-3">
              {generated.education.map((item, index) => (
                <div key={`${item.school}-${index}`} className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-black">{item.degree || "Degree"}</p>
                    <p className="text-sm font-medium text-slate-600">{item.school}</p>
                    {item.details && <p className="text-sm text-slate-500">{item.details}</p>}
                  </div>
                  <p className="text-sm font-bold text-slate-500">{item.period}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {generated.skills.length ? (
          <section>
            <h2 className={theme.section}>Skills</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{generated.skills.join(" | ")}</p>
          </section>
        ) : null}

        {generated.certifications.length ? (
          <section>
            <h2 className={theme.section}>Certifications</h2>
            <div className="mt-3 space-y-1 text-sm leading-6 text-slate-700">
              {generated.certifications.map((item) => <p key={item.id}>{item.name} - {item.issuer}{item.year ? `, ${item.year}` : ""}</p>)}
            </div>
          </section>
        ) : null}

        {generated.languages.length ? (
          <section>
            <h2 className={theme.section}>Languages</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{generated.languages.map((item) => `${item.lang} - ${item.level}`).join(" | ")}</p>
          </section>
        ) : null}
      </div>
    </article>
  );
};

export const ATSBuilder: React.FC = () => {
  const [resume, setResume] = useState<ResumeData>(blankResume);
  const [portfolioLink, setPortfolioLink] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [languageItems, setLanguageItems] = useState<LanguageItem[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<ResumePurchase | null>(null);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedCheckoutPackage, setSelectedCheckoutPackage] = useState<CheckoutPackageId>("pdf-html");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId | "">("");
  const [checkoutStep, setCheckoutStep] = useState<"select" | "payment">("select");
  const [checkoutError, setCheckoutError] = useState("");
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [isDownloading, setIsDownloading] = useState<"pdf" | "html" | null>(null);
  const [isEnhancingId, setIsEnhancingId] = useState<string | null>(null);
  const [aiLoadingAction, setAiLoadingAction] = useState<ResumeAiAction | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiError, setAiError] = useState("");
  const [lastAiRequest, setLastAiRequest] = useState<LastAiRequest | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const hasPaid = purchase?.status === "paid";

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

  const localGenerated = useMemo(() => buildGeneratedResume(buildDraftPayload()), [resume, certifications, languageItems, portfolioLink]);
  const score = generatedResume?.atsScore ?? localGenerated.atsScore;
  const scoreBreakdown = generatedResume?.scoreBreakdown ?? localGenerated.scoreBreakdown;
  const selectedPackage = checkoutPackages.find((item) => item.id === selectedCheckoutPackage) || checkoutPackages[1];
  const adminFee = Math.ceil(selectedPackage.price * adminFeeRate);
  const checkoutTotal = selectedPackage.price + adminFee;
  const selectedPayment = paymentMethods.find((item) => item.id === selectedPaymentMethod);
  const canDownloadPdf = hasPaid && Boolean(purchase?.formats?.includes("pdf"));
  const canDownloadHtml = hasPaid && Boolean(purchase?.formats?.includes("html"));
  const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

  const extractGeneratedDraftId = (result: { draftId?: string; resumeId?: string; draft?: { id?: string } }) =>
    result.draftId || result.resumeId || result.draft?.id || "";

  useEffect(() => {
    let alive = true;
    fetchResumeDraft()
      .then(({ draft, purchase }) => {
        if (!alive) return;
        const data = draft?.resume_data;
        if (data?.resume) {
          setDraftId(draft.id);
          setPurchase(purchase || null);
          setResume({ ...blankResume, ...data.resume, experience: data.resume.experience || [], education: data.resume.education || [], skills: data.resume.skills || [] });
          setCertifications(Array.isArray(data.certifications) ? data.certifications : []);
          setLanguageItems(Array.isArray(data.languages) ? data.languages : []);
          setPortfolioLink(data.portfolioLink || "");
          if (draft?.generated_resume) setGeneratedResume(draft.generated_resume as GeneratedResume);
          setStatus({ type: "success", text: purchase?.status === "paid" ? "Draft dimuat. Pembayaran berhasil, resume siap diunduh." : "Draft resume berhasil dimuat dari database." });
        } else {
          setStatus({ type: "info", text: "Belum ada draft. Mulai dari form kosong atau pakai contoh cepat." });
        }
      })
      .catch((error) => {
        if (!alive) return;
        const localDraft = window.localStorage.getItem("karirhub_resume_draft");
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft) as ResumeDraftPayload;
            setResume({ ...blankResume, ...parsed.resume });
            setCertifications(parsed.certifications || []);
            setLanguageItems(parsed.languages || []);
            setPortfolioLink(parsed.portfolioLink || "");
            setStatus({ type: "info", text: "Draft lokal dimuat. Login diperlukan agar tersimpan ke database." });
            return;
          } catch {
            setStatus({ type: "error", text: "Draft lokal tidak bisa dibaca." });
          }
        }
        setStatus({ type: "error", text: error instanceof Error ? error.message : "Gagal memuat draft resume." });
      })
      .finally(() => alive && setIsLoadingDraft(false));
    return () => {
      alive = false;
    };
  }, []);

  const updateResume = (patch: Partial<ResumeData>) => {
    setResume((prev) => ({ ...prev, ...patch }));
    setGeneratedResume(null);
  };

  const useStarterContent = () => {
    setResume(starterResume);
    setPortfolioLink("johndoe.com");
    setCertifications([{ id: "c-1", name: "AWS Certified Developer", issuer: "Amazon Web Services", year: "2023" }]);
    setLanguageItems([
      { id: "l-1", lang: "Indonesian", level: "Native" },
      { id: "l-2", lang: "English", level: "Professional" }
    ]);
    setGeneratedResume(null);
    setPurchase(null);
    setStatus({ type: "success", text: "Contoh resume dimasukkan. Silakan edit sesuai profil Anda." });
  };

  const handleAddField = (type: "work" | "edu") => {
    if (type === "work") {
      updateResume({
        experience: [
          ...resume.experience,
          { id: `exp-${Date.now()}`, company: "", position: "", startDate: "", endDate: "", description: "" }
        ]
      });
      return;
    }
    updateResume({
      education: [
        ...resume.education,
        { id: `edu-${Date.now()}`, school: "", degree: "", startDate: "", endDate: "", description: "" }
      ]
    });
  };

  const handleRemoveField = (type: "work" | "edu", id: string) => {
    if (type === "work") updateResume({ experience: resume.experience.filter((item) => item.id !== id) });
    else updateResume({ education: resume.education.filter((item) => item.id !== id) });
  };

  const handleUpdateField = (type: "work" | "edu", id: string, key: string, value: string) => {
    if (type === "work") updateResume({ experience: resume.experience.map((item) => (item.id === id ? { ...item, [key]: value } : item)) });
    else updateResume({ education: resume.education.map((item) => (item.id === id ? { ...item, [key]: value } : item)) });
  };

  const handleAddSkill = (event: React.FormEvent) => {
    event.preventDefault();
    const skill = newSkill.trim();
    if (!skill || resume.skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setNewSkill("");
      return;
    }
    updateResume({ skills: [...resume.skills, skill] });
    setNewSkill("");
  };

  const handleSaveDraft = async () => {
    const payload = buildDraftPayload();
    setIsSaving(true);
    setStatus({ type: "info", text: "Menyimpan draft..." });
    try {
      const result = await saveResumeDraft(payload);
      if (!result.draft.id) {
        console.error("Save draft response did not include draft id.", result);
        throw new Error("Backend tidak mengembalikan ID draft resume.");
      }
      setDraftId(result.draft.id);
      window.localStorage.setItem("karirhub_resume_draft", JSON.stringify(payload));
      setStatus({ type: "success", text: `Draft tersimpan ke database${result.draft.updated_at ? ` pada ${new Date(result.draft.updated_at).toLocaleString("id-ID")}` : ""}.` });
    } catch (error) {
      window.localStorage.setItem("karirhub_resume_draft", JSON.stringify(payload));
      setStatus({ type: "error", text: error instanceof Error ? `${error.message} Draft disimpan lokal sebagai cadangan.` : "Draft disimpan lokal sebagai cadangan." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateResume = async () => {
    const payload = buildDraftPayload();
    const fallback = buildGeneratedResume(payload);
    setIsGenerating(true);
    setCheckoutError("");
    setStatus({ type: "info", text: "Membuat preview resume..." });
    try {
      const result = await generateResume(payload);
      const generatedDraftId = extractGeneratedDraftId(result);
      if (!generatedDraftId) {
        console.error("Generate resume response did not include draftId/resumeId.", result);
        throw new Error("Backend tidak mengembalikan ID resume. Coba generate ulang atau periksa endpoint /api/resume-builder/generate.");
      }
      setDraftId(generatedDraftId);
      setPurchase(null);
      setGeneratedResume((result.generatedResume as GeneratedResume) || fallback);
      setShowPreview(true);
      setStatus({ type: "success", text: "Resume berhasil digenerate. Preview gratis, file final perlu dibeli sebelum download." });
    } catch (error) {
      setGeneratedResume(fallback);
      setShowPreview(true);
      setStatus({ type: "error", text: error instanceof Error ? `${error.message} Preview dibuat lokal.` : "Preview dibuat lokal." });
    } finally {
      setIsGenerating(false);
    }
  };

  const buildAiRequestPayload = (action: ResumeAiAction, experienceId?: string) => {
    const targetExperience = experienceId ? resume.experience.find((item) => item.id === experienceId) : null;
    const resumeData = targetExperience
      ? { resume: { title: resume.title, skills: resume.skills, experience: [targetExperience] } }
      : {
          resume: {
            title: resume.title,
            summary: resume.summary,
            skills: resume.skills,
            experience: resume.experience,
            education: resume.education,
          },
          certifications,
        };
    return {
      action,
      resumeData,
      targetRole: targetExperience?.position || resume.title,
    };
  };

  const suggestionFromAiData = (action: ResumeAiAction, data: ResumeAiData, experienceId?: string): AiSuggestion | null => {
    if (action === "summary" && data.professionalSummary) {
      return { kind: "summary", title: "Professional Summary", professionalSummary: data.professionalSummary };
    }
    if (action === "enhance_bullets" && experienceId && data.enhancedBullets.length) {
      return { kind: "experience", title: "Enhanced Experience Bullets", experienceId, enhancedBullets: data.enhancedBullets };
    }
    if (action === "keywords" && data.suggestedKeywords.length) {
      return { kind: "keywords", title: "Keyword Suggestions", suggestedKeywords: data.suggestedKeywords };
    }
    if (action === "skills" && data.suggestedSkills.length) {
      return { kind: "skills", title: "Skill Suggestions", suggestedSkills: data.suggestedSkills };
    }
    return null;
  };

  const runResumeAi = async (action: ResumeAiAction, experienceId?: string) => {
    if (!resume.title && action !== "enhance_bullets") {
      setAiError("Isi Professional Headline atau target role terlebih dahulu.");
      return;
    }

    setAiLoadingAction(action);
    setIsEnhancingId(action === "enhance_bullets" ? experienceId || null : null);
    setAiError("");
    setLastAiRequest({ action, experienceId });
    setStatus({ type: "info", text: "Meminta rekomendasi AI..." });
    try {
      const result = await requestResumeAI(buildAiRequestPayload(action, experienceId));
      const nextSuggestion = suggestionFromAiData(action, result.data, experienceId);
      if (!nextSuggestion) throw new Error("AI belum mengembalikan rekomendasi yang bisa ditinjau.");
      setAiSuggestion(nextSuggestion);
      if (nextSuggestion.kind === "skills") setSuggestedSkills(nextSuggestion.suggestedSkills);
      setStatus({ type: "success", text: "Rekomendasi AI siap ditinjau. Klik Apply jika sudah sesuai." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI resume gagal memproses permintaan.";
      setAiError(message);
      setStatus({ type: "error", text: message });
    } finally {
      setAiLoadingAction(null);
      setIsEnhancingId(null);
    }
  };

  const handleEnhanceWithAI = (id: string) => runResumeAi("enhance_bullets", id);
  const handleGenerateSummary = () => runResumeAi("summary");
  const handleGenerateKeywords = () => runResumeAi("keywords");
  const handleGenerateSkills = () => runResumeAi("skills");
  const handleRetryAi = () => {
    if (!lastAiRequest) return;
    runResumeAi(lastAiRequest.action, lastAiRequest.experienceId);
  };

  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.kind === "summary") {
      updateResume({ summary: aiSuggestion.professionalSummary });
    } else if (aiSuggestion.kind === "experience") {
      handleUpdateField("work", aiSuggestion.experienceId, "description", aiSuggestion.enhancedBullets.join("\n"));
    } else if (aiSuggestion.kind === "keywords") {
      updateResume({ skills: Array.from(new Set([...resume.skills, ...aiSuggestion.suggestedKeywords])) });
    } else if (aiSuggestion.kind === "skills") {
      updateResume({ skills: Array.from(new Set([...resume.skills, ...aiSuggestion.suggestedSkills])) });
      setSuggestedSkills((prev) => prev.filter((item) => !aiSuggestion.suggestedSkills.includes(item)));
    }
    setAiSuggestion(null);
    setAiError("");
    setStatus({ type: "success", text: "Rekomendasi AI diterapkan. Review kembali sebelum menyimpan draft." });
  };

  const openPrintableHtml = (html: string) => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=1200");
    if (!printWindow) {
      setStatus({ type: "error", text: "Popup preview diblokir browser. Izinkan popup untuk download PDF via print." });
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 350);
  };

  const handleOpenCheckout = () => {
    setCheckoutError("");
    if (isGenerating) {
      setStatus({ type: "info", text: "Tunggu proses Generate Resume selesai sebelum membuka checkout." });
      return;
    }
    if (!draftId) {
      const message = "ID resume belum tersedia dari backend. Klik Generate Resume sekali lagi; jika masih terjadi, periksa response /api/resume-builder/generate.";
      console.error(message, { draftId, hasGeneratedResume: Boolean(generatedResume) });
      setCheckoutError(message);
      setShowCheckoutModal(true);
      return;
    }
    setCheckoutStep(purchase?.status === "pending" ? "payment" : "select");
    setShowCheckoutModal(true);
  };

  const handleCheckout = async () => {
    const targetDraftId = draftId;
    if (!targetDraftId) {
      const message = "ID resume belum tersedia. Generate resume harus mengembalikan draftId/resumeId sebelum checkout.";
      console.error(message, { draftId, generatedResume });
      setCheckoutError(message);
      return;
    }
    if (!selectedPaymentMethod) {
      setCheckoutError("Pilih metode pembayaran terlebih dahulu.");
      return;
    }
    setIsCheckingOut(true);
    setCheckoutError("");
    setStatus({ type: "info", text: "Membuat checkout resume..." });
    try {
      const result = await createResumeCheckout({
        draftId: targetDraftId,
        resumeId: targetDraftId,
        packageId: selectedCheckoutPackage,
        paymentMethod: selectedPaymentMethod,
      });
      setPurchase(result.purchase);
      setCheckoutStep("payment");
      setStatus({ type: result.purchase.status === "paid" ? "success" : "info", text: result.purchase.status === "paid" ? "Pembayaran berhasil, resume siap diunduh." : "Menunggu Pembayaran." });
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout resume gagal.");
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Checkout resume gagal." });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!purchase?.id) {
      setStatus({ type: "error", text: "Checkout belum dibuat." });
      return;
    }
    setIsCheckingPayment(true);
    setStatus({ type: "info", text: "Mengecek status pembayaran..." });
    try {
      const result = await fetchResumePaymentStatus(purchase.id);
      setPurchase(result.purchase);
      if (result.purchase.status === "paid") setShowCheckoutModal(false);
      setStatus({ type: result.purchase.status === "paid" ? "success" : "info", text: result.purchase.status === "paid" ? "Pembayaran berhasil, resume siap diunduh." : "Menunggu Pembayaran." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Gagal mengecek status pembayaran." });
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!purchase?.id) {
      setCheckoutError("Checkout belum dibuat.");
      return;
    }
    setIsSimulatingPayment(true);
    setCheckoutError("");
    try {
      const result = await simulateResumePaymentSuccess(purchase.id);
      setPurchase(result.purchase);
      setShowCheckoutModal(false);
      setStatus({ type: "success", text: "Pembayaran berhasil, resume siap diunduh." });
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Gagal mensimulasikan pembayaran.");
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Gagal mensimulasikan pembayaran." });
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const handleDownload = async (format: "pdf" | "html") => {
    if (!purchase?.id || purchase.status !== "paid") {
      setStatus({ type: "error", text: "File final hanya bisa diunduh setelah pembayaran berhasil." });
      return;
    }
    setIsDownloading(format);
    try {
      const html = await downloadResumeExport(purchase.id, format);
      if (format === "pdf") {
        openPrintableHtml(html);
        setStatus({ type: "success", text: "Resume siap dicetak sebagai PDF lewat dialog print browser." });
      } else {
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${(generatedResume || localGenerated).personal.fullName || "resume"}-ats.html`.replace(/\s+/g, "-").toLowerCase();
        link.click();
        URL.revokeObjectURL(url);
        setStatus({ type: "success", text: "File HTML resume berhasil diunduh." });
      }
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Download resume gagal." });
    } finally {
      setIsDownloading(null);
    }
  };

  const templates: Array<{ id: TemplateId; title: string; desc: string }> = [
    { id: "modern", title: "Modern ATS", desc: "Clean, compact, and keyword-forward" },
    { id: "corporate", title: "Corporate ATS", desc: "Formal layout for traditional hiring" },
    { id: "minimalist", title: "Fresh Graduate", desc: "Education and potential-focused" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950">AI ATS Resume Builder</h1>
            <p className="mt-2 text-lg font-medium text-slate-500">Create, save, preview, score, and export an ATS-friendly resume.</p>
          </div>
          <button onClick={useStarterContent} className={`${actionButtonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
            <BookOpen className="h-4 w-4" />
            Use Example
          </button>
        </div>

        {status && (
          <div className={`mb-6 rounded-lg border px-4 py-3 text-sm font-bold ${
            status.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"
          }`}>
            {status.text}
          </div>
        )}

        {(aiError || aiSuggestion) && (
          <div className={`mb-6 rounded-lg border p-5 text-sm ${aiError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {aiError ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold">{aiError}</p>
                <button onClick={handleRetryAi} disabled={!lastAiRequest || aiLoadingAction !== null} className={`${actionButtonClass} bg-red-600 text-white hover:bg-red-700`}>
                  {aiLoadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Coba Lagi
                </button>
              </div>
            ) : aiSuggestion ? (
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black">{aiSuggestion.title}</p>
                    <div className="mt-3 rounded-lg bg-white/70 p-4 font-semibold leading-6 text-slate-700">
                      {aiSuggestion.kind === "summary" && <p>{aiSuggestion.professionalSummary}</p>}
                      {aiSuggestion.kind === "experience" && (
                        <ul className="list-disc space-y-1 pl-5">
                          {aiSuggestion.enhancedBullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                        </ul>
                      )}
                      {aiSuggestion.kind === "keywords" && <p>{aiSuggestion.suggestedKeywords.join(" | ")}</p>}
                      {aiSuggestion.kind === "skills" && <p>{aiSuggestion.suggestedSkills.join(" | ")}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={handleApplyAiSuggestion} className={`${actionButtonClass} bg-emerald-600 text-white hover:bg-emerald-700`}>Apply</button>
                    <button onClick={() => setAiSuggestion(null)} className={`${actionButtonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>Dismiss</button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {isLoadingDraft ? (
          <Card>
            <div className="flex min-h-[300px] items-center justify-center gap-3 text-sm font-black text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading resume draft...
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="space-y-6">
              <Card>
                <SectionHeader icon={FileText} title="Personal Information" tone="bg-blue-100 text-blue-600" />
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                  <Field label="Full Name" required><input className={inputClass} value={resume.fullName} onChange={(event) => updateResume({ fullName: event.target.value })} placeholder="John Doe" /></Field>
                  <Field label="Professional Headline" required><input className={inputClass} value={resume.title} onChange={(event) => updateResume({ title: event.target.value })} placeholder="Frontend Developer" /></Field>
                  <Field label="Email" required><input className={inputClass} value={resume.email} onChange={(event) => updateResume({ email: event.target.value })} placeholder="john.doe@email.com" type="email" /></Field>
                  <Field label="Phone Number" required><input className={inputClass} value={resume.phone} onChange={(event) => updateResume({ phone: event.target.value })} placeholder="+62 812 3456 7890" /></Field>
                  <Field label="Location"><input className={inputClass} value={resume.address} onChange={(event) => updateResume({ address: event.target.value })} placeholder="Jakarta, Indonesia" /></Field>
                  <Field label="LinkedIn URL"><input className={inputClass} value={resume.website} onChange={(event) => updateResume({ website: event.target.value })} placeholder="linkedin.com/in/johndoe" /></Field>
                  <Field label="Portfolio URL"><input className={inputClass} value={portfolioLink} onChange={(event) => setPortfolioLink(event.target.value)} placeholder="johndoe.com" /></Field>
                  <div className="md:col-span-2">
                    <Field label="Professional Summary" required>
                      <textarea className={textareaClass} rows={5} value={resume.summary} onChange={(event) => updateResume({ summary: event.target.value })} placeholder="2-3 sentences with role, core skills, and measurable value." />
                    </Field>
                    <button onClick={handleGenerateSummary} disabled={aiLoadingAction === "summary"} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-purple-50 px-4 text-sm font-black text-purple-700 hover:bg-purple-100 disabled:opacity-60">
                      {aiLoadingAction === "summary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {aiLoadingAction === "summary" ? "Generating..." : "Generate Summary"}
                    </button>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeader
                  icon={Briefcase}
                  title="Work Experience"
                  tone="bg-emerald-100 text-emerald-600"
                  action={<button onClick={() => handleAddField("work")} className={`${actionButtonClass} bg-blue-600 text-white hover:bg-blue-700`}><Plus className="h-4 w-4" />Add Experience</button>}
                />
                {resume.experience.length ? (
                  <div className="space-y-5">
                    {resume.experience.map((exp, index) => (
                      <div key={exp.id} className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="mb-5 flex items-center justify-between">
                          <h3 className="text-base font-black text-slate-800">Experience #{index + 1}</h3>
                          <button onClick={() => handleRemoveField("work", exp.id)} className="text-red-500 hover:text-red-600" title="Delete experience"><Trash2 className="h-5 w-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                          <Field label="Job Title" required><input className={inputClass} value={exp.position} onChange={(event) => handleUpdateField("work", exp.id, "position", event.target.value)} placeholder="Frontend Developer" /></Field>
                          <Field label="Company" required><input className={inputClass} value={exp.company} onChange={(event) => handleUpdateField("work", exp.id, "company", event.target.value)} placeholder="Tech Company" /></Field>
                          <Field label="Start Date"><input className={inputClass} value={exp.startDate} onChange={(event) => handleUpdateField("work", exp.id, "startDate", event.target.value)} placeholder="2023" /></Field>
                          <Field label="End Date"><input className={inputClass} value={exp.endDate} onChange={(event) => handleUpdateField("work", exp.id, "endDate", event.target.value)} placeholder="Present" /></Field>
                          <div className="md:col-span-2">
                            <Field label="Responsibilities & Achievements">
                              <textarea className={textareaClass} rows={5} value={exp.description} onChange={(event) => handleUpdateField("work", exp.id, "description", event.target.value)} placeholder="One bullet per line. Add metrics where possible." />
                            </Field>
                            <button onClick={() => handleEnhanceWithAI(exp.id)} disabled={isEnhancingId === exp.id} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-purple-50 px-4 text-sm font-black text-purple-700 hover:bg-purple-100 disabled:opacity-60">
                              {isEnhancingId === exp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              {isEnhancingId === exp.id ? "Enhancing..." : "Enhance with AI"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">No experience yet. Add work, internship, freelance, or project experience.</div>
                )}
              </Card>

              <Card>
                <SectionHeader
                  icon={GraduationCap}
                  title="Education"
                  tone="bg-purple-100 text-purple-600"
                  action={<button onClick={() => handleAddField("edu")} className={`${actionButtonClass} bg-blue-600 text-white hover:bg-blue-700`}><Plus className="h-4 w-4" />Add Education</button>}
                />
                {resume.education.length ? (
                  <div className="space-y-5">
                    {resume.education.map((edu, index) => (
                      <div key={edu.id} className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="mb-5 flex items-center justify-between">
                          <h3 className="text-base font-black text-slate-800">Education #{index + 1}</h3>
                          <button onClick={() => handleRemoveField("edu", edu.id)} className="text-red-500 hover:text-red-600" title="Delete education"><Trash2 className="h-5 w-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                          <Field label="Degree" required><input className={inputClass} value={edu.degree} onChange={(event) => handleUpdateField("edu", edu.id, "degree", event.target.value)} placeholder="Bachelor of Computer Science" /></Field>
                          <Field label="Institution" required><input className={inputClass} value={edu.school} onChange={(event) => handleUpdateField("edu", edu.id, "school", event.target.value)} placeholder="University Name" /></Field>
                          <Field label="Start Year"><input className={inputClass} value={edu.startDate} onChange={(event) => handleUpdateField("edu", edu.id, "startDate", event.target.value)} placeholder="2018" /></Field>
                          <Field label="End Year"><input className={inputClass} value={edu.endDate} onChange={(event) => handleUpdateField("edu", edu.id, "endDate", event.target.value)} placeholder="2022" /></Field>
                          <Field label="Details"><input className={inputClass} value={edu.description} onChange={(event) => handleUpdateField("edu", edu.id, "description", event.target.value)} placeholder="GPA, thesis, relevant coursework" /></Field>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">No education added yet.</div>
                )}
              </Card>

              <Card>
                <SectionHeader icon={Award} title="Skills" tone="bg-orange-100 text-orange-600" />
                <form onSubmit={handleAddSkill} className="mb-6">
                  <Field label="Add Skill">
                    <div className="flex gap-3">
                      <input className={inputClass} value={newSkill} onChange={(event) => setNewSkill(event.target.value)} placeholder="Type a skill and press Enter" />
                      <button type="submit" className={`${actionButtonClass} h-12 bg-blue-600 px-7 text-white hover:bg-blue-700`}>Add</button>
                    </div>
                  </Field>
                </form>
                {resume.skills.length ? (
                  <div className="mb-7 flex flex-wrap gap-3">
                    {resume.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600">
                        {skill}
                        <button onClick={() => updateResume({ skills: resume.skills.filter((item) => item !== skill) })} className="text-blue-400 hover:text-red-500" title={`Remove ${skill}`}><X className="h-3.5 w-3.5" /></button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mb-7 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">No skills yet. Add keywords from target jobs.</div>
                )}
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-5">
                  <h3 className="flex items-center gap-2 text-base font-black text-purple-700"><Sparkles className="h-5 w-5" />Keyword Suggestions</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {suggestedSkills.map((skill) => (
                      <button key={skill} onClick={() => { updateResume({ skills: Array.from(new Set([...resume.skills, skill])) }); setSuggestedSkills(suggestedSkills.filter((item) => item !== skill)); }} className="rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-sm font-black text-purple-700 hover:bg-purple-100">+ {skill}</button>
                    ))}
                    <button onClick={handleGenerateKeywords} disabled={aiLoadingAction === "keywords"} className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-3 py-1.5 text-sm font-black text-white hover:bg-purple-800 disabled:opacity-60">
                      {aiLoadingAction === "keywords" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Keyword Suggestions
                    </button>
                    <button onClick={handleGenerateSkills} disabled={aiLoadingAction === "skills"} className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-sm font-black text-purple-700 hover:bg-purple-100 disabled:opacity-60">
                      {aiLoadingAction === "skills" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Skill Suggestions
                    </button>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeader icon={Languages} title="Certifications & Languages" tone="bg-indigo-100 text-indigo-600" />
                <div className="space-y-8">
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-black text-slate-500">Certifications</p>
                      <button onClick={() => setCertifications([...certifications, { id: `c-${Date.now()}`, name: "", issuer: "", year: "" }])} className={`${actionButtonClass} bg-blue-600 text-white`}><Plus className="h-4 w-4" />Add</button>
                    </div>
                    <div className="space-y-3">
                      {certifications.length ? certifications.map((cert) => (
                        <div key={cert.id} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_110px_40px]">
                          <input className={inputClass} value={cert.name} onChange={(event) => setCertifications(certifications.map((item) => item.id === cert.id ? { ...item, name: event.target.value } : item))} placeholder="Certification name" />
                          <input className={inputClass} value={cert.issuer} onChange={(event) => setCertifications(certifications.map((item) => item.id === cert.id ? { ...item, issuer: event.target.value } : item))} placeholder="Issuer" />
                          <input className={inputClass} value={cert.year} onChange={(event) => setCertifications(certifications.map((item) => item.id === cert.id ? { ...item, year: event.target.value } : item))} placeholder="Year" />
                          <button onClick={() => setCertifications(certifications.filter((item) => item.id !== cert.id))} className="flex h-12 items-center justify-center text-red-500"><Trash2 className="h-5 w-5" /></button>
                        </div>
                      )) : <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">No certifications yet.</div>}
                    </div>
                  </div>

                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-black text-slate-500">Languages</p>
                      <button onClick={() => setLanguageItems([...languageItems, { id: `l-${Date.now()}`, lang: "", level: "" }])} className={`${actionButtonClass} bg-blue-600 text-white`}><Plus className="h-4 w-4" />Add</button>
                    </div>
                    <div className="space-y-3">
                      {languageItems.length ? languageItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_40px]">
                          <input className={inputClass} value={item.lang} onChange={(event) => setLanguageItems(languageItems.map((lang) => lang.id === item.id ? { ...lang, lang: event.target.value } : lang))} placeholder="Language" />
                          <input className={inputClass} value={item.level} onChange={(event) => setLanguageItems(languageItems.map((lang) => lang.id === item.id ? { ...lang, level: event.target.value } : lang))} placeholder="Level" />
                          <button onClick={() => setLanguageItems(languageItems.filter((lang) => lang.id !== item.id))} className="flex h-12 items-center justify-center text-red-500"><Trash2 className="h-5 w-5" /></button>
                        </div>
                      )) : <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">No languages yet.</div>}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <button onClick={handleSaveDraft} disabled={isSaving} className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-base font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
                <button onClick={handleGenerateResume} disabled={isGenerating || showPreview} className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-blue-600 text-base font-black text-white hover:bg-blue-700 disabled:opacity-60">
                  {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {isGenerating ? "Generating..." : "Generate Resume"}
                </button>
                <button onClick={() => { setGeneratedResume(generatedResume || localGenerated); setShowPreview(true); }} className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-slate-900 text-base font-black text-white hover:bg-slate-800">
                  <Eye className="h-5 w-5" />
                  Preview Resume
                </button>
              </div>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24">
              <Card>
                <h3 className="mb-5 text-lg font-black text-slate-800">ATS Score</h3>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-slate-950">{score}</span>
                  <span className="pb-2 text-sm font-black text-slate-400">/100</span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
                </div>
                <ul className="mt-5 space-y-2 text-sm font-medium leading-5 text-slate-600">
                  {scoreBreakdown.map((item) => <li key={item}>- {item}</li>)}
                </ul>
              </Card>

              <Card>
                <h3 className="mb-5 text-lg font-black text-slate-800">Select Template</h3>
                <div className="space-y-3">
                  {templates.map((template) => {
                    const selected = resume.template === template.id;
                    return (
                      <button key={template.id} onClick={() => updateResume({ template: template.id })} className={`flex min-h-[74px] w-full items-center gap-4 rounded-lg border px-4 text-left transition ${selected ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-blue-600" : "border-slate-300"}`}>{selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}</span>
                        <span><span className="block text-sm font-black text-slate-800">{template.title}</span><span className="block text-xs font-medium text-slate-500">{template.desc}</span></span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h3 className="mb-5 text-lg font-black text-slate-800">Resume Actions</h3>
                <div className="space-y-3">
                  <button onClick={handleGenerateResume} disabled={isGenerating || showPreview} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    Generate Resume
                  </button>
                  <button onClick={() => { setGeneratedResume(localGenerated); setShowPreview(true); }} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-600 hover:bg-slate-50">
                    <Eye className="h-5 w-5" />
                    Preview Resume
                  </button>
                </div>
                <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Preview gratis. File final PDF/HTML dibuka dari footer modal setelah pembayaran berhasil.</p>
              </Card>
            </aside>
          </div>
        )}
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3 shadow-lg">
              <div>
                <p className="text-sm font-black text-slate-800">Resume Preview</p>
                <p className="text-xs font-bold text-slate-500">ATS Score {generatedResume?.atsScore ?? localGenerated.atsScore}/100</p>
              </div>
              <button onClick={() => { setShowPreview(false); setShowCheckoutModal(false); }} className={`${actionButtonClass} border border-slate-200 bg-white text-slate-700`}><X className="h-4 w-4" />Close</button>
            </div>
            <ResumePreview generated={generatedResume || localGenerated} />
            <div className="mt-4 rounded-lg bg-white p-4 shadow-lg">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-800">Preview gratis, file final harus dibeli.</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {hasPaid ? "Pembayaran berhasil, resume siap diunduh." : purchase?.status === "pending" ? "Menunggu Pembayaran. Gunakan tombol cek status untuk memperbarui simulasi development." : "Beli akses download untuk membuka PDF dan HTML final."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!hasPaid ? (
                    <>
                      <button onClick={handleOpenCheckout} disabled={isCheckingOut || isGenerating} className={`${actionButtonClass} bg-blue-600 text-white hover:bg-blue-700`}>
                        {isCheckingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {purchase?.status === "pending" ? "Checkout Dibuat" : "Beli & Download Resume"}
                      </button>
                      {purchase?.status === "pending" && (
                        <button onClick={handleCheckPaymentStatus} disabled={isCheckingPayment} className={`${actionButtonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
                          {isCheckingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Cek Status Pembayaran
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {canDownloadPdf && (
                        <button onClick={() => handleDownload("pdf")} disabled={isDownloading !== null} className={`${actionButtonClass} bg-slate-900 text-white hover:bg-slate-800`}>
                          {isDownloading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          Download PDF
                        </button>
                      )}
                      {canDownloadHtml && (
                        <button onClick={() => handleDownload("html")} disabled={isDownloading !== null} className={`${actionButtonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
                          {isDownloading === "html" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                          Download HTML
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Resume ATS KarirHub</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Template terpilih: {templates.find((item) => item.id === (generatedResume || localGenerated).template)?.title || "Modern ATS"}
                </p>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} disabled={isCheckingOut || isSimulatingPayment} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-60" title="Kembali">
                <X className="h-5 w-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {checkoutError}
              </div>
            )}

            {checkoutStep === "select" ? (
              <>
                <div className="mt-5 space-y-3">
                  {checkoutPackages.map((item) => {
                    const selected = selectedCheckoutPackage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedCheckoutPackage(item.id)}
                        disabled={isCheckingOut}
                        className={`flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${selected ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <span>
                          <span className="block text-sm font-black text-slate-900">{item.title}</span>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">{item.description}</span>
                        </span>
                        <span className="shrink-0 text-sm font-black text-slate-950">{formatCurrency(item.price)}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex justify-between text-sm font-bold text-slate-600">
                    <span>{selectedPackage.title}</span>
                    <span>{formatCurrency(selectedPackage.price)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm font-bold text-slate-600">
                    <span>Biaya admin 2,5%</span>
                    <span>{formatCurrency(adminFee)}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-slate-950">
                    <span>Total pembayaran</span>
                    <span>{formatCurrency(checkoutTotal)}</span>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-3 text-sm font-black text-slate-700">Pilih metode pembayaran</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {paymentMethods.map((method) => {
                      const selected = selectedPaymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          disabled={isCheckingOut}
                          className={`rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${selected ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 bg-white hover:border-slate-300"}`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-black text-slate-900">{method.title}</span>
                            {method.prototype && <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">Simulasi Prototype</span>}
                          </span>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">{method.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button onClick={() => setShowCheckoutModal(false)} disabled={isCheckingOut} className={`${actionButtonClass} h-12 border border-slate-200 bg-white px-6 text-slate-700 hover:bg-slate-50`}>
                    Kembali
                  </button>
                  <button onClick={handleCheckout} disabled={isCheckingOut} className={`${actionButtonClass} h-12 bg-blue-600 px-6 text-white hover:bg-blue-700`}>
                    {isCheckingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Lanjut Pilih Pembayaran
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-black text-blue-800">Menunggu Pembayaran</p>
                  <p className="mt-1 text-xs font-semibold text-blue-700">Simulasi Prototype. Pembayaran belum berhasil sampai tombol simulasi diproses oleh backend.</p>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                  <div><p className="text-xs font-black text-slate-500">Nomor transaksi</p><p className="mt-1 break-all text-sm font-black text-slate-900">{purchase?.id || "-"}</p></div>
                  <div><p className="text-xs font-black text-slate-500">Metode</p><p className="mt-1 text-sm font-black text-slate-900">{selectedPayment?.title || purchase?.paymentMethod || "-"}</p></div>
                  <div><p className="text-xs font-black text-slate-500">Total</p><p className="mt-1 text-sm font-black text-slate-900">{formatCurrency(purchase?.total || checkoutTotal)}</p></div>
                  <div><p className="text-xs font-black text-slate-500">Batas waktu</p><p className="mt-1 text-sm font-black text-slate-900">{purchase?.expiresAt ? new Date(purchase.expiresAt).toLocaleString("id-ID") : "-"}</p></div>
                </div>
                <div className="mt-5 rounded-lg border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-black text-slate-800">Instruksi pembayaran</p>
                  <ol className="list-decimal space-y-2 pl-5 text-sm font-semibold leading-6 text-slate-600">
                    {(purchase?.paymentInstructions?.length ? purchase.paymentInstructions : ["Pilih metode pembayaran dan buat checkout terlebih dahulu."]).map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button onClick={() => setCheckoutStep("select")} disabled={isSimulatingPayment} className={`${actionButtonClass} h-12 border border-slate-200 bg-white px-6 text-slate-700 hover:bg-slate-50`}>
                    Kembali
                  </button>
                  <button onClick={handleSimulatePaymentSuccess} disabled={isSimulatingPayment} className={`${actionButtonClass} h-12 bg-emerald-600 px-6 text-white hover:bg-emerald-700`}>
                    {isSimulatingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Simulasikan Pembayaran Berhasil
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
