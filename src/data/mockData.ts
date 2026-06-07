import { Job, Candidate, CareerService, Transaction, ServiceOrder, ConsultationSession, Applicant } from "../types";

export const INITIAL_JOBS: Job[] = [
  {
    id: "job-1",
    title: "Senior Frontend Developer (React)",
    company: "PT Toko Digital Nusantara",
    companyLogo: "⚡",
    location: "Jakarta Selatan (Hybrid)",
    type: "Full-time",
    salaryMin: 15000000,
    salaryMax: 22000000,
    category: "Software Engineering",
    postedDate: "2026-06-01",
    applicantsCount: 14,
    status: "aktif",
    description: "Kami mencari Senior Frontend Developer yang berpengalaman dalam membangun aplikasi web modern menggunakan React, Tailwind CSS, dan TypeScript. Anda akan berkolaborasi dengan tim produk dan desainer UI/UX untuk menciptakan pengalaman pengguna yang mulus dan performant.",
    requirements: [
      "Pengalaman kerja minimal 4 tahun sebagai Frontend Developer.",
      "Keahlian mendalam dalam React, TypeScript, dan state management (Redux/Zustand).",
      "Pemahaman yang kuat tentang performa web, optimasi aset, dan SEO.",
      "Kemampuan berkomunikasi dengan baik dan bekerja dalam tim Agile.",
      "Terbiasa dengan tooling modern seperti Vite, Webpack, dan Git."
    ],
    benefits: [
      "Gaji kompetitif & bonus performa tahunan.",
      "Asuransi kesehatan swasta penuh.",
      "Anggaran belajar & sertifikasi profesional.",
      "Tunjangan WFH (Internet & peralatan kerja)."
    ]
  },
  {
    id: "job-2",
    title: "UI/UX Designer",
    company: "PT Kreatif Nusantara Solusindo",
    companyLogo: "🎨",
    location: "Bandung / Remote",
    type: "Remote",
    salaryMin: 8000000,
    salaryMax: 13000000,
    category: "Design",
    postedDate: "2026-06-03",
    applicantsCount: 28,
    status: "aktif",
    description: "Kami sedang mencari desainer UI/UX berbakat untuk bergabung dengan tim kreatif kami. Anda akan bertanggung jawab untuk memetakan alur pengguna, membuat kawat-bingkai (wireframes), prototipe interaktif, dan visual dengan estetika tinggi modern.",
    requirements: [
      "Pengalaman minimal 2 tahun dalam desain UI/UX untuk aplikasi web/mobile.",
      "Portofolio desain yang kuat menunjukkan proses UX rasional dan UI yang bersih.",
      "Keahlian mahir menggunakan Figma, Adobe XD, atau sejenisnya.",
      "Paham mengenai prinsip-prinsip Material Design, visual hierarchy, dan tipografi.",
      "Pemahaman dasar tentang HTML/CSS merupakan nilai tambah besar."
    ],
    benefits: [
      "Jam kerja fleksibel (Flexible working hours).",
      "Klub olahraga karyawan dan outing tahunan.",
      "MacBook Pro kerja disediakan.",
      "Tunjangan kesehatan & BPJS Kesehatan."
    ]
  },
  {
    id: "job-3",
    title: "Backend Engineer (Go)",
    company: "PT Solusi Finansial Lestari",
    companyLogo: "🛡️",
    location: "Jakarta Pusat",
    type: "Full-time",
    salaryMin: 12000000,
    salaryMax: 18000000,
    category: "Software Engineering",
    postedDate: "2026-06-05",
    applicantsCount: 9,
    status: "aktif",
    description: "Bergabunglah dengan tim teknologi kami untuk mengembangkan sistem keuangan berskala besar yang andal. Anda akan merancang, mengimplementasikan, dan mengoptimalkan layanan microservice berkinerja tinggi menggunakan bahasa pemrograman Go (Golang).",
    requirements: [
      "Pengalaman backend development minimal 3 tahun menggunakan Golang atau Java.",
      "Memiliki pemahaman mendalam tentang arsitektur microservices dan RESTful API.",
      "Pengalaman bekerja dengan database SQL (PostgreSQL, MySQL) dan NoSQL.",
      "Terbiasa dengan Docker, Kubernetes, dan sistem CI/CD.",
      "Pemahaman yang kuat mengenai optimasi query database dan keamanan siber dasar."
    ],
    benefits: [
      "Lingkungan kerja startup finansial yang dinamis.",
      "Asuransi kesehatan lengkap (termasuk dental).",
      "Makan siang disediakan setiap hari di kantor.",
      "Kesempatan percepatan karir yang cepat."
    ]
  },
  {
    id: "job-4",
    title: "Data Analyst",
    company: "PT Data Analitika Global",
    companyLogo: "📊",
    location: "Slipi, Jakarta Barat",
    type: "Contract",
    salaryMin: 9000000,
    salaryMax: 14000000,
    category: "Data Science",
    postedDate: "2026-06-06",
    applicantsCount: 5,
    status: "aktif",
    description: "Kami membutuhkan Data Analyst untuk merangkum insight data dari database pengguna kami yang besar, lalu menyajikannya menjadi laporan bisnis berkala yang mudah dimengerti serta dapat dieksekusi oleh manajemen produk.",
    requirements: [
      "Pendidikan minimal S1 Statistika, Matematika, Ilmu Komputer, atau sejenis.",
      "Keahlian menulis SQL query yang kompleks untuk ekstraksi data.",
      "Pengalaman menggunakan visualisasi data seperti Tableau, PowerBI, atau Looker.",
      "Kemampuan bahasa Python/R untuk analisis data statistik dasar.",
      "Kemampuan berkomunikasi analitik yang fasih dengan pemangku kepentingan non-teknis."
    ],
    benefits: [
      "Kontrak kerja 1 tahun dengan perpanjangan reguler berbasis performa.",
      "Asuransi kesehatan rawat jalan.",
      "Pelatihan intensif Python & Machine Learning."
    ]
  },
  {
    id: "job-5",
    title: "Product Manager (E-commerce)",
    company: "PT Retail Cerdas Pratama",
    companyLogo: "🛍️",
    location: "Sleman, Yogyakarta (Hybrid)",
    type: "Full-time",
    salaryMin: 14000000,
    salaryMax: 20000000,
    category: "Product Management",
    postedDate: "2026-06-04",
    applicantsCount: 19,
    status: "aktif",
    description: "Kami menantikan seorang Product Manager inovatif untuk memimpin inisiatif produk mobile e-commerce kami yang sedang berkembang pesat di Jawa Tengah. Anda bertanggung jawab meluncurkan fitur dari konsepsi hingga rilis.",
    requirements: [
      "Pengalaman minimal 3 tahun sebagai Product Manager/Owner di industri digital.",
      "Kemampuan merumuskan PRD (Product Requirement Document) dengan jelas.",
      "Terbiasa menganalisis KPI produk menggunakan Mixpanel, Amplitude, atau Google Analytics.",
      "Memiliki jiwa kepemimpinan yang asertif dan mampu memecahkan masalah lintas bidang.",
      "Pengalaman di sektor e-commerce/retail platform akan sangat disukai."
    ],
    benefits: [
      "Saham opsi internal (ESOP) setelah 1 tahun.",
      "Lingkungan kerja kreatif yang santai, bebas politik.",
      "Budget tahunan khusus rekreasi mandiri."
    ]
  }
];

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "cand-1",
    name: "Budi Santoso",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    title: "Seniors Frontend Developer",
    rating: 4.9,
    experienceYears: 5,
    education: "S1 Teknik Informatika - Universitas Indonesia",
    expectedSalary: 18000000,
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Zustand"],
    status: "Tersedia",
    bio: "Developer yang passionate dalam menghadirkan interface pixel-perfect dengan performa tinggi. Menyukai arsitektur kode bersih dan berorientasi pengguna.",
    savedByRecruiter: true,
    email: "budi.santoso@email.com"
  },
  {
    id: "cand-2",
    name: "Siti Aminah",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    title: "UI/UX Designer",
    rating: 4.8,
    experienceYears: 3,
    education: "S1 Desain Komunikasi Visual - ITB",
    expectedSalary: 11000000,
    skills: ["Figma", "User Research", "Wireframing", "Prototyping", "Design System"],
    status: "Tersedia",
    savedByRecruiter: false,
    bio: "Desainer holistik yang fokus menyelaraskan kebutuhan fungsional produk dengan kepuasan emosional pengguna. Terbiasa memimpin usability testing.",
    email: "siti.aminah@email.com"
  },
  {
    id: "cand-3",
    name: "Ahmad Rizki",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    title: "Backend Engineer",
    rating: 4.7,
    experienceYears: 4,
    education: "S1 Ilmu Komputer - Universitas Gadjah Mada",
    expectedSalary: 16000000,
    skills: ["Go", "Node.js", "Docker", "PostgreSQL", "Redis"],
    status: "Tersedia",
    savedByRecruiter: true,
    bio: "Spesialis skalabilitas sistem mikro yang andal. Suka memecahkan masalah perlambatan bottleneck pada data pipeline.",
    email: "ahmad.rizki@email.com"
  },
  {
    id: "cand-4",
    name: "Dewi Lestari",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    title: "Data Analyst",
    rating: 4.6,
    experienceYears: 2,
    education: "S1 Statistika - Universitas Padjadjaran",
    expectedSalary: 9500000,
    skills: ["SQL", "Python", "Tableau", "Excel", "Data Wrangling"],
    status: "Tersedia",
    savedByRecruiter: false,
    bio: "Senang menemukan kisah tersembunyi di balik tumpukan angka mentah. Membantu tim manajemen mengambil keputusan berdasarkan metrik objektif.",
    email: "dewi.lestari@email.com"
  },
  {
    id: "cand-5",
    name: "Rudi Hartono",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    title: "Product Manager",
    rating: 4.9,
    experienceYears: 6,
    education: "S1 Sistem Informasi - Bina Nusantara",
    expectedSalary: 20000000,
    skills: ["Agile/Scrum", "Product Strategy", "Market Analysis", "Jira", "Mixpanel"],
    status: "Tidak Tersedia",
    savedByRecruiter: false,
    bio: "Pemimpin produk pragmatis yang menjembatani kesenjangan antara ambisi bisnis dengan realisasi teknologi koding.",
    email: "rudi.hartono@email.com"
  },
  {
    id: "cand-6",
    name: "Maya Sari",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    title: "Mobile App Developer (Flutter)",
    rating: 4.8,
    experienceYears: 3,
    education: "S1 Sistem Komputer - Universitas Diponegoro",
    expectedSalary: 13000000,
    skills: ["Flutter", "Dart", "Firebase", "App Store Deployment", "Provider State"],
    status: "Tersedia",
    savedByRecruiter: true,
    bio: "Prajurit lintas platform yang andal. Berkomitmen menulis kode modular yang konsisten baik di platform iOS maupun Android.",
    email: "maya.sari@email.com"
  }
];

export const INITIAL_SERVICES: CareerService[] = [
  {
    id: "service-1",
    title: "Review CV ATS-Friendly Profesional & Konsultasi Karir",
    providerName: "Aris Munandar, CHRP (Senior HR PT Tech)",
    providerAvatar: "👨‍🏫",
    category: "cv-review",
    rating: 4.9,
    reviewsCount: 142,
    price: 150000,
    duration: "2 Hari Pengerjaan",
    description: "Dapatkan analisis mendalam untuk CV Anda. Struktur kata kerja aksi, tata letak ATS-Friendly modern, dan masukan rinci yang meningkatkan peluang panggilan wawancara kerja hingga 3 kali lipat.",
    active: true
  },
  {
    id: "service-2",
    title: "Simulasi Wawancara Kerja (Mock Interview) Teknik & Negosiasi",
    providerName: "Hendry Prasetyo (Lead Engineer Bukalapak)",
    providerAvatar: "👨‍💻",
    category: "mock-interview",
    rating: 4.8,
    reviewsCount: 89,
    price: 350000,
    duration: "60 Menit Sesi Langsung",
    description: "Sesi mock interview tatap muka 1-on-1 virtual interaktif. Dirancang khusus sesuai target posisi Anda, lengkap dengan umpan balik instan mengenai bahasa tubuh, jawaban teknis, dan negosiasi gaji.",
    active: true
  },
  {
    id: "service-3",
    title: "Konsultasi Karir Lengkap & Desain Peta Jalan Pekerjaan",
    providerName: "Fina Widjaja, MBA (Career Coach Bersertifikat)",
    providerAvatar: "👩‍💼",
    category: "consulting",
    rating: 5.0,
    reviewsCount: 215,
    price: 500000,
    duration: "90 Menit Konsultasi",
    description: "Masalah salah arah karir, jenuh kerja, atau ingin berpindah jalur industri (career switch)? Sesi mendalam untuk memetakan kekuatan diri, menyusun strategi personal branding, dan menyusun roadmap aksi.",
    active: true
  },
  {
    id: "service-4",
    title: "Portofolio Design Review & Bedah Hasil DKV",
    providerName: "Siti Aminah (Senior UI/UX KarirHub Seller)",
    providerAvatar: "👩",
    category: "cv-review",
    rating: 4.7,
    reviewsCount: 33,
    price: 180000,
    duration: "3 Hari Pengerjaan",
    description: "Koreksi visual komprehensif, feedback arsitektur portofolio studi kasus Figma Anda, serta perbaikan format narasi desain sprint agar mencolok di mata perekrut global.",
    active: true
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "TX-20260601-09",
    itemTitle: "Review CV ATS-Friendly Profesional & Konsultasi Karir",
    category: "service",
    price: 150000,
    date: "2026-06-01 14:32",
    status: "Berhasil",
    paymentMethod: "QRIS",
    vaNumber: ""
  },
  {
    id: "TX-20260605-77",
    itemTitle: "Simulasi Wawancara Kerja (Mock Interview) Teknik",
    category: "service",
    price: 350000,
    date: "2026-06-05 10:15",
    status: "Pending",
    paymentMethod: "BCA Virtual Account",
    vaNumber: "8002 9110 3244 5592"
  },
  {
    id: "TX-20260606-12",
    itemTitle: "Upgrade Paket Recruiter - Professional Dashboard",
    category: "premium",
    price: 500000,
    date: "2026-06-06 18:40",
    status: "Berhasil",
    paymentMethod: "GoPay",
    vaNumber: ""
  }
];

export const INITIAL_ORDERS: ServiceOrder[] = [
  {
    id: "ORD-1122",
    buyerName: "John Doe",
    buyerEmail: "john.doe@email.com",
    serviceTitle: "Review CV ATS-Friendly Profesional & Konsultasi Karir",
    servicePrice: 150000,
    date: "2026-06-01",
    status: "Sedang Diproses",
    requirements: "Dokumen CV saya sekarang: 'John_Doe_Developer.pdf'. Tolong review struktur untuk posisi UI/UX atau Fullstack Jr."
  },
  {
    id: "ORD-1123",
    buyerName: "Dewi Lestari",
    buyerEmail: "dewi.lestari@email.com",
    serviceTitle: "Konsultasi Karir Lengkap & Desain Peta Jalan Pekerjaan",
    servicePrice: 500000,
    date: "2026-06-05",
    status: "Baru",
    requirements: "Saya ingin career switch dari admin logistik ke junior data analyst. Ini profil transisi saya mohon dikaji matang."
  }
];

export const INITIAL_SESSIONS: ConsultationSession[] = [
  {
    id: "SES-201",
    clientName: "Budi Santoso",
    serviceTitle: "Simulasi Wawancara Kerja (Mock Interview) Teknik",
    date: "2026-06-12",
    timeSlot: "14:00 - 15:00 WIB",
    status: "Mendatang",
    meetingUrl: "https://meet.jit.si/KarirHubMockBudi"
  },
  {
    id: "SES-202",
    clientName: "Siti Aminah",
    serviceTitle: "Review CV ATS-Friendly Profesional & Konsultasi Karir",
    date: "2026-06-08",
    timeSlot: "10:30 - 11:30 WIB",
    status: "Mendatang",
    meetingUrl: "https://meet.jit.si/KarirHubConsultSiti"
  }
];

export const INITIAL_APPLICANTS: Applicant[] = [
  {
    id: "APP-001",
    jobId: "job-1",
    jobTitle: "Senior Frontend Developer (React)",
    candidateName: "Budi Santoso",
    candidateTitle: "Seniors Frontend Developer",
    candidateEmail: "budi.santoso@email.com",
    candidateRating: 4.9,
    candidateExperience: 5,
    status: "Baru",
    appliedDate: "2026-06-02",
    resumeSummary: "CV_Budi_Santoso_S1UI.pdf - Menguasai React, Tailwind CSS, TypeScript, dan berpengalaman membangun dasbor e-commerce global."
  },
  {
    id: "APP-002",
    jobId: "job-1",
    jobTitle: "Senior Frontend Developer (React)",
    candidateName: "Ahmad Rizki",
    candidateTitle: "Backend Engineer",
    candidateEmail: "ahmad.rizki@email.com",
    candidateRating: 4.7,
    candidateExperience: 4,
    status: "Shortlisted",
    appliedDate: "2026-06-03",
    resumeSummary: "CV_Ahmad_Rizki_GoReact.pdf - Developer yang menguasai Golang dan React. Berpengalaman 4 tahun membangun core microservice finansial."
  },
  {
    id: "APP-003",
    jobId: "job-2",
    jobTitle: "UI/UX Designer",
    candidateName: "Siti Aminah",
    candidateTitle: "UI/UX Designer",
    candidateEmail: "siti.aminah@email.com",
    candidateRating: 4.8,
    candidateExperience: 3,
    status: "Interview",
    appliedDate: "2026-06-04",
    resumeSummary: "Portfolio_Siti_Aminah.figma - Desainer DKV ITB dengan studi kasus aplikasi logistik nasional yang berfokus pada aksesibilitas tunanetra."
  }
];
