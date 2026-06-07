import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Globe, 
  MapPin, 
  Edit3, 
  Check, 
  Award, 
  Plus, 
  Trash2, 
  Phone, 
  Camera, 
  GraduationCap, 
  Briefcase, 
  Bell, 
  Lock, 
  CreditCard, 
  AlertTriangle, 
  ChevronRight, 
  FileText, 
  Download,
  X
} from "lucide-react";

interface ProfileProps {
  currentUser: any;
  onUpdateName: (newName: string) => void;
  toast: (msg: string, status?: string) => void;
}

interface WorkExp {
  id: string;
  role: string;
  company: string;
  date: string;
  duration: string;
  desc: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  date: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
}

export const UserProfile: React.FC<ProfileProps> = ({
  currentUser,
  onUpdateName,
  toast
}) => {
  // Main static/dynamic info
  const [name, setName] = useState(currentUser?.name || "John Doe");
  const [title, setTitle] = useState("Software Engineer");
  const [location, setLocation] = useState("Jakarta, Indonesia");
  const [email, setEmail] = useState("john.doe@email.com");
  const [phone, setPhone] = useState("+62 812 3456 7890");
  const [website, setWebsite] = useState("linkedin.com/in/johndoe");
  const [about, setAbout] = useState(
    "Passionate software engineer dengan 5 tahun pengalaman dalam pengembangan web aplikasi. Memiliki keahlian dalam React, Node.js, dan cloud computing. Saya senang memecahkan masalah kompleks dan membuat solusi yang scalable dan user-friendly."
  );

  // States
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAddExpModalOpen, setIsAddExpModalOpen] = useState(false);
  const [isAddEduModalOpen, setIsAddEduModalOpen] = useState(false);
  const [isAddCertModalOpen, setIsAddCertModalOpen] = useState(false);
  
  // Settings Modals
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDeleteAccModalOpen, setIsDeleteAccModalOpen] = useState(false);

  // Current listings data
  const [experiences, setExperiences] = useState<WorkExp[]>([
    {
      id: "1",
      role: "Senior Software Engineer",
      company: "PT Teknologi Maju Bersama",
      date: "Jan 2022 - Sekarang",
      duration: "3 tahun 4 bulan",
      desc: "Memimpin tim dalam pengembangan platform e-commerce dengan jutaan pengguna aktif. Mengimplementasikan microservices architecture dan meningkatkan performa aplikasi 40%."
    },
    {
      id: "2",
      role: "Software Engineer",
      company: "Startup Indonesia",
      date: "Mar 2020 - Des 2021",
      duration: "1 tahun 10 bulan",
      desc: "Mengembangkan fitur-fitur baru untuk aplikasi mobile dan web. Bekerja dengan React, Node.js, dan PostgreSQL."
    }
  ]);

  const [educations, setEducations] = useState<Education[]>([
    {
      id: "1",
      school: "Universitas Indonesia",
      degree: "S1 Ilmu Komputer",
      date: "2016 - 2020"
    }
  ]);

  const [certifications, setCertifications] = useState<Certification[]>([
    {
      id: "1",
      name: "AWS Certified Developer",
      issuer: "Amazon Web Services"
    },
    {
      id: "2",
      name: "Professional Scrum Master",
      issuer: "Scrum.org"
    }
  ]);

  const [skills, setSkills] = useState<string[]>([
    "React", "Node.js", "TypeScript", "JavaScript", "Python", 
    "PostgreSQL", "MongoDB", "AWS", "Docker", "Git", "REST API", "GraphQL"
  ]);

  const [skillsInput, setSkillsInput] = useState("");
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  // Stats Counters
  const [stats, setStats] = useState({
    views: 245,
    applied: 12,
    interviews: 5
  });

  // CV Files State
  const [cvFile, setCvFile] = useState<{ name: string; size: string } | null>({
    name: "CV_John_Doe_Software_Engineer.pdf",
    size: "2.4 MB"
  });

  // Toggle Switches State
  const [notificationToggle, setNotificationToggle] = useState(true);

  // Modal Temp states
  const [tempProfile, setTempProfile] = useState({
    name, title, location, email, phone, website, about
  });
  const [tempExp, setTempExp] = useState({
    role: "", company: "", startDate: "", endDate: "", isCurrent: false, desc: ""
  });
  const [tempEdu, setTempEdu] = useState({
    school: "", degree: "", date: ""
  });
  const [tempCert, setTempCert] = useState({
    name: "", issuer: ""
  });
  const [tempPass, setTempPass] = useState({
    oldPass: "", newPass: "", confirmPass: ""
  });

  // Action methods
  const openEditProfile = () => {
    setTempProfile({ name, title, location, email, phone, website, about });
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setName(tempProfile.name);
    setTitle(tempProfile.title);
    setLocation(tempProfile.location);
    setEmail(tempProfile.email);
    setPhone(tempProfile.phone);
    setWebsite(tempProfile.website);
    setAbout(tempProfile.about);
    onUpdateName(tempProfile.name);
    setIsEditProfileModalOpen(false);
    toast("Perubahan data profil berhasil diperbarui!", "success");
  };

  const handleCreateExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempExp.role || !tempExp.company) return;
    const dateRange = `${tempExp.startDate} - ${tempExp.isCurrent ? "Sekarang" : tempExp.endDate}`;
    
    const newEntry: WorkExp = {
      id: Date.now().toString(),
      role: tempExp.role,
      company: tempExp.company,
      date: dateRange,
      duration: tempExp.isCurrent ? "Masa Kini" : "Selesai",
      desc: tempExp.desc
    };

    setExperiences([newEntry, ...experiences]);
    setTempExp({ role: "", company: "", startDate: "", endDate: "", isCurrent: false, desc: "" });
    setIsAddExpModalOpen(false);
    toast("Pengalaman kerja berhasil ditambahkan!", "success");
  };

  const handleDeleteExp = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
    toast("Pengalaman kerja berhasil dihapus.", "info");
  };

  const handleCreateEdu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEdu.school || !tempEdu.degree) return;
    const newEntry: Education = {
      id: Date.now().toString(),
      school: tempEdu.school,
      degree: tempEdu.degree,
      date: tempEdu.date || "Tahun Tidak Ditandai"
    };
    setEducations([...educations, newEntry]);
    setTempEdu({ school: "", degree: "", date: "" });
    setIsAddEduModalOpen(false);
    toast("Riwayat pendidikan berhasil ditambahkan!", "success");
  };

  const handleDeleteEdu = (id: string) => {
    setEducations(educations.filter(edu => edu.id !== id));
    toast("Riwayat pendidikan berhasil dihapus.", "info");
  };

  const handleCreateCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempCert.name || !tempCert.issuer) return;
    const newEntry: Certification = {
      id: Date.now().toString(),
      name: tempCert.name,
      issuer: tempCert.issuer
    };
    setCertifications([...certifications, newEntry]);
    setTempCert({ name: "", issuer: "" });
    setIsAddCertModalOpen(false);
    toast("Sertifikasi karir berhasil ditambahkan!", "success");
  };

  const handleDeleteCert = (id: string) => {
    setCertifications(certifications.filter(c => c.id !== id));
    toast("Sertifikasi berhasil dihapus.", "info");
  };

  const handleSkillsAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillsInput.trim()) return;
    if (skills.includes(skillsInput.trim())) {
      setSkillsInput("");
      return;
    }
    setSkills([...skills, skillsInput.trim()]);
    setSkillsInput("");
  };

  const handleRemoveSkill = (term: string) => {
    setSkills(skills.filter(s => s !== term));
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      setCvFile({
        name: file.name,
        size: sizeStr
      });
      toast("CV terbaru berhasil diunggah!", "success");
    }
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPass.newPass || tempPass.newPass !== tempPass.confirmPass) {
      toast("Konfirmasi password baru tidak cocok!", "error");
      return;
    }
    setIsPassModalOpen(false);
    setTempPass({ oldPass: "", newPass: "", confirmPass: "" });
    toast("Kata sandi berhasil diperbarui secara aman!", "success");
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Visual Header Overlapping Card */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm mb-8 flex flex-col">
        {/* Banner area */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-36 w-full relative">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 left-6 hidden md:block">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              Profil Terverifikasi ATS
            </span>
          </div>
        </div>

        {/* Info area */}
        <div className="relative px-6 pb-6 pt-0 flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            {/* Avatar block with active hover edit option */}
            <div className="w-28 h-28 rounded-full border-4 border-white bg-slate-900 text-white flex items-center justify-center relative overflow-hidden shadow-md flex-shrink-0">
              <span className="text-3xl font-extrabold tracking-tight select-none">
                {name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
              </span>
              <button 
                onClick={openEditProfile}
                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition duration-150 flex items-center justify-center cursor-pointer"
                title="Ganti Foto Profil"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-2 flex-grow">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none flex items-center justify-center md:justify-start gap-2">
                  {name}
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Aktif mencari kerja"></span>
                </h1>
                <p className="text-sm font-bold text-blue-600 mt-1 uppercase tracking-wider">{title}</p>
              </div>

              {/* Direct Meta List */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5 leading-none">
                  <MapPin className=" some-space w-3.5 h-3.5 text-slate-350" /> {location}
                </span>
                <span className="flex items-center gap-1.5 leading-none">
                  <Mail className=" w-3.5 h-3.5 text-slate-350" /> {email}
                </span>
                <span className="flex items-center gap-1.5 leading-none">
                  <Phone className=" w-3.5 h-3.5 text-slate-350" /> {phone}
                </span>
                <span className="flex items-center gap-1.5 leading-none">
                  <Globe className=" w-3.5 h-3.5 text-slate-350" /> {website}
                </span>
              </div>
            </div>
          </div>

          {/* Action on absolute far right */}
          <button 
            type="button"
            onClick={openEditProfile}
            className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition duration-155 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-100 uppercase tracking-wider"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profil
          </button>
        </div>
      </div>

      {/* Grid view main split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-start">
        {/* Left column info items (Spans 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tentang Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase tracking-widest text-xs">
                Tentang
              </h2>
              <button 
                onClick={openEditProfile} 
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Edit
              </button>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              {about}
            </p>
          </div>

          {/* Pengalaman Kerja Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-6">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest text-xs">
                Pengalaman Kerja
              </h2>
              <button
                onClick={() => setIsAddExpModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-blue-605 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            {experiences.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">Belum ada pengalaman kerja terdaftar.</p>
              </div>
            ) : (
              <div className="space-y-6 divide-y divide-slate-100">
                {experiences.map((exp, idx) => (
                  <div key={exp.id} className={`flex gap-4 text-left ${idx > 0 ? "pt-5" : ""}`}>
                    {/* Visual box left */}
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 stroke-[1.8]" />
                    </div>

                    {/* text contents right */}
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                            {exp.role}
                          </h3>
                          <p className="text-xs font-bold text-slate-500">
                            {exp.company}
                          </p>
                        </div>

                        {/* Delete capability */}
                        <button
                          onClick={() => handleDeleteExp(exp.id)}
                          className="p-1.5 text-slate-350 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Hapus Pengalaman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-none pt-0.5">
                        {exp.date} {exp.duration && `· ${exp.duration}`}
                      </p>

                      {exp.desc && (
                        <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1 whitespace-pre-wrap">
                          {exp.desc}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pendidikan Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-6">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest text-xs">
                Pendidikan
              </h2>
              <button
                onClick={() => setIsAddEduModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-blue-605 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            {educations.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">Belum ada riwayat pendidikan terdaftar.</p>
              </div>
            ) : (
              <div className="space-y-6 divide-y divide-slate-100">
                {educations.map((edu, idx) => (
                  <div key={edu.id} className={`flex gap-4 text-left ${idx > 0 ? "pt-5" : ""}`}>
                    {/* Visual box left */}
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 stroke-[1.8]" />
                    </div>

                    {/* text contents right */}
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                            {edu.school}
                          </h3>
                          <p className="text-xs font-bold text-slate-500">
                            {edu.degree}
                          </p>
                        </div>

                        {/* Delete capability */}
                        <button
                          onClick={() => handleDeleteEdu(edu.id)}
                          className="p-1.5 text-slate-355 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Hapus Pendidikan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                        Tahun Kelulusan: {edu.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Keahlian Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest text-xs">
                Keahlian
              </h2>
              <button
                onClick={() => setIsEditingSkills(!isEditingSkills)}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                {isEditingSkills ? "Selesai" : "Edit"}
              </button>
            </div>

            {/* Editable inline fields */}
            {isEditingSkills && (
              <form onSubmit={handleSkillsAddSubmit} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Ketik keahlian baru..."
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
                >
                  Tambah Tag
                </button>
              </form>
            )}

            {/* Tags area */}
            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100/40 rounded-xl px-3.5 py-2 hover:bg-blue-105/10 transition select-none"
                >
                  {sk}
                  {isEditingSkills && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(sk)}
                      className="text-blue-400 hover:text-red-500 font-bold leading-none"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Pengaturan Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest text-xs border-b pb-3 mb-4">
              Pengaturan
            </h2>

            {/* Vertically stacked list */}
            <div className="space-y-4">
              {/* Notifikasi */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Notifikasi Akun</h4>
                    <p className="text-xs text-slate-400">Kelola preferensi notifikasi</p>
                  </div>
                </div>

                {/* Simulated CSS Switch */}
                <button
                  onClick={() => {
                    setNotificationToggle(!notificationToggle);
                    toast(`Preferensi notifikasi ${!notificationToggle ? "diaktifkan" : "dinonaktifkan"}.`, "info");
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition duration-200 cursor-pointer ${
                    notificationToggle ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                    notificationToggle ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Ubah Password */}
              <div 
                onClick={() => setIsPassModalOpen(true)}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Ubah Password</h4>
                    <p className="text-xs text-slate-400">Update password akun Anda</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-350" />
              </div>

              {/* Metode Pembayaran */}
              <div 
                onClick={() => setIsPayModalOpen(true)}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Metode Pembayaran</h4>
                    <p className="text-xs text-slate-400">Kelola kartu kredit atau e-wallet dompet belanja</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-350" />
              </div>

              {/* Hapus Akun */}
              <div 
                onClick={() => setIsDeleteAccModalOpen(true)}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-rose-100 bg-rose-50/10 hover:bg-rose-55 hover:bg-rose-50/35 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-700">Hapus Akun Anda</h4>
                    <p className="text-xs text-slate-400">Hapus akun secara permanen</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-350" />
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar panels (Spans 4) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Statistik Profil Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] pb-2 border-b border-slate-100 mb-4 text-left">
              Statistik Profil
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Profil dilihat</span>
                <span className="text-slate-900 text-base">{stats.views} kali</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Lamaran dikirim</span>
                <span className="text-slate-900 text-base">{stats.applied} dokumen</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Undangan interview</span>
                <span className="text-slate-900 text-base text-blue-600">{stats.interviews} tawaran</span>
              </div>
            </div>
          </div>

          {/* CV Saya Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] pb-2 border-b border-slate-100 mb-4 text-left">
              CV Saya
            </h3>

            {/* Dotted upload layout */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50/40 relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleSimulateUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              <div className="space-y-2 relative z-0">
                <FileText className="w-10 h-10 text-slate-350 mx-auto stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-800">
                  {cvFile ? cvFile.name : "Upload CV terbaru Anda"}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold leading-none">
                  {cvFile ? `Ukuran: ${cvFile.size}` : "Format .PDF .DOCX max 10MB"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (cvFile) {
                  toast("Mengunduh CV Anda...", "success");
                } else {
                  toast("Silakan unggah dokumen CV terlebih dahulu.", "error");
                }
              }}
              className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Unduh CV
            </button>
          </div>

          {/* Sertifikasi Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-left">
                Sertifikasi
              </h3>
              <button 
                onClick={() => setIsAddCertModalOpen(true)}
                className="text-xs font-extrabold text-blue-600 hover:underline"
              >
                + Tambah
              </button>
            </div>

            {certifications.length === 0 ? (
              <div className="text-center py-4 text-slate-400">
                <p className="text-xs font-semibold">Belum ada sertifikasi.</p>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                {certifications.map((cert) => (
                  <div key={cert.id} className="flex gap-3 items-start justify-between">
                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 border border-amber-100/50 flex flex-shrink-0 items-center justify-center">
                        <Award className="w-4.5 h-4.5 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {cert.name}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 leading-none mt-0.5">
                          {cert.issuer}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCert(cert.id)}
                      className="p-1 text-slate-350 hover:text-red-500 rounded transition"
                      title="Hapus Sertifikasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-blue-650 to-blue-600 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Perbarui Informasi Profil</h3>
                <p className="text-xs opacity-75">Sunting data primer pencari kerja Anda</p>
              </div>
              <button onClick={() => setIsEditProfileModalOpen(false)} className="text-white hover:opacity-80 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto block text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">NAMA LENGKAP</label>
                  <input
                    type="text"
                    required
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">FOKUS SP SIALISASI</label>
                  <input
                    type="text"
                    required
                    value={tempProfile.title}
                    onChange={(e) => setTempProfile({ ...tempProfile, title: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">KOTA DOMISILI</label>
                  <input
                    type="text"
                    required
                    value={tempProfile.location}
                    onChange={(e) => setTempProfile({ ...tempProfile, location: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">ALAMAT SUREL / EMAIL</label>
                  <input
                    type="email"
                    required
                    value={tempProfile.email}
                    onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">NOMOR TELEPON</label>
                  <input
                    type="text"
                    required
                    value={tempProfile.phone}
                    onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">LINKEDIN / PORTFOLIO</label>
                  <input
                    type="text"
                    required
                    value={tempProfile.website}
                    onChange={(e) => setTempProfile({ ...tempProfile, website: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">RINGKASAN TENTANG SAYA</label>
                <textarea
                  rows={4}
                  required
                  value={tempProfile.about}
                  onChange={(e) => setTempProfile({ ...tempProfile, about: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  placeholder="Ceritakan sejarah ringkas profesionalisme karir Anda..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-605 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAMBAH EXP MODAL ================= */}
      {isAddExpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Tambah Riwayat Pengalaman Kerja</h3>
              </div>
              <button onClick={() => setIsAddExpModalOpen(false)} className="text-white hover:opacity-80 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExp} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">NAMA JABATAN / ROLE</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Senior Fullstack Developer"
                  value={tempExp.role}
                  onChange={(e) => setTempExp({ ...tempExp, role: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">NAMA PERUSAHAAN</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT GoTo Gojek Tokopedia"
                  value={tempExp.company}
                  onChange={(e) => setTempExp({ ...tempExp, company: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">BULAN & TAHUN MULAI</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jan 2022"
                    value={tempExp.startDate}
                    onChange={(e) => setTempExp({ ...tempExp, startDate: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">BULAN & TAHUN SELESAI</label>
                  <input
                    type="text"
                    placeholder="Contoh: Des 2023"
                    disabled={tempExp.isCurrent}
                    value={tempExp.endDate}
                    onChange={(e) => setTempExp({ ...tempExp, endDate: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={tempExp.isCurrent}
                  onChange={(e) => setTempExp({ ...tempExp, isCurrent: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4.5 h-4.5"
                />
                <span>Saya sedang bekerja pada posisi ini sekarang</span>
              </label>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">DENGARAN TUGAS & PENCAPAIAN</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsikan andil Anda, piala pencapaian, dan teknologi penunjang..."
                  value={tempExp.desc}
                  onChange={(e) => setTempExp({ ...tempExp, desc: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddExpModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                >
                  Simpan Riwayat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAMBAH EDU MODAL ================= */}
      {isAddEduModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Tambah Riwayat Pendidikan</h3>
              </div>
              <button onClick={() => setIsAddEduModalOpen(false)} className="text-white hover:opacity-80 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEdu} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">SEKOLAH / UNIVERSITAS</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Universitas Indonesia"
                  value={tempEdu.school}
                  onChange={(e) => setTempEdu({ ...tempEdu, school: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">GELAR & JURUSAN AKADEMIK</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: S1 Ilmu Komputer"
                  value={tempEdu.degree}
                  onChange={(e) => setTempEdu({ ...tempEdu, degree: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">TAHUN KELULUSAN / DURATION</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2016 - 2020"
                  value={tempEdu.date}
                  onChange={(e) => setTempEdu({ ...tempEdu, date: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddEduModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                >
                  Simpan Pendidikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAMBAH CERT MODAL ================= */}
      {isAddCertModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Tambah Sertifikasi Profesional</h3>
              </div>
              <button onClick={() => setIsAddCertModalOpen(false)} className="text-white hover:opacity-80 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCert} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">NAMA SERTIFIKASI</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Professional Scrum Master I"
                  value={tempCert.name}
                  onChange={(e) => setTempCert({ ...tempCert, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">LEMBAGA PENERBIT / ISSUER</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Scrum.org atau Google LLC"
                  value={tempCert.issuer}
                  onChange={(e) => setTempCert({ ...tempCert, issuer: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddCertModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                >
                  Simpan Sertifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SETTINGS: UBAH PASSWORD MODAL ================= */}
      {isPassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 py-4 px-5 text-white flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-500" /> Keamanan Sandi Akun
              </h3>
              <button onClick={() => setIsPassModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="p-5 space-y-4 text-left text-xs font-bold col-span-2">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">PASSWORD SAAT INI (LAMA)</label>
                <input
                  type="password"
                  required
                  placeholder="Ketik password lama Anda..."
                  value={tempPass.oldPass}
                  onChange={(e) => setTempPass({ ...tempPass, oldPass: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">PASSWORD BARU</label>
                <input
                  type="password"
                  required
                  placeholder="Ketik password baru..."
                  value={tempPass.newPass}
                  onChange={(e) => setTempPass({ ...tempPass, newPass: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">KONFIRMASI PASSWORD BARU</label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi mengetik sandi baru..."
                  value={tempPass.confirmPass}
                  onChange={(e) => setTempPass({ ...tempPass, confirmPass: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsPassModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Ganti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SETTINGS: METODE PEMBAYARAN MODAL ================= */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 py-4 px-5 text-white flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-500" /> Metode Pembayaran
              </h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="p-5 space-y-4 text-left text-xs font-medium">
              <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block">Daftar Rekening & E-Wallet Terhubung</span>
              
              <div className="space-y-2">
                <div className="p-3 border rounded-xl flex justify-between bg-slate-50 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💳</span>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">Mastercard **** 4820</p>
                      <p className="text-[10px] text-slate-400">Berlaku sampai: 12/28</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[8px] bg-blue-100 text-blue-800 uppercase font-bold tracking-widest rounded">Utama</span>
                </div>

                <div className="p-3 border rounded-xl flex justify-between bg-slate-50 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥝</span>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">Gopay / OVO Account</p>
                      <p className="text-[10px] text-slate-400">0812****7890</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <button
                  type="button"
                  onClick={() => toast("Integrasi gateway pembayaran baru...", "info")}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-center font-bold"
                >
                  + Tambah Kartu Kredit / E-wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SETTINGS: HAPUS AKUN MODAL ================= */}
      {isDeleteAccModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-650 bg-rose-600 py-4 px-5 text-white flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-white" /> HAPUS AKUN PERMANEN
              </h3>
              <button onClick={() => setIsDeleteAccModalOpen(false)} className="text-white hover:opacity-85 font-bold text-sm">✕</button>
            </div>

            <div className="p-5 space-y-4 text-left text-xs text-slate-650">
              <p className="font-bold text-slate-900 text-sm">Apakah Anda yakin ingin menghapus akun?</p>
              <p>
                Tindakan ini <strong>tidak dapat dibatalkan</strong>. Semua riwayat karir, data resume ATS, serta invoice transaksional karir Anda akan dihapus selamanya dari node database KarirHub.
              </p>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsDeleteAccModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteAccModalOpen(false);
                    toast("Permintaan penghapusan sedang diverifikasi adminsitor.", "info");
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
