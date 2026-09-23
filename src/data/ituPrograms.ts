import { ItuProgram } from '../types';

/**
 * Official İTÜ Undergraduate (_LS) & Minor (_YD) Program Codes
 * Source: https://obs.itu.edu.tr/public/GenelTanimlamalar/ProgramKodlariList?programSeviyeTipiId=2
 */
export const ITU_PROGRAMS_LIST: ItuProgram[] = [
  // --- BİLGİSAYAR VE BİLİŞİM FAKÜLTESİ ---
  {
    code: 'BLG_LS',
    nameTr: 'Bilgisayar Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Computer Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Bilgisayar ve Bilişim Fakültesi'
  },
  {
    code: 'BLGE_LS',
    nameTr: 'Bilgisayar Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Computer Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Bilgisayar ve Bilişim Fakültesi'
  },
  {
    code: 'YZV_LS',
    nameTr: 'Yapay Zeka ve Veri Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Artificial Intelligence & Data Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Bilgisayar ve Bilişim Fakültesi'
  },
  {
    code: 'YZVE_LS',
    nameTr: 'Yapay Zeka ve Veri Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Artificial Intelligence & Data Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Bilgisayar ve Bilişim Fakültesi'
  },
  {
    code: 'SBR_LS',
    nameTr: 'Siber Güvenlik Mühendisliği Lisans',
    nameEn: 'Cybersecurity Engineering B.S.',
    degreeType: 'lisans',
    faculty: 'Bilgisayar ve Bilişim Fakültesi'
  },
  {
    code: 'SBRE_LS',
    nameTr: 'Siber Güvenlik Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Cybersecurity Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Bilgisayar ve Bilişim Fakültesi'
  },

  // --- İNŞAAT FAKÜLTESİ ---
  {
    code: 'CEV_LS',
    nameTr: 'Çevre Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Environmental Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'İnşaat Fakültesi'
  },
  {
    code: 'CEVE_LS',
    nameTr: 'Çevre Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Environmental Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'İnşaat Fakültesi'
  },
  {
    code: 'INS_LS',
    nameTr: 'İnşaat Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Civil Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'İnşaat Fakültesi'
  },
  {
    code: 'INSE_LS',
    nameTr: 'İnşaat Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Civil Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'İnşaat Fakültesi'
  },
  {
    code: 'GEO_LS',
    nameTr: 'Geomatik Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Geomatics Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'İnşaat Fakültesi'
  },
  {
    code: 'GEOE_LS',
    nameTr: 'Geomatik Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Geomatics Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'İnşaat Fakültesi'
  },

  // --- ELEKTRİK-ELEKTRONİK FAKÜLTESİ ---
  {
    code: 'EHB_LS',
    nameTr: 'Elektronik ve Haberleşme Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Electronics & Communication Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Elektrik-Elektronik Fakültesi'
  },
  {
    code: 'EHBE_LS',
    nameTr: 'Elektronik ve Haberleşme Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Electronics & Communication Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Elektrik-Elektronik Fakültesi'
  },
  {
    code: 'ELK_LS',
    nameTr: 'Elektrik Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Electrical Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Elektrik-Elektronik Fakültesi'
  },
  {
    code: 'ELKE_LS',
    nameTr: 'Elektrik Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Electrical Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Elektrik-Elektronik Fakültesi'
  },
  {
    code: 'KOM_LS',
    nameTr: 'Kontrol ve Otomasyon Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Control & Automation Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Elektrik-Elektronik Fakültesi'
  },
  {
    code: 'KOME_LS',
    nameTr: 'Kontrol ve Otomasyon Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Control & Automation Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Elektrik-Elektronik Fakültesi'
  },

  // --- MAKİNA FAKÜLTESİ ---
  {
    code: 'MAK_LS',
    nameTr: 'Makina Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Mechanical Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Makina Fakültesi'
  },
  {
    code: 'MAKE_LS',
    nameTr: 'Makina Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Mechanical Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Makina Fakültesi'
  },
  {
    code: 'IML_LS',
    nameTr: 'İmalat Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Manufacturing Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Makina Fakültesi'
  },
  {
    code: 'IMLE_LS',
    nameTr: 'İmalat Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Manufacturing Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Makina Fakültesi'
  },

  // --- İŞLETME FAKÜLTESİ ---
  {
    code: 'END_LS',
    nameTr: 'Endüstri Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Industrial Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'İşletme Fakültesi'
  },
  {
    code: 'ENDE_LS',
    nameTr: 'Endüstri Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Industrial Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'İşletme Fakültesi'
  },
  {
    code: 'ISL_LS',
    nameTr: 'İşletme Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Management Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'İşletme Fakültesi'
  },
  {
    code: 'ISLE_LS',
    nameTr: 'İşletme Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Management Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'İşletme Fakültesi'
  },
  {
    code: 'EKO_LS',
    nameTr: 'Ekonomi Lisans (%100 İngilizce)',
    nameEn: 'Economics B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'İşletme Fakültesi'
  },
  {
    code: 'EKOE_LS',
    nameTr: 'Ekonomi Lisans (%100 İngilizce)',
    nameEn: 'Economics B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'İşletme Fakültesi'
  },
  {
    code: 'YBS_LS',
    nameTr: 'Yönetim Bilişim Sistemleri Lisans',
    nameEn: 'Management Information Systems B.S.',
    degreeType: 'lisans',
    faculty: 'İşletme Fakültesi'
  },

  // --- MİMARLIK FAKÜLTESİ ---
  {
    code: 'MIM_LS',
    nameTr: 'Mimarlık Lisans (%30 İngilizce)',
    nameEn: 'Architecture B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Mimarlık Fakültesi'
  },
  {
    code: 'MIME_LS',
    nameTr: 'Mimarlık Lisans (%100 İngilizce)',
    nameEn: 'Architecture B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Mimarlık Fakültesi'
  },
  {
    code: 'ICM_LS',
    nameTr: 'İç Mimarlık Lisans (%30 İngilizce)',
    nameEn: 'Interior Architecture B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Mimarlık Fakültesi'
  },
  {
    code: 'ICME_LS',
    nameTr: 'İç Mimarlık Lisans (%100 İngilizce)',
    nameEn: 'Interior Architecture B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Mimarlık Fakültesi'
  },
  {
    code: 'PEM_LS',
    nameTr: 'Peyzaj Mimarlığı Lisans (%30 İngilizce)',
    nameEn: 'Landscape Architecture B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Mimarlık Fakültesi'
  },
  {
    code: 'PEME_LS',
    nameTr: 'Peyzaj Mimarlığı Lisans (%100 İngilizce)',
    nameEn: 'Landscape Architecture B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Mimarlık Fakültesi'
  },
  {
    code: 'SBP_LS',
    nameTr: 'Şehir ve Bölge Planlama Lisans (%30 İngilizce)',
    nameEn: 'City & Regional Planning B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Mimarlık Fakültesi'
  },
  {
    code: 'SBPE_LS',
    nameTr: 'Şehir ve Bölge Planlama Lisans (%100 İngilizce)',
    nameEn: 'City & Regional Planning B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Mimarlık Fakültesi'
  },
  {
    code: 'ENT_LS',
    nameTr: 'Endüstriyel Tasarım Lisans (%30 İngilizce)',
    nameEn: 'Industrial Design B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Mimarlık Fakültesi'
  },
  {
    code: 'ENTE_LS',
    nameTr: 'Endüstriyel Tasarım Lisans (%100 İngilizce)',
    nameEn: 'Industrial Design B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Mimarlık Fakültesi'
  },

  // --- FEN EDEBİYAT FAKÜLTESİ ---
  {
    code: 'MAT_LS',
    nameTr: 'Matematik Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Mathematical Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Fen Edebiyat Fakültesi'
  },
  {
    code: 'MATE_LS',
    nameTr: 'Matematik Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Mathematical Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Fen Edebiyat Fakültesi'
  },
  {
    code: 'FIZ_LS',
    nameTr: 'Fizik Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Physics Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Fen Edebiyat Fakültesi'
  },
  {
    code: 'FIZE_LS',
    nameTr: 'Fizik Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Physics Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Fen Edebiyat Fakültesi'
  },
  {
    code: 'KMY_LS',
    nameTr: 'Kimya Lisans (%30 İngilizce)',
    nameEn: 'Chemistry B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Fen Edebiyat Fakültesi'
  },
  {
    code: 'KMYE_LS',
    nameTr: 'Kimya Lisans (%100 İngilizce)',
    nameEn: 'Chemistry B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Fen Edebiyat Fakültesi'
  },
  {
    code: 'MBG_LS',
    nameTr: 'Moleküler Biyoloji ve Genetik Lisans (%100 İngilizce)',
    nameEn: 'Molecular Biology & Genetics B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Fen Edebiyat Fakültesi'
  },

  // --- KİMYA-METALURJİ FAKÜLTESİ ---
  {
    code: 'KMH_LS',
    nameTr: 'Kimya Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Chemical Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Kimya-Metalurji Fakültesi'
  },
  {
    code: 'KMHE_LS',
    nameTr: 'Kimya Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Chemical Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Kimya-Metalurji Fakültesi'
  },
  {
    code: 'MET_LS',
    nameTr: 'Metalurji ve Malzeme Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Metallurgical & Materials Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Kimya-Metalurji Fakültesi'
  },
  {
    code: 'METE_LS',
    nameTr: 'Metalurji ve Malzeme Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Metallurgical & Materials Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Kimya-Metalurji Fakültesi'
  },
  {
    code: 'GID_LS',
    nameTr: 'Gıda Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Food Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Kimya-Metalurji Fakültesi'
  },
  {
    code: 'GIDE_LS',
    nameTr: 'Gıda Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Food Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Kimya-Metalurji Fakültesi'
  },
  {
    code: 'BIO_LS',
    nameTr: 'Biyomühendislik Lisans',
    nameEn: 'Bioengineering B.S.',
    degreeType: 'lisans',
    faculty: 'Kimya-Metalurji Fakültesi'
  },
  {
    code: 'BIOE_LS',
    nameTr: 'Biyomühendislik Lisans (%100 İngilizce)',
    nameEn: 'Bioengineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Kimya-Metalurji Fakültesi'
  },

  // --- MADEN FAKÜLTESİ ---
  {
    code: 'MAD_LS',
    nameTr: 'Maden Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Mining Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Maden Fakültesi'
  },
  {
    code: 'MADE_LS',
    nameTr: 'Maden Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Mining Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Maden Fakültesi'
  },
  {
    code: 'JEO_LS',
    nameTr: 'Jeoloji Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Geological Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Maden Fakültesi'
  },
  {
    code: 'JEOE_LS',
    nameTr: 'Jeoloji Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Geological Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Maden Fakültesi'
  },
  {
    code: 'JEF_LS',
    nameTr: 'Jeofizik Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Geophysical Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Maden Fakültesi'
  },
  {
    code: 'JEFE_LS',
    nameTr: 'Jeofizik Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Geophysical Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Maden Fakültesi'
  },
  {
    code: 'PET_LS',
    nameTr: 'Petrol ve Doğalgaz Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Petroleum & Natural Gas Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Maden Fakültesi'
  },
  {
    code: 'PETE_LS',
    nameTr: 'Petrol ve Doğalgaz Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Petroleum & Natural Gas Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Maden Fakültesi'
  },

  // --- UÇAK VE UZAY BİLİMLERİ FAKÜLTESİ ---
  {
    code: 'UCB_LS',
    nameTr: 'Uçak Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Aeronautical Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Uçak ve Uzay Bilimleri Fakültesi'
  },
  {
    code: 'UCBE_LS',
    nameTr: 'Uçak Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Aeronautical Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Uçak ve Uzay Bilimleri Fakültesi'
  },
  {
    code: 'UZB_LS',
    nameTr: 'Uzay Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Astronautical Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Uçak ve Uzay Bilimleri Fakültesi'
  },
  {
    code: 'UZBE_LS',
    nameTr: 'Uzay Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Astronautical Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Uçak ve Uzay Bilimleri Fakültesi'
  },
  {
    code: 'MTO_LS',
    nameTr: 'Meteoroloji Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Meteorological Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Uçak ve Uzay Bilimleri Fakültesi'
  },
  {
    code: 'MTOE_LS',
    nameTr: 'Meteoroloji Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Meteorological Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Uçak ve Uzay Bilimleri Fakültesi'
  },

  // --- GEMİ İNŞAATI VE DENİZ BİLİMLERİ FAKÜLTESİ ---
  {
    code: 'GEM_LS',
    nameTr: 'Gemi İnşaatı ve Gemi Makineleri Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Naval Architecture & Marine Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Gemi İnşaatı ve Deniz Bilimleri Fakültesi'
  },
  {
    code: 'GEME_LS',
    nameTr: 'Gemi İnşaatı ve Gemi Makineleri Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Naval Architecture & Marine Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Gemi İnşaatı ve Deniz Bilimleri Fakültesi'
  },
  {
    code: 'DEN_LS',
    nameTr: 'Gemi ve Deniz Teknolojisi Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Shipbuilding & Ocean Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Gemi İnşaatı ve Deniz Bilimleri Fakültesi'
  },
  {
    code: 'DENE_LS',
    nameTr: 'Gemi ve Deniz Teknolojisi Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Shipbuilding & Ocean Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Gemi İnşaatı ve Deniz Bilimleri Fakültesi'
  },

  // --- TEKSTİL TEKNOLOJİLERİ VE TASARIMI FAKÜLTESİ ---
  {
    code: 'TEK_LS',
    nameTr: 'Tekstil Mühendisliği Lisans (%30 İngilizce)',
    nameEn: 'Textile Engineering B.S. (30% English)',
    degreeType: 'lisans',
    faculty: 'Tekstil Teknolojileri ve Tasarımı Fakültesi'
  },
  {
    code: 'TEKE_LS',
    nameTr: 'Tekstil Mühendisliği Lisans (%100 İngilizce)',
    nameEn: 'Textile Engineering B.S. (100% English)',
    degreeType: 'lisans',
    faculty: 'Tekstil Teknolojileri ve Tasarımı Fakültesi'
  },

  // --- YANDAL PROGRAMLARI (_YD) ---
  {
    code: 'SUR_YD',
    nameTr: 'Sürdürülebilirlik Yandal Programı',
    nameEn: 'Sustainability Minor Program',
    degreeType: 'yandal',
    faculty: 'Disiplinlerarası Yandal'
  },
  {
    code: 'BIL_YD',
    nameTr: 'Bilişim Teknolojileri Yandal Programı',
    nameEn: 'Information Technologies Minor Program',
    degreeType: 'yandal',
    faculty: 'Bilgisayar ve Bilişim Fakültesi'
  },
  {
    code: 'VER_YD',
    nameTr: 'Veri Analitiği ve Bilimi Yandal Programı',
    nameEn: 'Data Analytics and Science Minor Program',
    degreeType: 'yandal',
    faculty: 'Bilgisayar ve Bilişim Fakültesi'
  },
  {
    code: 'YZV_YD',
    nameTr: 'Yapay Zeka Yandal Programı',
    nameEn: 'Artificial Intelligence Minor Program',
    degreeType: 'yandal',
    faculty: 'Bilgisayar ve Bilişim Fakültesi'
  },
  {
    code: 'SBR_YD',
    nameTr: 'Siber Güvenlik Yandal Programı',
    nameEn: 'Cybersecurity Minor Program',
    degreeType: 'yandal',
    faculty: 'Bilgisayar ve Bilişim Fakültesi'
  },
  {
    code: 'ROB_YD',
    nameTr: 'Robotik ve Otonom Sistemler Yandal Programı',
    nameEn: 'Robotics and Autonomous Systems Minor Program',
    degreeType: 'yandal',
    faculty: 'Elektrik-Elektronik Fakültesi'
  },
  {
    code: 'FIN_YD',
    nameTr: 'Finans Mühendisliği Yandal Programı',
    nameEn: 'Financial Engineering Minor Program',
    degreeType: 'yandal',
    faculty: 'İşletme Fakültesi'
  },
  {
    code: 'GIR_YD',
    nameTr: 'Girişimcilik ve İnovasyon Yandal Programı',
    nameEn: 'Entrepreneurship and Innovation Minor Program',
    degreeType: 'yandal',
    faculty: 'İşletme Fakültesi'
  },
  {
    code: 'CEV_YD',
    nameTr: 'Çevre Yönetimi ve Politikaları Yandal Programı',
    nameEn: 'Environmental Management & Policies Minor Program',
    degreeType: 'yandal',
    faculty: 'İnşaat Fakültesi'
  },
  {
    code: 'ENE_YD',
    nameTr: 'Enerji Sistemleri Yandal Programı',
    nameEn: 'Energy Systems Minor Program',
    degreeType: 'yandal',
    faculty: 'Enerji Enstitüsü'
  },
  {
    code: 'OTO_YD',
    nameTr: 'Otomotiv Mühendisliği Yandal Programı',
    nameEn: 'Automotive Engineering Minor Program',
    degreeType: 'yandal',
    faculty: 'Makina Fakültesi'
  },
  {
    code: 'BMO_YD',
    nameTr: 'Biyomedikal Mühendisliği Yandal Programı',
    nameEn: 'Biomedical Engineering Minor Program',
    degreeType: 'yandal',
    faculty: 'Elektrik-Elektronik Fakültesi'
  }
];

/**
 * Searches İTÜ programs by code, Turkish name, English name or faculty.
 * Also matches without '_LS' or '_YD' suffix (e.g. 'BLG' matches 'BLG_LS' and 'BLGE_LS').
 */
export function searchItuPrograms(query: string): ItuProgram[] {
  if (!query || !query.trim()) return ITU_PROGRAMS_LIST;
  const q = query.trim().toLowerCase();
  const qClean = q.replace(/_ls$/, '').replace(/_yd$/, '').replace(/-yan$/, '');

  return ITU_PROGRAMS_LIST.filter((p) => {
    const pCodeClean = p.code.toLowerCase().replace(/_ls$/, '').replace(/_yd$/, '').replace(/-yan$/, '');
    return (
      p.code.toLowerCase().includes(q) ||
      pCodeClean.includes(qClean) ||
      p.nameTr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      (p.faculty && p.faculty.toLowerCase().includes(q))
    );
  });
}

/**
 * Normalizes program code or name into a canonical program object or creates a custom one.
 */
export function findOrCreateProgram(input: string): ItuProgram {
  const clean = input.trim();
  const cleanUpper = clean.toUpperCase();
  const cleanBase = cleanUpper.replace(/_LS$/, '').replace(/_YD$/, '').replace(/-YAN$/, '');

  const found = ITU_PROGRAMS_LIST.find(
    (p) =>
      p.code.toUpperCase() === cleanUpper ||
      p.code.toUpperCase().replace(/_LS$/, '').replace(/_YD$/, '') === cleanBase ||
      p.nameTr.toLowerCase() === clean.toLowerCase() ||
      p.nameEn.toLowerCase() === clean.toLowerCase()
  );

  if (found) return found;

  // Custom program entered by student
  const isYandal = clean.toLowerCase().includes('yandal') || cleanUpper.includes('YAN') || cleanUpper.includes('_YD');
  const codeSuffix = isYandal ? '_YD' : '_LS';
  const customCode = cleanUpper.includes('_') ? cleanUpper : `${cleanUpper.slice(0, 5)}${codeSuffix}`;

  return {
    code: customCode,
    nameTr: clean,
    nameEn: clean,
    degreeType: isYandal ? 'yandal' : 'lisans',
    faculty: 'İTÜ'
  };
}
