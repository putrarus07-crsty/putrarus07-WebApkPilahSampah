/**
 * 0. KONFIGURASI TAILWIND (dimuat setelah tailwind CDN karena script ini memakai defer)
 */
if (window.tailwind) {
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          display: ['"Fredoka"', 'sans-serif'],
          sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        },
        colors: {
          eco: {
            cream: '#fbfaf5',
            sand: '#f3f0e6',
            emerald: '#10b981',
            emeraldDark: '#047857',
            sky: '#0ea5e9',
            organik: '#16a34a',
            anorganik: '#eab308',
            b3: '#dc2626',
            ewaste: '#7c3aed',
            residu: '#475569'
          }
        }
      }
    }
  };
}

/**
 * 1. EFEK SUARA SINTETIS WEB AUDIO API (TANPA URL EKSTERNAL)
 */
const SoundFX = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  },

  tone(freq, type, duration, vol = 0.08, delay = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  },

  tap() {
    this.tone(580, 'sine', 0.06, 0.06, 0);
  },

  correct() {
    this.tone(523.25, 'triangle', 0.11, 0.1, 0);
    this.tone(659.25, 'triangle', 0.11, 0.1, 0.07);
    this.tone(783.99, 'triangle', 0.18, 0.11, 0.14);
  },

  wrong() {
    this.tone(210, 'sawtooth', 0.16, 0.09, 0);
    this.tone(155, 'sawtooth', 0.22, 0.09, 0.1);
  }
};

function toggleSound() {
  SoundFX.muted = !SoundFX.muted;
  document.getElementById('sound-icon').textContent = SoundFX.muted ? '🔇' : '🔊';
  if (!SoundFX.muted) SoundFX.tap();
  showToast(SoundFX.muted ? 'Suara dimatikan' : 'Suara diaktifkan', 'info');
}

/**
 * 2. DATABASE SAMPAH INDONESIA (UNTUK GAME BAN BERJALAN & KAMUS SAMPAH)
 */
const CATEGORY_META = {
  organik: {
    label: 'Organik (Tong Hijau)',
    short: 'Organik',
    colorClass: 'bg-green-100 text-green-900 border-green-300',
    badgeBg: 'bg-green-600 text-white',
    icon: '🌿'
  },
  anorganik: {
    label: 'Anorganik Daur Ulang (Tong Kuning)',
    short: 'Anorganik',
    colorClass: 'bg-amber-100 text-amber-950 border-amber-300',
    badgeBg: 'bg-amber-400 text-slate-950',
    icon: '♻️'
  },
  b3: {
    label: 'B3 / Berbahaya (Tong Merah)',
    short: 'Sampah B3',
    colorClass: 'bg-red-100 text-red-950 border-red-300',
    badgeBg: 'bg-red-600 text-white',
    icon: '☣️'
  },
  ewaste: {
    label: 'E-Waste / Elektronik (Tong Ungu)',
    short: 'E-Waste',
    colorClass: 'bg-purple-100 text-purple-950 border-purple-300',
    badgeBg: 'bg-purple-600 text-white',
    icon: '🔌'
  },
  residu: {
    label: 'Residu (Tong Abu-abu)',
    short: 'Residu',
    colorClass: 'bg-slate-200 text-slate-900 border-slate-300',
    badgeBg: 'bg-slate-600 text-white',
    icon: '🗑️'
  }
};

const WASTE_DATABASE = [
  {
    id: 'kulit-pisang',
    name: 'Kulit Pisang & Sisa Buah',
    sub: 'Sisa makanan alami',
    emoji: '🍌',
    category: 'organik',
    decomposeTime: '2 – 4 Minggu',
    similar: 'Kulit jeruk, ampas kopi, sisa sayur, daun kering',
    hint: 'Berasal dari makhluk hidup/tumbuhan dan mudah membusuk menjadi pupuk kompos.',
    why: 'Kulit pisang adalah bahan organik alami yang cepat terurai oleh mikroorganisme tanah dan kaya kalium.',
    prep: 'Potong kecil-kecil agar lebih cepat hancur saat dikomposkan.',
    recycleIdea: 'Olah menjadi pupuk kompos padat atau cairan serbaguna Eco-Enzyme.'
  },
  {
    id: 'botol-pet',
    name: 'Botol Plastik Air Mineral',
    sub: 'Plastik bening kode PET #1',
    emoji: '🧴',
    category: 'anorganik',
    decomposeTime: '± 450 Tahun',
    similar: 'Botol teh kemasan, gelas plastik bening, jeriken sabun',
    hint: 'Plastik bening bernilai ekonomi tinggi yang bisa dilebur kembali menjadi biji plastik baru.',
    why: 'Botol plastik PET sangat sulit terurai di alam, tetapi sangat mudah didaur ulang oleh bank sampah.',
    prep: 'Kosongkan sisa air, bilas ringan, lepaskan label jika bisa, lalu remukkan agar hemat ruang.',
    recycleIdea: 'Disetor ke Bank Sampah untuk didaur ulang menjadi serat tekstil atau botol baru.'
  },
  {
    id: 'baterai-bekas',
    name: 'Baterai AA / AAA Bekas',
    sub: 'Mengandung logam berat beracun',
    emoji: '🔋',
    category: 'b3',
    decomposeTime: '100+ Tahun (Mencemari Tanah)',
    similar: 'Baterai kancing jam, aki kecil, kaleng obat nyamuk semprot',
    hint: 'Mengandung merkuri, kadmium, dan timbal yang berbahaya bagi air tanah dan kesehatan.',
    why: 'Baterai bekas termasuk Bahan Berbahaya dan Beracun (B3) karena dapat bocor dan meracuni tanah serta sumber air.',
    prep: 'Tempelkan selotip pada kedua kutub (+ dan -) baterai untuk mencegah korsleting atau percikan api.',
    recycleIdea: 'Kumpulkan di wadah khusus lalu serahkan ke dropbox B3 resmi atau fasilitas pengelolaan limbah daerah.'
  },
  {
    id: 'kabel-charger',
    name: 'Kabel Charger & Earphone Rusak',
    sub: 'Limbah komponen elektronik',
    emoji: '🔌',
    category: 'ewaste',
    decomposeTime: 'Tidak Terurai Alami',
    similar: 'HP mati, mouse rusak, lampu LED mati, powerbank rusak',
    hint: 'Perangkat yang menggunakan arus listrik atau baterai masuk kategori limbah elektronik.',
    why: 'Kabel dan perangkat elektronik mengandung tembaga berharga sekaligus lapisan PVC/timbal yang perlu penanganan khusus.',
    prep: 'Gulung rapi dengan karet/tali dan pisahkan dari sampah basah agar tidak berkarat.',
    recycleIdea: 'Serahkan ke E-Waste Dropbox (banyak tersedia di halte, kampus, atau dinas lingkungan hidup).'
  },
  {
    id: 'popok-bekas',
    name: 'Popok Sekali Pakai & Pembalut',
    sub: 'Mengandung gel penyerap & kotoran',
    emoji: '🧷',
    category: 'residu',
    decomposeTime: '250 – 500 Tahun',
    similar: 'Tisu bekas ingus/minyak, puntung rokok, permen karet',
    hint: 'Tidak bisa dikomposkan dan tidak higienis/sulit didaur ulang secara umum sehingga berakhir di TPA.',
    why: 'Popok sekali pakai mengandung campuran plastik, kapas sintetis, dan gel kimia yang terkontaminasi kotoran.',
    prep: 'Buang kotoran padat ke kloset terlebih dahulu, gulung rapat, dan bungkus sebelum masuk tong abu-abu.',
    recycleIdea: 'Kurangi timbulan residu dengan beralih ke popok kain (clodi) yang bisa dicuci ulang.'
  },
  {
    id: 'kardus-paket',
    name: 'Kardus Paket & Karton Cokelat',
    sub: 'Kertas tebal kering',
    emoji: '📦',
    category: 'anorganik',
    decomposeTime: '2 – 5 Bulan',
    similar: 'Kertas HVS bekas, koran lama, buku tulis bekas, karton susu bersih',
    hint: 'Selama dalam kondisi kering dan bersih dari minyak, bahan serat kayu ini bernilai jual tinggi.',
    why: 'Serat selulosa pada kardus dapat dihancurkan menjadi bubur kertas (pulp) untuk membuat kardus baru.',
    prep: 'Lepaskan lakban plastik, pastikan kering, lalu lipat pipih agar tidak memakan tempat.',
    recycleIdea: 'Dijual ke pengepul/Bank Sampah atau dijadikan kotak penyimpanan serbaguna.'
  },
  {
    id: 'tulang-ikan',
    name: 'Sisa Nasi, Tulang Ayam & Duri Ikan',
    sub: 'Sisa lauk-pauk dapur',
    emoji: '🍗',
    category: 'organik',
    decomposeTime: '1 – 2 Bulan',
    similar: 'Cangkang telur, sisa sayur matang, ampas teh',
    hint: 'Sisa makanan hewani maupun nabati tetap tergolong sampah basah yang bisa diurai maggot BSF.',
    why: 'Sisa lauk dapur adalah sampah organik basah. Jika dibuang tercampur plastik ke TPA, ia menghasilkan gas metana pemicu pemanasan global.',
    prep: 'Tiriskan kuah berlebih sebelum dimasukkan ke wadah komposter atau ember pakan maggot.',
    recycleIdea: 'Sangat disukai larva Black Soldier Fly (Maggot BSF) atau bisa diolah dengan metode kompos Takakura.'
  },
  {
    id: 'kaleng-minuman',
    name: 'Kaleng Aluminium Minuman',
    sub: 'Logam ringan bernilai daur ulang',
    emoji: '🥫',
    category: 'anorganik',
    decomposeTime: '80 – 200 Tahun',
    similar: 'Kaleng sarden, kaleng susu kental manis, tutup botol logam',
    hint: 'Logam aluminium bisa didaur ulang berkali-kali tanpa menurunkan kualitas bahannya.',
    why: 'Mendaur ulang kaleng aluminium menghemat hingga 95% energi dibandingkan menambang bijih bauksit baru.',
    prep: 'Bilas sisa minuman manis agar tidak mengundang semut, lalu gepengkan kaleng.',
    recycleIdea: 'Setor ke Bank Sampah atau jadikan pot tanaman sukulen di meja belajar.'
  },
  {
    id: 'obat-kedaluwarsa',
    name: 'Obat Kedaluwarsa & Botol Sirup Obat',
    sub: 'Limbah kimia farmasi rumah tangga',
    emoji: '💊',
    category: 'b3',
    decomposeTime: 'Berbahaya bagi Ekosistem Air',
    similar: 'Salep kedaluwarsa, termometer raksa, cairan pembersih lantai keras',
    hint: 'Zat kimia aktif di dalamnya dapat mencemari air dan disalahgunakan jika dibuang sembarangan.',
    why: 'Limbah farmasi termasuk B3 rumah tangga karena senyawa kimianya merusak mikroorganisme air.',
    prep: 'Pisahkan dari kemasan luar, hancurkan label nama pribadi, dan simpan dalam wadah tertutup rapat.',
    recycleIdea: 'Serahkan ke apotek/puskesmas yang menerima pengembalian obat kedaluwarsa atau fasilitas limbah B3.'
  },
  {
    id: 'lampu-led',
    name: 'Lampu LED & Lampu Neon Mati',
    sub: 'Komponen sirkuit & kaca lampu',
    emoji: '💡',
    category: 'ewaste',
    decomposeTime: 'Tidak Terurai Alami',
    similar: 'Senter rusak, setrika rusak, kipas angin mini mati',
    hint: 'Memiliki rangkaian papan sirkuit elektronik (PCB) di bagian pangkalnya.',
    why: 'Lampu hemat energi dan LED mengandung komponen elektronik (dan uap merkuri pada tipe neon/CFL) sehingga masuk kategori E-Waste.',
    prep: 'Bungkus dengan kertas koran bekas agar kacanya tidak pecah melukai petugas kebersihan.',
    recycleIdea: 'Kumpulkan di titik pengumpulan E-Waste resmi di kota Anda.'
  },
  {
    id: 'tisu-berminyak',
    name: 'Tisu Bekas & Kertas Nasi Berminyak',
    sub: 'Serat kertas kotor terkena minyak/kuah',
    emoji: '🧻',
    category: 'residu',
    decomposeTime: '1 – 3 Bulan (Tidak Bisa Didaur Ulang)',
    similar: 'Kotak pizza penuh minyak, masker medis sekali pakai, bungkus permen',
    hint: 'Meski berbahan kertas, noda minyak dan kotoran merusak proses daur ulang kertas.',
    why: 'Minyak dan lemak tidak dapat dipisahkan dari serat kertas saat proses bubur kertas, sehingga masuk tong Residu.',
    prep: 'Pastikan tidak tercampur dengan kertas HVS atau kardus bersih yang masih bisa didaur ulang.',
    recycleIdea: 'Gunakan sapu tangan kain atau lap dapur cuci ulang untuk mengurangi pemakaian tisu.'
  },
  {
    id: 'botol-kaca',
    name: 'Botol Kaca Kecap / Sirup',
    sub: 'Kaca bening atau berwarna',
    emoji: '🍾',
    category: 'anorganik',
    decomposeTime: '1 Juta Tahun Lebih',
    similar: 'Toples selai kaca, botol parfum kaca utuh',
    hint: 'Material kaca 100% dapat dilebur ulang secara terus-menerus tanpa kehilangan kemurnian.',
    why: 'Kaca hampir tidak pernah terurai di tanah, namun sangat bernilai jika disetorkan dalam kondisi utuh.',
    prep: 'Cuci bersih sisa saus/sirup di dalamnya dan jangan dipecahkan agar aman bagi pemilah.',
    recycleIdea: 'Gunakan ulang sebagai wadah bumbu dapur atau setor ke Bank Sampah.'
  },
  {
    id: 'daun-kering',
    name: 'Daun Kering & Ranting Halaman',
    sub: 'Sampah kebun unsur karbon (cokelat)',
    emoji: '🍂',
    category: 'organik',
    decomposeTime: '1 – 3 Bulan',
    similar: 'Potongan rumput, bunga layu, serbuk gergaji kayu alami',
    hint: 'Sangat penting sebagai penyeimbang bau saat membuat kompos sampah dapur.',
    why: 'Daun kering kaya unsur karbon yang menyerap kelembapan berlebih dan mencegah bau busuk pada tumpukan kompos.',
    prep: 'Remas atau cacah daun kering sebelum dicampur dengan sisa dapur basah.',
    recycleIdea: 'Jadikan mulsa penutup tanah tanaman hias atau bahan utama kompos daun.'
  },
  {
    id: 'aerosol-semprot',
    name: 'Kaleng Semprot Nyamuk / Cat Semprot',
    sub: 'Tabung bertekanan gas kimia',
    emoji: '🧯',
    category: 'b3',
    decomposeTime: '100+ Tahun (Risiko Ledakan)',
    similar: 'Tabung gas korek api, pemutih pakaian pekat, racun tikus',
    hint: 'Tabung bertekanan tinggi dan mengandung residu bahan kimia mudah terbakar.',
    why: 'Kaleng aerosol berbahaya jika terbakar atau tergencet truk sampah karena berisiko meledak.',
    prep: 'Pastikan isi sudah benar-benar habis dan jangan pernah menusuk atau membakar kaleng.',
    recycleIdea: 'Pisahkan dalam wadah B3 rumah tangga untuk diserahkan ke pengelola limbah berizin.'
  },
  {
    id: 'hp-rusak',
    name: 'Ponsel Lama & Powerbank Menggembung',
    sub: 'Limbah elektronik berbaterai lithium',
    emoji: '📱',
    category: 'ewaste',
    decomposeTime: 'Tidak Terurai Alami',
    similar: 'Laptop tua, tablet rusak, jam tangan pintar rusak',
    hint: 'Menyimpan emas/tembaga di papan sirkuit sekaligus baterai lithium yang rawan terbakar jika tertusuk.',
    why: 'Satu ton limbah ponsel mengandung lebih banyak emas dibanding satu ton bijih emas tambang, namun beracun jika dibakar.',
    prep: 'Hapus data pribadi dari perangkat dan simpan di tempat sejuk sebelum disetor.',
    recycleIdea: 'Setor ke program tukar tambah resmi atau E-Waste Dropbox terdekat.'
  },
  {
    id: 'styrofoam-kotor',
    name: 'Styrofoam Bekas Bungkus Makanan',
    sub: 'Polistirena sulit didaur ulang',
    emoji: '🥡',
    category: 'residu',
    decomposeTime: '500+ Tahun',
    similar: 'Spons cuci piring bekas, sikat gigi bekas, sedotan plastik kotor',
    hint: 'Sebagian besar fasilitas daur ulang menolak styrofoam bekas makanan karena terkontaminasi minyak.',
    why: 'Styrofoam sangat ringan namun memakan volume besar di TPA dan sulit diproses ulang secara ekonomis.',
    prep: 'Bersihkan sisa nasi, tekan agar ringkas, dan masukkan ke tong Residu.',
    recycleIdea: 'Bawa kotak makan sendiri (tumbler/lunchbox) saat membeli makanan agar bebas styrofoam.'
  }
];

/**
 * 3. BANK SOAL KUIS CERDAS & MITOS VS FAKTA SAMPAH
 */
const QUIZ_QUESTIONS = [
  {
    tag: 'MITOS VS FAKTA',
    question: 'MITOS atau FAKTA: "Membakar sampah plastik dan daun di halaman rumah adalah cara paling bersih dan cepat menghilangkan sampah."',
    options: [
      'MITOS — Membakar sampah melepaskan gas beracun (dioksin) dan partikel halus berbahaya bagi paru-paru',
      'FAKTA — Abu hasil pembakaran plastik sangat menyuburkan tanaman',
      'FAKTA — Asap plastik langsung hilang di udara tanpa dampak kesehatan'
    ],
    correctIndex: 0,
    explanation: 'Itu adalah MITOS berbahaya! Pembakaran sampah terbuka menghasilkan dioksin, furan, dan karbon monoksida yang memicu ISPA serta mencemari tanah sekitar.'
  },
  {
    tag: 'WAKTU URAI ALAM',
    question: 'Berapa lama waktu yang dibutuhkan sebuah botol plastik air mineral (PET) untuk terurai secara alami di tanah?',
    options: [
      'Sekitar 2 sampai 4 minggu',
      'Sekitar 1 sampai 2 tahun',
      'Sekitar 450 tahun hingga lebih'
    ],
    correctIndex: 2,
    explanation: 'Botol plastik membutuhkan sekitar 450 tahun untuk terurai, dan itu pun hanya pecah menjadi serpihan mikroplastik yang tetap mencemari lingkungan.'
  },
  {
    tag: 'PEMILAHAN B3',
    question: 'Baterai remote TV yang sudah habis dayanya sebaiknya dibuang ke tong sampah berwarna apa?',
    options: [
      'Tong Hijau (Organik) agar menyatu dengan tanah',
      'Tong Merah (Sampah B3 / Berbahaya) karena mengandung logam berat beracun',
      'Tong Kuning bersama botol air mineral'
    ],
    correctIndex: 1,
    explanation: 'Baterai bekas mengandung logam berat seperti merkuri, kadmium, dan timbal sehingga wajib dipisahkan ke tong Merah (B3).'
  },
  {
    tag: 'PENGOLAHAN ORGANIK',
    question: 'Apa gas rumah kaca berbahaya yang muncul jika sampah sisa makanan (organik) menumpuk tertutup plastik di TPA tanpa oksigen?',
    options: [
      'Gas Oksigen murni',
      'Gas Metana (CH₄) yang daya tangkap panasnya jauh lebih kuat dari CO₂',
      'Gas Helium'
    ],
    correctIndex: 1,
    explanation: 'Pembusukan sampah organik tanpa oksigen (anaerob) di TPA menghasilkan gas metana (CH₄) yang memicu pemanasan global dan risiko ledakan timbunan sampah.'
  },
  {
    tag: 'PERSIAPAN DAUR ULANG',
    question: 'Sebelum memasukkan botol minum plastik atau kaleng bekas ke tong Kuning (Anorganik), langkah persiapan apa yang paling dianjurkan?',
    options: [
      'Mengisinya penuh dengan air sabun',
      'Mengosongkan isinya, membilas ringan, dan meremukkannya agar hemat ruang',
      'Membakar bagian tutup botolnya terlebih dahulu'
    ],
    correctIndex: 1,
    explanation: 'Membilas ringan mencegah bau dan jamur, sedangkan meremukkan botol/kaleng menghemat ruang penyimpanan hingga 70%!'
  },
  {
    tag: 'MITOS VS FAKTA',
    question: 'MITOS atau FAKTA: "Tisu bekas dan kotak pizza yang penuh noda minyak boleh dimasukkan ke tong daur ulang kertas."',
    options: [
      'FAKTA — Semua jenis kertas otomatis bisa didaur ulang',
      'MITOS — Minyak dan kotoran merusak serat bubur kertas sehingga harus masuk tong Residu (Abu-abu)',
      'FAKTA — Asalkan dilipat rapi menjadi kotak kecil'
    ],
    correctIndex: 1,
    explanation: 'MITOS! Dalam proses daur ulang kertas, minyak tidak dapat tercampur dengan air sehingga merusak satu batch bubur kertas.'
  },
  {
    tag: 'KATEGORI E-WASTE',
    question: 'Manakah di antara benda berikut yang termasuk dalam kategori E-Waste (Limbah Elektronik - Tong Ungu)?',
    options: [
      'Kabel charger putus, lampu LED mati, dan ponsel rusak',
      'Kulit jeruk, ampas teh, dan ranting pohon',
      'Popok bayi bekas dan tisu basah'
    ],
    correctIndex: 0,
    explanation: 'Semua perangkat yang bekerja menggunakan arus listrik atau baterai—termasuk kabel, lampu LED, dan ponsel rusak—adalah E-Waste.'
  },
  {
    tag: 'PRINSIP 3R',
    question: 'Dalam hierarki pengelolaan sampah (Reduce, Reuse, Recycle), langkah manakah yang paling utama dan berdampak paling besar?',
    options: [
      'Recycle (Mendaur ulang setelah barang menjadi sampah)',
      'Reduce (Mengurangi timbulan sampah sejak awal, misal membawa tumbler & tas belanja)',
      'Membeli tempat sampah yang lebih besar'
    ],
    correctIndex: 1,
    explanation: 'Reduce (Mengurangi) adalah langkah paling efektif karena mencegah sampah tercipta sejak dari sumbernya.'
  },
  {
    tag: 'INOVASI KOMPOS',
    question: 'Apa nama cairan serbaguna hasil fermentasi kulit buah, gula merah/molase, dan air selama 3 bulan yang bermanfaat membersihkan rumah & menyuburkan tanaman?',
    options: [
      'Eco-Enzyme',
      'Bensin Bio-Solar',
      'Cairan Pemutih Klorin'
    ],
    correctIndex: 0,
    explanation: 'Eco-Enzyme adalah solusi cerdas mengolah kulit buah segar rumah tangga menjadi cairan pembersih alami dan pupuk cair.'
  },
  {
    tag: 'DAMPAK MIKROPLASTIK',
    question: 'Mengapa sampah plastik yang dibuang ke sungai atau selokan bisa kembali ke tubuh manusia?',
    options: [
      'Karena plastik berubah menjadi vitamin di laut',
      'Karena plastik terpecah menjadi mikroplastik yang termakan ikan dan masuk ke rantai makanan manusia',
      'Karena plastik menguap menjadi awan hujan'
    ],
    correctIndex: 1,
    explanation: 'Paparan sinar matahari dan ombak memecah plastik menjadi mikroplastik (< 5 mm) yang tertelan plankton dan ikan konsumsi.'
  }
];

/**
 * 4. DATA ONBOARDING 3 LANGKAH (RAMAH PENGGUNA PERTAMA KALI)
 */
const ONBOARDING_STEPS = [
  {
    badge: 'LANGKAH 1 • KENALI MISIMU',
    title: 'Selamat Datang MISI RESIK ♻️',
    desc: 'Aplikasi ini membantumu belajar memilah sampah dengan cara bermain yang santai, jelas, dan mudah dipahami siapa saja—bahkan jika baru pertama kali mencoba!',
    highlight: `
      <div class="grid grid-cols-3 gap-2.5 text-center pt-1">
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
          <div class="text-2xl mb-1">🏭</div>
          <div class="text-xs font-extrabold text-emerald-950">Game Ban Berjalan</div>
          <div class="text-[11px] text-slate-600">Pilah sampah sambil bermain</div>
        </div>
        <div class="bg-sky-50 border border-sky-200 rounded-2xl p-3">
          <div class="text-2xl mb-1">📚</div>
          <div class="text-xs font-extrabold text-sky-950">Kamus Sampah</div>
          <div class="text-[11px] text-slate-600">Cari info & waktu urai</div>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-3">
          <div class="text-2xl mb-1">🌍</div>
          <div class="text-xs font-extrabold text-amber-950">Eco-Hero</div>
          <div class="text-[11px] text-slate-600">Lihat dampak nyatamu</div>
        </div>
      </div>
    `
  },
  {
    badge: 'LANGKAH 2 • 5 WARNA TONG SAMPAH',
    title: 'Kenali 5 Kategori Tong Sampah Utama',
    desc: 'Setiap tong punya warna, ikon, dan fungsi khusus agar sampah tidak tercampur:',
    highlight: `
      <div class="space-y-2 text-xs">
        <div class="flex items-center gap-2.5 p-2 rounded-xl bg-green-50 border border-green-200">
          <span class="text-lg">🌿</span>
          <div><strong class="text-green-800">Organik (Hijau):</strong> Sisa makanan, kulit buah, daun (bisa jadi kompos).</div>
        </div>
        <div class="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200">
          <span class="text-lg">♻️</span>
          <div><strong class="text-amber-900">Anorganik (Kuning):</strong> Botol plastik, kardus, kaleng, kaca bersih.</div>
        </div>
        <div class="flex items-center gap-2.5 p-2 rounded-xl bg-red-50 border border-red-200">
          <span class="text-lg">☣️</span>
          <div><strong class="text-red-800">Sampah B3 (Merah):</strong> Baterai bekas, obat kedaluwarsa, aerosol.</div>
        </div>
        <div class="flex items-center gap-2.5 p-2 rounded-xl bg-purple-50 border border-purple-200">
          <span class="text-lg">🔌</span>
          <div><strong class="text-purple-800">E-Waste (Ungu):</strong> Kabel rusak, lampu LED mati, ponsel bekas.</div>
        </div>
        <div class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-100 border border-slate-300">
          <span class="text-lg">🗑️</span>
          <div><strong class="text-slate-800">Residu (Abu-abu):</strong> Popok bekas, tisu kotor/berminyak, puntung rokok.</div>
        </div>
      </div>
    `
  },
  {
    badge: 'LANGKAH 3 • KONTROL MUDAH DI HP & LAPTOP',
    title: '2 Cara Praktis Membuang Sampah',
    desc: 'Kamu bebas memilih cara yang paling nyaman di layar perangkatmu:',
    highlight: `
      <div class="space-y-2.5 text-xs sm:text-sm">
        <div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <span class="text-2xl">👆</span>
          <div>
            <strong class="text-emerald-900 block">Cara 1: Tap Item → Tap Tong Tujuan</strong>
            <span class="text-xs text-slate-600">Sampah yang muncul otomatis terpilih, tinggal tap tombol tong sampah di bawah!</span>
          </div>
        </div>
        <div class="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center gap-3">
          <span class="text-2xl">🖐️</span>
          <div>
            <strong class="text-sky-900 block">Cara 2: Seret (Drag & Drop)</strong>
            <span class="text-xs text-slate-600">Tarik kartu sampah langsung ke atas tong sampah tujuan.</span>
          </div>
        </div>
      </div>
    `
  }
];

/**
 * 5. LENCANA PENCAPAIAN (ECO-BADGES)
 */
const ECO_BADGES = [
  {
    id: 'first_sort',
    icon: '🌱',
    title: 'Langkah Pertama Hijau',
    desc: 'Berhasil memilah 1 sampah dengan tepat.',
    check: (s) => s.correctCount >= 1
  },
  {
    id: 'combo_5',
    icon: '🔥',
    title: 'Tangan Cekatan 5x',
    desc: 'Mencapai 5 kombo pemilahan benar berturut-turut.',
    check: (s) => s.bestCombo >= 5
  },
  {
    id: 'b3_guardian',
    icon: '🛡️',
    title: 'Penjaga Limbah B3 & E-Waste',
    desc: 'Berhasil mengamankan 3 sampah B3 atau E-Waste.',
    check: (s) => s.hazardousSaved >= 3
  },
  {
    id: 'quiz_master',
    icon: '🧠',
    title: 'Detektif Mitos & Fakta',
    desc: 'Menjawab benar minimal 5 soal di Kuis Cerdas.',
    check: (s) => s.quizCorrect >= 5
  },
  {
    id: 'sorter_20',
    icon: '♻️',
    title: 'Pejuang Daur Ulang',
    desc: 'Memilah total 20 item sampah dengan tepat.',
    check: (s) => s.correctCount >= 20
  },
  {
    id: 'eco_champion',
    icon: '👑',
    title: 'Duta Lingkungan Nusantara',
    desc: 'Mengumpulkan minimal 500 Eco-Score.',
    check: (s) => s.score >= 500
  }
];

/**
 * 6. STATE APLIKASI & PENYIMPANAN LOCALSTORAGE
 */
const STORAGE_KEY = 'pilah_yuk_ecoquest_v1';

function defaultUserProgress() {
  return {
    seenOnboarding: false,
    score: 0,
    correctCount: 0,
    totalAttempts: 0,
    bestCombo: 0,
    hazardousSaved: 0,
    quizCorrect: 0
  };
}

let userProgress = defaultUserProgress();
let activeTab = 'conveyor';
let onboardingStep = 0;
let kamusFilter = 'semua';

// State Mode Game 1: Ban Berjalan
let conveyorState = {
  running: false,
  pausedForFeedback: false,
  difficulty: 'santai', // santai (15s), normal (10s), cepat (6.5s)
  lives: 3,
  combo: 0,
  sessionScore: 0,
  currentItem: null,
  itemSelected: true,
  timeLeftMs: 14000,
  maxTimeMs: 14000,
  loopTimer: null,
  lastQueueIds: []
};

// State Mode Game 2: Kuis
let quizState = {
  order: [],
  currentIndex: 0,
  answered: false,
  selectedOption: null,
  sessionCorrect: 0
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      userProgress = { ...defaultUserProgress(), ...JSON.parse(raw) };
    }
  } catch (e) {}
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
  } catch (e) {}
}

/**
 * 7. NOTIFIKASI TOAST & NAVIGASI TAB
 */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  let colors = 'bg-slate-900 text-white border-slate-700';
  if (type === 'success') colors = 'bg-emerald-700 text-white border-emerald-500';
  if (type === 'error') colors = 'bg-rose-700 text-white border-rose-500';

  el.className = `pointer-events-auto border ${colors} px-4 py-2.5 rounded-2xl shadow-lg text-xs font-extrabold transition-all duration-300 opacity-0 -translate-y-2`;
  el.textContent = msg;
  container.appendChild(el);

  requestAnimationFrame(() => el.classList.remove('opacity-0', '-translate-y-2'));
  setTimeout(() => {
    el.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => el.remove(), 280);
  }, 2400);
}

function switchTab(tabName) {
  SoundFX.tap();
  activeTab = tabName;

  ['conveyor', 'quiz', 'kamus', 'dashboard'].forEach(t => {
    const section = document.getElementById(`view-${t}`);
    const topBtn = document.getElementById(`nav-top-${t}`);
    const botBtn = document.getElementById(`nav-bot-${t}`);

    const isActive = t === tabName;
    section.classList.toggle('hidden', !isActive);

    if (topBtn) {
      topBtn.className = isActive
        ? 'nav-tab-btn px-4 py-2 rounded-xl text-sm font-extrabold flex items-center gap-2 bg-emerald-600 text-white shadow-sm transition'
        : 'nav-tab-btn px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-slate-600 hover:bg-emerald-100/70 transition';
    }
    if (botBtn) {
      botBtn.className = isActive
        ? 'nav-bot-btn flex flex-col items-center justify-center py-1.5 rounded-2xl text-[11px] font-extrabold bg-emerald-100 text-emerald-900 transition'
        : 'nav-bot-btn flex flex-col items-center justify-center py-1.5 rounded-2xl text-[11px] font-bold text-slate-500 hover:bg-slate-100 transition';
    }
  });

  if (tabName === 'kamus') renderKamusList();
  if (tabName === 'dashboard') updateGlobalStatsUI();
}

/**
 * 8. ONBOARDING 3 LANGKAH (FIRST-TIME TOUR)
 */
function openOnboarding(step = 0) {
  SoundFX.tap();
  onboardingStep = step;
  renderOnboardingStep();
  const modal = document.getElementById('onboarding-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeOnboarding() {
  SoundFX.tap();
  userProgress.seenOnboarding = true;
  saveProgress();
  const modal = document.getElementById('onboarding-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function renderOnboardingStep() {
  const data = ONBOARDING_STEPS[onboardingStep];
  const container = document.getElementById('onboarding-step-content');
  container.innerHTML = `
    <span class="inline-block text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
      ${data.badge}
    </span>
    <h3 class="font-eco text-xl sm:text-2xl font-bold text-slate-900">${data.title}</h3>
    <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">${data.desc}</p>
    ${data.highlight}
  `;

  [0, 1, 2].forEach(idx => {
    const dot = document.getElementById(`onb-dot-${idx}`);
    dot.className = idx <= onboardingStep
      ? 'h-2 flex-1 rounded-full bg-emerald-500 transition'
      : 'h-2 flex-1 rounded-full bg-slate-200 transition';
  });

  document.getElementById('onb-step-counter').textContent = `Langkah ${onboardingStep + 1} dari 3`;
  document.getElementById('btn-onb-prev').style.visibility = onboardingStep === 0 ? 'hidden' : 'visible';
  document.getElementById('btn-onb-next').textContent = onboardingStep === 2 ? '🚀 Mulai Bermain!' : 'Lanjut ➡️';
}

function prevOnboardingStep() {
  if (onboardingStep > 0) {
    SoundFX.tap();
    onboardingStep--;
    renderOnboardingStep();
  }
}

function nextOnboardingStep() {
  if (onboardingStep < 2) {
    SoundFX.tap();
    onboardingStep++;
    renderOnboardingStep();
  } else {
    closeOnboarding();
  }
}

/**
 * 9. LOGIKA MODE GAME 1: TANTANGAN BAN BERJALAN (CONVEYOR SORT)
 */
function setDifficulty(diff) {
  SoundFX.tap();
  conveyorState.difficulty = diff;
  const durations = { santai: 15000, normal: 10000, cepat: 6500 };
  conveyorState.maxTimeMs = durations[diff] || 15000;

  ['santai', 'normal', 'cepat'].forEach(d => {
    const btn = document.getElementById(`diff-${d}`);
    btn.className = d === diff
      ? 'diff-btn px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 text-white shadow-sm transition'
      : 'diff-btn px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-600 hover:text-slate-900 transition';
  });

  showToast(`Mode kecepatan: ${diff.toUpperCase()}`, 'info');
}

function startConveyorGame() {
  SoundFX.tap();
  conveyorState.running = true;
  conveyorState.pausedForFeedback = false;
  conveyorState.lives = 3;
  conveyorState.combo = 0;
  conveyorState.sessionScore = 0;

  document.getElementById('conveyor-overlay').classList.add('hidden');
  document.getElementById('active-waste-wrapper').classList.remove('hidden');
  document.getElementById('feedback-card').classList.add('hidden');
  document.getElementById('conveyor-hint-banner').classList.add('hidden');

  updateConveyorHUD();
  spawnNextWasteItem();

  if (conveyorState.loopTimer) clearInterval(conveyorState.loopTimer);
  conveyorState.loopTimer = setInterval(tickConveyorLoop, 50);
}

function spawnNextWasteItem() {
  // Pilih item acak yang tidak langsung sama dengan 3 item terakhir
  const candidates = WASTE_DATABASE.filter(item => !conveyorState.lastQueueIds.includes(item.id));
  const pool = candidates.length > 0 ? candidates : WASTE_DATABASE;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  conveyorState.lastQueueIds.push(chosen.id);
  if (conveyorState.lastQueueIds.length > 4) conveyorState.lastQueueIds.shift();

  conveyorState.currentItem = chosen;
  conveyorState.itemSelected = true; // Langsung terpilih agar 1x tap tong langsung jalan!
  conveyorState.pausedForFeedback = false;
  conveyorState.timeLeftMs = conveyorState.maxTimeMs;

  document.getElementById('waste-item-visual').textContent = chosen.emoji;
  document.getElementById('waste-item-name').textContent = chosen.name;
  document.getElementById('waste-item-sub').textContent = chosen.sub;
  document.getElementById('conveyor-hint-banner').classList.add('hidden');
  document.getElementById('conveyor-status-label').textContent = 'Pilah sampah ke tong yang sesuai!';

  const belt = document.getElementById('belt-track');
  belt.classList.remove('conveyor-paused');

  updateWasteCardSelectionUI();
  updateWasteCardPosition();
}

function tickConveyorLoop() {
  if (!conveyorState.running || conveyorState.pausedForFeedback) return;

  conveyorState.timeLeftMs -= 50;
  if (conveyorState.timeLeftMs <= 0) {
    conveyorState.timeLeftMs = 0;
    handleConveyorTimeout();
    return;
  }

  updateWasteCardPosition();
}

function updateWasteCardPosition() {
  const ratio = Math.max(0, Math.min(1, conveyorState.timeLeftMs / conveyorState.maxTimeMs));
  const bar = document.getElementById('conveyor-progress-bar');
  bar.style.width = `${ratio * 100}%`;

  if (ratio > 0.5) bar.className = 'h-full bg-emerald-500 transition-all duration-75 rounded-full';
  else if (ratio > 0.25) bar.className = 'h-full bg-amber-400 transition-all duration-75 rounded-full';
  else bar.className = 'h-full bg-rose-500 transition-all duration-75 rounded-full';

  document.getElementById('conveyor-timer-label').textContent = `Sisa waktu: ${(conveyorState.timeLeftMs / 1000).toFixed(1)} dtk`;

  // Gerakkan kartu dari kanan (70%) ke kiri (4%) secara halus & selalu terlihat utuh
  const card = document.getElementById('active-waste-card');
  const leftPercent = 4 + ratio * 62;
  card.style.left = `${leftPercent}%`;
}

function toggleSelectWasteItem() {
  if (!conveyorState.running || conveyorState.pausedForFeedback) return;
  SoundFX.tap();
  conveyorState.itemSelected = !conveyorState.itemSelected;
  updateWasteCardSelectionUI();
}

function updateWasteCardSelectionUI() {
  const card = document.getElementById('active-waste-card');
  const badge = document.getElementById('waste-selected-badge');
  if (conveyorState.itemSelected) {
    card.classList.add('border-emerald-400', 'ring-4', 'ring-emerald-200');
    card.classList.remove('border-slate-300');
    badge.classList.remove('hidden');
  } else {
    card.classList.remove('border-emerald-400', 'ring-4', 'ring-emerald-200');
    card.classList.add('border-slate-300');
    badge.classList.add('hidden');
  }
}

// Dukungan Drag & Drop pada Desktop / Browser Modern
document.addEventListener('DOMContentLoaded', () => {
  const wasteCard = document.getElementById('active-waste-card');
  if (wasteCard) {
    wasteCard.addEventListener('dragstart', (e) => {
      conveyorState.itemSelected = true;
      updateWasteCardSelectionUI();
      if (e.dataTransfer && conveyorState.currentItem) {
        e.dataTransfer.setData('text/plain', conveyorState.currentItem.id);
      }
    });
  }
});

function allowBinDrop(e, btnEl) {
  e.preventDefault();
  btnEl.classList.add('bin-drop-active');
}

function leaveBinDrop(btnEl) {
  btnEl.classList.remove('bin-drop-active');
}

function dropOnBin(e, binCategory, btnEl) {
  e.preventDefault();
  btnEl.classList.remove('bin-drop-active');
  handleBinChoice(binCategory);
}

function showConveyorHint() {
  if (!conveyorState.running || !conveyorState.currentItem) {
    showToast('Tekan "Mulai Bermain Sekarang" terlebih dahulu!', 'info');
    return;
  }
  SoundFX.tap();
  document.getElementById('conveyor-hint-text').textContent = conveyorState.currentItem.hint;
  document.getElementById('conveyor-hint-banner').classList.remove('hidden');
}

function handleConveyorTimeout() {
  if (!conveyorState.currentItem) return;
  SoundFX.wrong();
  conveyorState.pausedForFeedback = true;
  document.getElementById('belt-track').classList.add('conveyor-paused');

  conveyorState.lives--;
  conveyorState.combo = 0;
  userProgress.totalAttempts++;
  saveProgress();
  updateConveyorHUD();
  updateGlobalStatsUI();

  renderFeedbackCard(false, conveyorState.currentItem, 'Waktu habis! Sampah keburu lewat ujung ban berjalan.');
  checkGameOverOrContinue();
}

function handleBinChoice(selectedCategory) {
  if (!conveyorState.running || !conveyorState.currentItem) {
    showToast('Klik tombol "Mulai Bermain Sekarang" di atas ya!', 'info');
    return;
  }
  if (conveyorState.pausedForFeedback) {
    nextConveyorItemManual();
    return;
  }

  const item = conveyorState.currentItem;
  const isCorrect = item.category === selectedCategory;

  conveyorState.pausedForFeedback = true;
  document.getElementById('belt-track').classList.add('conveyor-paused');
  userProgress.totalAttempts++;

  if (isCorrect) {
    SoundFX.correct();
    conveyorState.combo++;
    const bonus = Math.min(25, conveyorState.combo * 5);
    const earned = 15 + bonus;

    conveyorState.sessionScore += earned;
    userProgress.score += earned;
    userProgress.correctCount++;
    if (conveyorState.combo > userProgress.bestCombo) {
      userProgress.bestCombo = conveyorState.combo;
    }
    if (item.category === 'b3' || item.category === 'ewaste') {
      userProgress.hazardousSaved++;
    }

    renderFeedbackCard(true, item, `Hebat! +${earned} Eco-Score (Kombo ${conveyorState.combo}x)`);
    showToast(`Tepat! +${earned} Eco-Score 🌱`, 'success');
  } else {
    SoundFX.wrong();
    conveyorState.lives--;
    conveyorState.combo = 0;

    const stage = document.getElementById('conveyor-stage');
    stage.classList.add('animate-shake');
    setTimeout(() => stage.classList.remove('animate-shake'), 380);

    const wrongLabel = CATEGORY_META[selectedCategory].short;
    renderFeedbackCard(false, item, `Kurang tepat! Tadi kamu memilih tong ${wrongLabel}.`);
    showToast('Ups! Coba cek penjelasan di bawah ya 💡', 'error');
  }

  saveProgress();
  updateConveyorHUD();
  updateGlobalStatsUI();
  checkGameOverOrContinue();
}

function renderFeedbackCard(isCorrect, item, headline) {
  const card = document.getElementById('feedback-card');
  const catMeta = CATEGORY_META[item.category];

  card.className = isCorrect
    ? 'bg-white rounded-3xl border-2 border-emerald-400 p-4 sm:p-5 shadow-md animate-pop'
    : 'bg-white rounded-3xl border-2 border-rose-300 p-4 sm:p-5 shadow-md animate-pop';

  const iconEl = document.getElementById('fb-icon');
  iconEl.className = isCorrect
    ? 'w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shrink-0'
    : 'w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl shrink-0';
  iconEl.textContent = isCorrect ? '✅' : '💡';

  const statusBadge = document.getElementById('fb-status-badge');
  statusBadge.className = isCorrect
    ? 'text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800'
    : 'text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800';
  statusBadge.textContent = headline;

  document.getElementById('fb-item-title').textContent = `${item.emoji} ${item.name} → ${catMeta.label}`;
  document.getElementById('fb-why').textContent = item.why;
  document.getElementById('fb-decompose').textContent = `⏳ Waktu urai: ${item.decomposeTime}`;
  document.getElementById('fb-action').textContent = `♻️ Solusi: ${item.recycleIdea}`;

  card.classList.remove('hidden');
}

function checkGameOverOrContinue() {
  if (conveyorState.lives <= 0) {
    conveyorState.running = false;
    if (conveyorState.loopTimer) clearInterval(conveyorState.loopTimer);

    document.getElementById('active-waste-wrapper').classList.add('hidden');
    document.getElementById('overlay-emoji').textContent = '🌟';
    document.getElementById('overlay-title').textContent = `Sesi Selesai! Skor Kamu: ${conveyorState.sessionScore}`;
    document.getElementById('overlay-desc').textContent = 'Setiap sesi melatih kepekaanmu menjaga lingkungan. Yuk main lagi untuk memecahkan rekor kombomu!';
    document.getElementById('btn-start-conveyor').textContent = '🔄 Main Lagi Sekarang';
    document.getElementById('conveyor-overlay').classList.remove('hidden');
  }
}

function nextConveyorItemManual() {
  if (!conveyorState.running) return;
  SoundFX.tap();
  document.getElementById('feedback-card').classList.add('hidden');
  spawnNextWasteItem();
}

function updateConveyorHUD() {
  const hearts = '❤️'.repeat(Math.max(0, conveyorState.lives)) + '🤍'.repeat(Math.max(0, 3 - conveyorState.lives));
  document.getElementById('game-lives').textContent = hearts;
  document.getElementById('game-combo').textContent = `${conveyorState.combo}x`;
  document.getElementById('game-session-score').textContent = conveyorState.sessionScore;
}

/**
 * 10. LOGIKA MODE GAME 2: KUIS CERDAS & MITOS VS FAKTA
 */
function initQuiz() {
  quizState.order = QUIZ_QUESTIONS.map((_, idx) => idx).sort(() => Math.random() - 0.5);
  quizState.currentIndex = 0;
  quizState.answered = false;
  quizState.selectedOption = null;
  quizState.sessionCorrect = 0;
  renderQuizQuestion();
}

function restartQuiz() {
  SoundFX.tap();
  initQuiz();
  showToast('Urutan soal kuis telah diacak ulang!', 'info');
}

function renderQuizQuestion() {
  const body = document.getElementById('quiz-body');
  const total = quizState.order.length;

  if (quizState.currentIndex >= total) {
    body.innerHTML = `
      <div class="text-center py-6 space-y-4 animate-pop">
        <div class="text-5xl">🏆</div>
        <h3 class="font-eco text-2xl font-bold text-slate-900">
          Kuis Cerdas Selesai!
        </h3>
        <p class="text-sm text-slate-600 max-w-md mx-auto">
          Kamu menjawab benar <strong class="text-emerald-700">${quizState.sessionCorrect} dari ${total}</strong> pertanyaan seputar fakta lingkungan dan pengelolaan sampah!
        </p>
        <button onclick="restartQuiz()" class="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-eco text-base font-bold shadow-md transition">
          🔄 Mainkan Kuis Lagi
        </button>
      </div>
    `;
    document.getElementById('quiz-progress-badge').textContent = 'Selesai!';
    return;
  }

  const qObj = QUIZ_QUESTIONS[quizState.order[quizState.currentIndex]];
  document.getElementById('quiz-progress-badge').textContent = `Soal ${quizState.currentIndex + 1} dari ${total}`;

  const optionsHtml = qObj.options.map((opt, idx) => {
    const letters = ['A', 'B', 'C'];
    let style = 'bg-slate-50 hover:bg-sky-50 border-slate-200 hover:border-sky-300 text-slate-800';
    if (quizState.answered) {
      if (idx === qObj.correctIndex) {
        style = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200';
      } else if (idx === quizState.selectedOption) {
        style = 'bg-rose-50 border-rose-400 text-rose-950';
      } else {
        style = 'bg-slate-50 border-slate-200 opacity-60';
      }
    }

    return `
      <button
        ${quizState.answered ? 'disabled' : `onclick="answerQuiz(${idx})"`}
        class="w-full text-left p-4 rounded-2xl border-2 transition flex items-start gap-3 ${style}"
      >
        <span class="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-extrabold text-slate-700 shrink-0">
          ${letters[idx]}
        </span>
        <span class="text-xs sm:text-sm font-semibold leading-relaxed">${opt}</span>
      </button>
    `;
  }).join('');

  body.innerHTML = `
    <div class="space-y-4 animate-pop">
      <span class="inline-block text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-sky-100 text-sky-800">
        ${qObj.tag}
      </span>
      <h3 class="font-eco text-lg sm:text-xl font-bold text-slate-900 leading-snug">
        ${qObj.question}
      </h3>
      <div class="space-y-2.5">
        ${optionsHtml}
      </div>
      ${quizState.answered ? `
        <div class="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-4 space-y-3">
          <div class="text-xs sm:text-sm text-emerald-950 leading-relaxed">
            <strong>💡 Penjelasan Fakta:</strong> ${qObj.explanation}
          </div>
          <button onclick="nextQuizQuestion()" class="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition">
            Soal Berikutnya ➡️
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function answerQuiz(optionIdx) {
  if (quizState.answered) return;
  const qObj = QUIZ_QUESTIONS[quizState.order[quizState.currentIndex]];
  quizState.answered = true;
  quizState.selectedOption = optionIdx;
  userProgress.totalAttempts++;

  if (optionIdx === qObj.correctIndex) {
    SoundFX.correct();
    quizState.sessionCorrect++;
    userProgress.quizCorrect++;
    userProgress.correctCount++;
    userProgress.score += 25;
    showToast('Jawaban Tepat! +25 Eco-Score 🎉', 'success');
  } else {
    SoundFX.wrong();
    showToast('Kurang tepat, baca penjelasan faktanya ya!', 'error');
  }

  saveProgress();
  updateGlobalStatsUI();
  renderQuizQuestion();
}

function nextQuizQuestion() {
  SoundFX.tap();
  quizState.currentIndex++;
  quizState.answered = false;
  quizState.selectedOption = null;
  renderQuizQuestion();
}

/**
 * 11. ENSIKLOPEDIA & PANDUAN PEMILAHAN ("KAMUS SAMPAH")
 */
function setKamusFilter(filterVal) {
  SoundFX.tap();
  kamusFilter = filterVal;
  renderKamusList();
}

function renderKamusList() {
  const searchInput = document.getElementById('kamus-search-input');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

  // Update style tombol filter
  document.getElementById('kfilter-semua').textContent = `Semua (${WASTE_DATABASE.length})`;
  ['semua', 'organik', 'anorganik', 'b3', 'ewaste', 'residu'].forEach(cat => {
    const btn = document.getElementById(`kfilter-${cat}`);
    if (!btn) return;
    btn.className = cat === kamusFilter
      ? 'kfilter-btn px-3.5 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap bg-emerald-600 text-white shadow-sm transition'
      : 'kfilter-btn px-3.5 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap bg-slate-100 text-slate-700 hover:bg-slate-200 transition';
  });

  const filtered = WASTE_DATABASE.filter(item => {
    const matchCat = kamusFilter === 'semua' || item.category === kamusFilter;
    const matchQuery = !query ||
      item.name.toLowerCase().includes(query) ||
      item.sub.toLowerCase().includes(query) ||
      item.similar.toLowerCase().includes(query) ||
      item.recycleIdea.toLowerCase().includes(query);
    return matchCat && matchQuery;
  });

  const grid = document.getElementById('kamus-grid');
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
        <div class="text-4xl">🔎</div>
        <h4 class="font-eco text-lg font-bold text-slate-800">Sampah tidak ditemukan</h4>
        <p class="text-xs text-slate-500">Coba kata kunci lain seperti "plastik", "baterai", "daun", atau pilih kategori "Semua".</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const meta = CATEGORY_META[item.category];
    return `
      <article class="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-3">
        <div>
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl shrink-0">
                ${item.emoji}
              </div>
              <div>
                <h3 class="font-eco text-base sm:text-lg font-bold text-slate-900">${item.name}</h3>
                <span class="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full mt-0.5 ${meta.badgeBg}">
                  ${meta.icon} ${meta.label}
                </span>
              </div>
            </div>
          </div>

          <p class="text-xs text-slate-600 mt-3 leading-relaxed">${item.why}</p>

          <div class="mt-3 space-y-1.5 text-xs">
            <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <strong class="text-slate-800">⏳ Waktu Terurai:</strong>
              <span class="text-rose-700 font-bold">${item.decomposeTime}</span>
            </div>
            <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <strong class="text-slate-800">📦 Contoh Serupa:</strong>
              <span class="text-slate-600">${item.similar}</span>
            </div>
            <div class="bg-amber-50/70 rounded-xl p-2.5 border border-amber-100">
              <strong class="text-amber-950">🧼 Persiapan Sebelum Dibuang:</strong>
              <span class="text-amber-900">${item.prep}</span>
            </div>
            <div class="bg-emerald-50/80 rounded-xl p-2.5 border border-emerald-100">
              <strong class="text-emerald-950">♻️ Ide Daur Ulang / Kompos:</strong>
              <span class="text-emerald-900">${item.recycleIdea}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * 12. DASHBOARD ECO-HERO & SIMULATOR DAMPAK LINGKUNGAN
 */
function getLevelInfo(score) {
  const levels = [
    { min: 0, max: 100, lv: 1, title: 'Pemula Hijau', next: 'Sahabat Daur Ulang' },
    { min: 100, max: 250, lv: 2, title: 'Sahabat Daur Ulang', next: 'Penjaga Sungai & Tanah' },
    { min: 250, max: 500, lv: 3, title: 'Penjaga Sungai & Tanah', next: 'Kapten Zero-Waste' },
    { min: 500, max: 900, lv: 4, title: 'Kapten Zero-Waste', next: 'Duta Lingkungan Nusantara' },
    { min: 900, max: 2000, lv: 5, title: 'Duta Lingkungan Nusantara', next: 'Legenda Bumi Lestari' }
  ];
  for (const item of levels) {
    if (score < item.max) return item;
  }
  return { min: 2000, max: 5000, lv: 6, title: 'Legenda Bumi Lestari', next: 'Puncak Kehormatan' };
}

function updateGlobalStatsUI() {
  const score = userProgress.score;
  const lvInfo = getLevelInfo(score);

  document.getElementById('header-score').textContent = score;
  document.getElementById('header-level').textContent = `Lv. ${lvInfo.lv} ${lvInfo.title}`;

  // Update Dashboard Level Card
  document.getElementById('dash-level-title').textContent = `Level ${lvInfo.lv}: ${lvInfo.title}`;
  const progressInLv = Math.max(0, score - lvInfo.min);
  const spanLv = Math.max(1, lvInfo.max - lvInfo.min);
  const pct = Math.min(100, Math.round((progressInLv / spanLv) * 100));

  document.getElementById('dash-next-level-text').textContent =
    `Kumpulkan ${lvInfo.max} Eco-Score untuk naik ke Level ${lvInfo.lv + 1}: ${lvInfo.next}!`;
  document.getElementById('dash-xp-bar-label').textContent = `${score} / ${lvInfo.max} Poin`;
  document.getElementById('dash-xp-bar').style.width = `${pct}%`;

  // Simulator Dampak Nyata Lingkungan
  const kgManaged = (userProgress.correctCount * 0.35).toFixed(1);
  const co2Saved = (userProgress.correctCount * 0.62).toFixed(1);
  const treesSaved = Math.floor(userProgress.correctCount / 5);
  const accuracy = userProgress.totalAttempts > 0
    ? Math.round((userProgress.correctCount / userProgress.totalAttempts) * 100)
    : 0;

  document.getElementById('impact-kg').textContent = `${kgManaged} kg`;
  document.getElementById('impact-co2').textContent = `${co2Saved} kg`;
  document.getElementById('impact-trees').textContent = `${treesSaved} Pohon`;
  document.getElementById('impact-accuracy').textContent = `${accuracy}%`;
  document.getElementById('impact-total-sorted').textContent =
    `${userProgress.correctCount} dari ${userProgress.totalAttempts} percobaan tepat`;

  // Render Lencana Pencapaian
  let unlockedCount = 0;
  const badgesHtml = ECO_BADGES.map(b => {
    const unlocked = b.check(userProgress);
    if (unlocked) unlockedCount++;
    return `
      <div class="rounded-2xl border-2 p-3.5 flex items-center gap-3 transition ${
        unlocked
          ? 'bg-emerald-50/80 border-emerald-300'
          : 'bg-slate-50 border-slate-200 opacity-60'
      }">
        <div class="w-12 h-12 rounded-2xl ${unlocked ? 'bg-white shadow-sm' : 'bg-slate-200 grayscale'} flex items-center justify-center text-2xl shrink-0">
          ${b.icon}
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-eco text-sm font-bold text-slate-900">${b.title}</span>
            ${unlocked ? '<span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">TERBUKA</span>' : ''}
          </div>
          <p class="text-[11px] text-slate-600 mt-0.5 leading-snug">${b.desc}</p>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('badges-grid').innerHTML = badgesHtml;
  document.getElementById('badge-count-label').textContent = `${unlockedCount} / ${ECO_BADGES.length} Terbuka`;
}

function confirmResetProgress() {
  SoundFX.tap();
  const modal = document.getElementById('reset-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeResetModal() {
  SoundFX.tap();
  const modal = document.getElementById('reset-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function executeResetProgress() {
  SoundFX.tap();
  localStorage.removeItem(STORAGE_KEY);
  userProgress = defaultUserProgress();
  userProgress.seenOnboarding = true;
  saveProgress();
  closeResetModal();
  updateGlobalStatsUI();
  showToast('Progres Eco-Hero berhasil di-reset ke awal!', 'info');
}

/**
 * 13. INISIALISASI APLIKASI SAAT HALAMAN DIBUKA
 */
window.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  setDifficulty('santai');
  switchTab('conveyor');
  initQuiz();
  renderKamusList();
  updateGlobalStatsUI();

  // Tampilkan Tur Panduan 3 Langkah otomatis bagi pengguna pertama kali
  if (!userProgress.seenOnboarding) {
    openOnboarding(0);
  }
});
