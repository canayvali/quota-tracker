import { AppLanguage } from '../types';

export interface TranslationDictionary {
  // Language names
  currentLanguageName: string;
  otherLanguageName: string;
  languageShort: string;
  otherLanguageShort: string;
  selectLanguage: string;

  // Auth Page
  authBadge: string;
  authTitle: string;
  authSubtitle: string;
  tabSignIn: string;
  tabSignUp: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  nameLabel: string;
  namePlaceholder: string;
  signupEmailLabel: string;
  signupEmailHint: string;
  signupPasswordHint: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  btnSignIn: string;
  btnSigningIn: string;
  btnSendVerification: string;
  btnSendingVerification: string;
  btnVerifyAndRegister: string;
  btnVerifying: string;
  btnCreateAccount: string;
  btnCreatingAccount: string;
  verificationModalTitle: string;
  verificationModalSubtitle: string;
  verificationAlgorithmNote: string;
  noAccountPrompt: string;
  signUpNow: string;
  verifyCodeTitle: string;
  verifyCodeSentTo: string;
  verifyCodeLabel: string;
  btnChangeDetails: string;
  btnResendCode: string;
  resendCooldown: string;
  adminLoginLink: string;

  // Header
  liveMonitor: string;
  trackingCount: string;
  trackingZero: string;
  btnProfile: string;
  btnLogout: string;
  btnObsSchedule: string;
  btnCheckAll: string;
  btnAdminPage: string;
  btnAddCrn: string;
  autoRefreshTooltip: string;
  soundTooltip: string;
  appearancePreference: string;
  lightMode: string;
  darkMode: string;
  accountSettings: string;

  // Quick CRN Input Box
  quickCrnPlaceholder: string;
  gatheringFromObs: string;
  btnTrackCrn: string;
  quickSamples: string;
  alertDestination: string;

  // Stats bar
  statsActive: string;
  statsOpenSeats: string;
  statsEmails: string;
  statsSourceWebPage: string;

  // Search and Filters
  searchPlaceholder: string;
  filterAll: string;
  filterOpen: string;
  filterFull: string;
  filterPaused: string;

  // Empty state
  emptyStateTitle: string;
  emptyTitle: string;
  emptySubtitle: string;

  // How it works guide
  howItWorksTitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;

  // Card items
  statusSeatOpen: string;
  statusFull: string;
  statusActive: string;
  statusOff: string;
  seatsEnrolled: string;
  seatsRemaining: string;
  lastChecked: string;
  justNow: string;
  btnCheckNow: string;
  btnHistory: string;
  btnDelete: string;
  btnPause: string;
  btnResume: string;

  // Profile modal
  profileTitle: string;
  profileSubtitle: string;
  profileName: string;
  profileEmail: string;
  profileVerifiedBadge: string;
  profileCoursesCount: string;
  profileCoursesSuffix: string;
  profileRegisteredAt: string;
  profileLanguagePref: string;
  changePasswordTitle: string;
  currentPasswordLabel: string;
  currentPasswordPlaceholder: string;
  newPasswordLabel: string;
  newPasswordPlaceholder: string;
  confirmNewPasswordLabel: string;
  confirmNewPasswordPlaceholder: string;
  btnUpdatePassword: string;
  btnUpdatingPassword: string;
  confirmDeletePrompt: string;
  btnConfirmDelete: string;
  btnCancel: string;
  deleteAccountLink: string;

  // Alerts and Toasts
  passwordUpdatedToast: string;
  passwordUpdatedToastTitle: string;
  passwordUpdatedToastDesc: string;
  loggedOutToastTitle: string;
  loggedOutToastDesc: string;
  languageChangedToastTitle: string;
  languageChangedToastDesc: string;

  // Add CRN & Course Code Modal
  modalAddTitle: string;
  modalAddSubtitle: string;
  tabByCrn: string;
  tabByCourseCode: string;
  crnInputLabel: string;
  crnInputHint: string;
  crnPlaceholder: string;
  courseCodeInputLabel: string;
  courseCodeInputHint: string;
  courseCodePlaceholder: string;
  courseCodeExplanation: string;
  quickTestSamples: string;
  quickCourseSamples: string;
  notificationDestination: string;
  deliveryFilterLabel: string;
  deliveryFilterAll: string;
  deliveryFilterFaceToFace: string;
  deliveryFilterOnline: string;
  deliveryFilterHint: string;
  courseGroupLabel: string;
  sectionsCount: string;
  openSeatsInGroup: string;
  allSectionsFull: string;
  simulateNewCrnFaceToFace: string;
  simulateNewCrnOnline: string;
  mismatchFilterNotice: string;
  gatheredFromObs: string;
  instructorLabel: string;
  quotaLabel: string;
  remainingLabel: string;
  infoNotice: string;
  infoNoticeCourseCode: string;
  btnBrowseObs: string;
  btnTrackCrnSubmit: string;
  btnTrackCourseCodeSubmit: string;
  gatheringFromObsModal: string;
  errorEnterCrn: string;
  errorInvalidCrn: string;
  errorEnterCourseCode: string;
  errorNoCrnsFoundForCourse: string;
  discoveredCrnsCount: string;
  newCrnEmailNotice: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  tr: {
    // Language names
    currentLanguageName: 'Türkçe',
    otherLanguageName: 'English',
    languageShort: 'TR',
    otherLanguageShort: 'EN',
    selectLanguage: 'Dil Seçimi',

    // Auth Page
    authBadge: 'Canlı Kontenjan Takipçisi',
    authTitle: 'Kontenjan Takipçisi',
    authSubtitle: 'Ders kontenjanlarını anlık takip etmek için giriş yapın veya hesap oluşturun. Kontenjan açıldığında bildirimler kayıtlı e-posta adresinize gönderilir.',
    tabSignIn: 'Giriş Yap',
    tabSignUp: 'Kayıt Ol',
    emailLabel: 'E-posta Adresi',
    emailPlaceholder: 'emailadress@gmail.com',
    passwordLabel: 'Şifre',
    passwordPlaceholder: '••••••••',
    nameLabel: 'Ad Soyad',
    namePlaceholder: 'Örn. Öğrenci Adı',
    signupEmailLabel: 'Bildirim E-postası',
    signupEmailHint: 'Kayıt sırasında bu adrese 6 haneli doğrulama kodu gönderilecektir.',
    signupPasswordHint: 'En az 8 karakter',
    confirmPasswordLabel: 'Şifre Tekrar',
    confirmPasswordPlaceholder: 'Şifrenizi tekrar giriniz',
    btnSignIn: 'Giriş Yap',
    btnSigningIn: 'Giriş Yapılıyor...',
    btnSendVerification: 'Doğrulama Kodu Gönder (6 Hane)',
    btnSendingVerification: 'Doğrulama Kodu Gönderiliyor...',
    btnVerifyAndRegister: 'Kodu Onayla ve Hesabı Aç',
    btnVerifying: 'Doğrulanıyor...',
    btnCreateAccount: 'Hesap Oluştur',
    btnCreatingAccount: 'Hesap Oluşturuluyor...',
    verificationModalTitle: 'E-posta Doğrulama',
    verificationModalSubtitle: 'Hesabınızı aktifleştirmek için e-postanıza gelen 6 haneli kodu giriniz.',
    verificationAlgorithmNote: '',
    noAccountPrompt: 'Hesabınız yok mu?',
    signUpNow: 'Kayıt Olun',
    verifyCodeTitle: 'Doğrulama Kodunu Giriniz',
    verifyCodeSentTo: 'adresine 6 haneli doğrulama kodu gönderildi.',
    verifyCodeLabel: '6 Haneli Doğrulama Kodu',
    btnChangeDetails: 'Bilgileri Değiştir',
    btnResendCode: 'Kodu Tekrar Gönder',
    resendCooldown: 'Tekrar Gönder',
    adminLoginLink: 'Yönetici Girişi (/admin)',

    // Header
    liveMonitor: 'Canlı Takip',
    trackingCount: 'Takip Edilen: {active} / {total} CRN',
    trackingZero: 'Henüz CRN eklenmedi',
    btnProfile: 'Profil',
    btnLogout: 'Çıkış Yap',
    btnObsSchedule: 'İTÜ OBS Tarayıcı',
    btnCheckAll: 'Tümünü Kontrol Et',
    btnAdminPage: 'Yönetici Sayfası (/admin)',
    btnAddCrn: 'CRN Ekle',
    autoRefreshTooltip: '45 saniyede bir otomatik sorgulama:',
    soundTooltip: 'Sesli bildirim uyarısı:',
    appearancePreference: 'Görünüm',
    lightMode: 'Aydınlık',
    darkMode: 'Koyu',
    accountSettings: 'Hesap Ayarları',

    // Quick CRN Input Box
    quickCrnPlaceholder: '5 haneli CRN veya Ders Kodu giriniz',
    gatheringFromObs: 'İTÜ OBS Sorgulanıyor...',
    btnTrackCrn: 'CRN Takip Et',
    quickSamples: 'Örnek dersler',
    alertDestination: 'Bildirim alıcısı',

    // Stats bar
    statsActive: 'Takip Edilen Ders',
    statsOpenSeats: 'Açık Kontenjan',
    statsEmails: 'Gönderilen Bildirim',
    statsSourceWebPage: 'Resmi Kaynak',

    // Search and Filters
    searchPlaceholder: 'CRN, ders kodu veya ders adı ile ara...',
    filterAll: 'Tüm Dersler',
    filterOpen: 'Kontenjanı Açıklar',
    filterFull: 'Dolu Dersler',
    filterPaused: 'Durdurulanlar',

    // Empty state
    emptyStateTitle: 'Yukarıdan bir CRN girerek başlayın',
    emptyTitle: 'Yukarıdan bir CRN girerek başlayın',
    emptySubtitle: "İTÜ'deki 5 haneli CRN kodunu girmeniz yeterlidir. obs.itu.edu.tr adresi sorgulanır ve kontenjan açıldığında anında e-posta alırsınız.",

    // How it works guide
    howItWorksTitle: 'Bu Kontenjan Takipçisi İTÜ Öğrencileri İçin Nasıl Çalışır?',
    step1Title: '1. Sadece CRN Kodunu Girin',
    step1Desc: 'Ders adını, hocasını veya her seferinde e-postanızı girmenize gerek yoktur. 5 haneli CRN kodunu yazmanız yeterlidir; tüm veriler doğrudan obs.itu.edu.tr üzerinden çekilir.',
    step2Title: '2. Arka Planda Canlı Sorgulama',
    step2Desc: 'Takipçi, ders seçim yoğunluğunda sürekli sayfayı yenilemek zorunda kalmamanız için üniversitenin kontenjan sistemini düzenli aralıklarla sorgular.',
    step3Title: '3. Otomatik E-posta Bildirimi',
    step3Desc: 'Kontenjan değiştiğinde (örneğin bir öğrenci dersi bıraktığında veya kontenjan arttırıldığında), anında bilgilendirme e-postası gönderilir.',

    // Card items
    statusSeatOpen: 'KONTENJAN AÇILDI!',
    statusFull: 'Dolu',
    statusActive: 'Aktif',
    statusOff: 'Kapalı',
    seatsEnrolled: 'Kayıtlı',
    seatsRemaining: 'Kalan',
    lastChecked: 'Son kontrol',
    justNow: 'Az önce',
    btnCheckNow: 'Şimdi Kontrol Et',
    btnHistory: 'Geçmiş',
    btnDelete: 'Sil',
    btnPause: 'Durdur',
    btnResume: 'Devam Et',

    // Profile modal
    profileTitle: 'Öğrenci Profili',
    profileSubtitle: 'Hesap ayarları, tercih edilen dil ve şifre yönetimi',
    profileName: 'Ad Soyad:',
    profileEmail: 'E-posta:',
    profileVerifiedBadge: 'Doğrulandı',
    profileCoursesCount: 'Takip Edilen CRN Sayısı:',
    profileCoursesSuffix: 'Ders',
    profileRegisteredAt: 'Kayıt Tarihi:',
    profileLanguagePref: 'Uygulama Dili:',
    changePasswordTitle: 'Şifre Değiştir',
    currentPasswordLabel: 'Mevcut Şifre',
    currentPasswordPlaceholder: 'Mevcut şifrenizi giriniz',
    newPasswordLabel: 'Yeni Şifre',
    newPasswordPlaceholder: 'En az 4 karakter',
    confirmNewPasswordLabel: 'Yeni Şifre Tekrar',
    confirmNewPasswordPlaceholder: 'Yeni şifrenizi tekrar giriniz',
    btnUpdatePassword: 'Şifreyi Güncelle',
    btnUpdatingPassword: 'Güncelleniyor...',
    confirmDeletePrompt: 'Emin misiniz?',
    btnConfirmDelete: 'Evet, Sil',
    btnCancel: 'İptal',
    deleteAccountLink: 'Hesabı Sil',

    // Alerts and Toasts
    passwordUpdatedToast: 'Şifre Güncellendi',
    passwordUpdatedToastTitle: 'Şifre Güncellendi',
    passwordUpdatedToastDesc: 'Şifreniz başarıyla değiştirildi.',
    loggedOutToastTitle: 'Oturum Kapatıldı',
    loggedOutToastDesc: 'Başarıyla çıkış yaptınız.',
    languageChangedToastTitle: 'Dil Değiştirildi',
    languageChangedToastDesc: 'Uygulama dili Türkçe olarak güncellendi.',

    // Add CRN & Course Code Modal (TR)
    modalAddTitle: 'Ders / CRN Takibi Ekle',
    modalAddSubtitle: 'CRN veya Ders Kodu girin • Tüm bilgiler obs.itu.edu.tr üzerinden anlık çekilir',
    tabByCrn: 'Tekil CRN ile Takip',
    tabByCourseCode: 'Ders Kodu ile Takip (Tüm Şubeler)',
    crnInputLabel: 'Ders Referans Numarası (CRN)',
    crnInputHint: '5 haneli kod',
    crnPlaceholder: '5 haneli CRN kodunu giriniz',
    courseCodeInputLabel: 'Ders Kodu',
    courseCodeInputHint: 'Tüm şubeleri (CRN\'leri) kapsar',
    courseCodePlaceholder: 'Ders kodunu giriniz (örn. MAT103E)',
    courseCodeExplanation: 'Bu ders koduna ait İTÜ OBS\'deki tüm şubeler (CRN\'ler) otomatik tespit edilip takibe alınır. Herhangi birinde kontenjan açıldığında veya yeni bir CRN açıldığında e-posta bildirimi alırsınız.',
    quickTestSamples: 'Popüler CRN örnekleri:',
    quickCourseSamples: 'Popüler ders kodları:',
    notificationDestination: 'Bildirim adresi:',
    deliveryFilterLabel: 'Ders Veriliş Şekli / Filtre',
    deliveryFilterAll: 'Tümü (Yüz Yüze & Çevrimiçi)',
    deliveryFilterFaceToFace: 'Sadece Yüz Yüze',
    deliveryFilterOnline: 'Sadece Çevrimiçi (Online)',
    deliveryFilterHint: 'İTÜ OBS ders programında (Çevrimiçi) ibaresi bulunan dersler online kabul edilir. Yeni bir şube açıldığında da bu tercihe göre kontrol edilir.',
    courseGroupLabel: 'Toplu Ders Takibi',
    sectionsCount: 'Şube',
    openSeatsInGroup: 'Boş Kontenjan',
    allSectionsFull: 'Tüm Şubeler Dolu',
    simulateNewCrnFaceToFace: 'Yeni CRN Açıldı (Yüz Yüze)',
    simulateNewCrnOnline: 'Yeni CRN Açıldı (Çevrimiçi)',
    mismatchFilterNotice: 'Açılan yeni şube seçtiğiniz filtreye ({filter}) uymadığı için bildirim gönderilmedi.',
    gatheredFromObs: 'İTÜ OBS\'den Çekilen Bilgiler:',
    instructorLabel: 'Öğretim Görevlisi',
    quotaLabel: 'Kontenjan',
    remainingLabel: 'Kalan Boş',
    infoNotice: 'Ders adı, bölüm, hoca, derslik programı ve anlık kontenjan bu CRN kullanılarak doğrudan obs.itu.edu.tr adresinden çekilir.',
    infoNoticeCourseCode: 'Bu ders kodunun İTÜ OBS\'deki tüm şubeleri anlık taranır. Kod altında yeni bir CRN açılırsa anında "Yeni CRN Açıldı" e-postası gönderilir.',
    btnBrowseObs: 'OBS Kataloğunu Aç →',
    btnTrackCrnSubmit: 'CRN Takip Et',
    btnTrackCourseCodeSubmit: 'Dersi ve Tüm CRN\'leri Takip Et',
    gatheringFromObsModal: 'İTÜ OBS taranıyor...',
    errorEnterCrn: 'Lütfen 5 haneli bir CRN kodu giriniz.',
    errorInvalidCrn: 'CRN 5 haneli bir sayı olmalıdır (Örn: 12486).',
    errorEnterCourseCode: 'Lütfen bir ders kodu giriniz (Örn: CEV103 veya MAT103E).',
    errorNoCrnsFoundForCourse: 'Bu ders koduna ait şube bulunamadı. Lütfen ders kodunu kontrol ediniz.',
    discoveredCrnsCount: 'şube (CRN) tespit edildi ve takibe hazır.',
    newCrnEmailNotice: 'Bu kod altında yeni bir CRN açıldığında özel bildirim e-postası gönderilecektir.'
  },
  en: {
    // Language names
    currentLanguageName: 'English',
    otherLanguageName: 'Türkçe',
    languageShort: 'EN',
    otherLanguageShort: 'TR',
    selectLanguage: 'Language',

    // Auth Page
    authBadge: 'Live Quota Tracker',
    authTitle: 'Student Portal',
    authSubtitle: 'Sign in or create an account to start tracking CRN quotas. Alert emails will be sent directly to your registered account.',
    tabSignIn: 'Sign In',
    tabSignUp: 'Create Account',
    emailLabel: 'Email Address',
    emailPlaceholder: 'emailadress@gmail.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    nameLabel: 'Full Name',
    namePlaceholder: 'e.g. Student Name',
    signupEmailLabel: 'Notification Email',
    signupEmailHint: 'A 6-digit verification code will be sent to this email during registration.',
    signupPasswordHint: 'At least 8 characters',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    btnSignIn: 'Sign In',
    btnSigningIn: 'Signing in...',
    btnSendVerification: 'Send Verification Code (6-Digit)',
    btnSendingVerification: 'Sending verification code...',
    btnVerifyAndRegister: 'Verify Code & Create Account',
    btnVerifying: 'Verifying...',
    btnCreateAccount: 'Create Account',
    btnCreatingAccount: 'Creating Account...',
    verificationModalTitle: 'Email Verification',
    verificationModalSubtitle: 'Enter the 6-digit code sent to your email to activate your account.',
    verificationAlgorithmNote: '',
    noAccountPrompt: "Don't have an account?",
    signUpNow: 'Sign Up',
    verifyCodeTitle: 'Enter Verification Code',
    verifyCodeSentTo: 'has been sent a 6-digit verification code.',
    verifyCodeLabel: '6-Digit Verification Code',
    btnChangeDetails: 'Edit Info',
    btnResendCode: 'Resend Code',
    resendCooldown: 'Resend',
    adminLoginLink: 'Admin Portal (/admin)',

    // Header
    liveMonitor: 'Live Monitor',
    trackingCount: 'Tracking: {active} of {total} CRNs',
    trackingZero: 'No CRNs monitored yet',
    btnProfile: 'Profile',
    btnLogout: 'Sign Out',
    btnObsSchedule: 'İTÜ OBS Browser',
    btnCheckAll: 'Check All',
    btnAdminPage: 'Admin Page (/admin)',
    btnAddCrn: 'Add CRN',
    autoRefreshTooltip: 'Auto-check every 45s:',
    soundTooltip: 'Sound alert:',
    appearancePreference: 'Appearance',
    lightMode: 'Light',
    darkMode: 'Dark',
    accountSettings: 'Account Settings',

    // Quick CRN Input Box
    quickCrnPlaceholder: 'Enter 5-digit CRN or Course Code',
    gatheringFromObs: 'Gathering from İTÜ OBS...',
    btnTrackCrn: 'Track CRN',
    quickSamples: 'Sample courses',
    alertDestination: 'Alert destination',

    // Stats bar
    statsActive: 'Monitored Classes',
    statsOpenSeats: 'Seats Currently Open',
    statsEmails: 'Alert Emails Sent',
    statsSourceWebPage: 'Source Web Page',

    // Search and Filters
    searchPlaceholder: 'Search by CRN, course code, or title...',
    filterAll: 'All Classes',
    filterOpen: 'Seats Open',
    filterFull: 'Full Only',
    filterPaused: 'Paused',

    // Empty state
    emptyStateTitle: 'Start by entering a CRN above',
    emptyTitle: 'Start by entering a CRN above',
    emptySubtitle: 'Just provide the 5-digit CRN from İTÜ. The system queries obs.itu.edu.tr, gathers course title and quota, and emails you as soon as a seat opens.',

    // How it works guide
    howItWorksTitle: 'How This Quota Monitor Works for İTÜ Students',
    step1Title: '1. Enter Only the CRN',
    step1Desc: 'No need to type course titles, instructors, or your email each time. Enter any 5-digit CRN and all details are auto-gathered directly from obs.itu.edu.tr.',
    step2Title: '2. Live Background Checking',
    step2Desc: 'The tracker continuously queries the university quota records without you having to repeatedly refresh during registration rush.',
    step3Title: '3. Automated Email Alert',
    step3Desc: 'When a quota change occurs (e.g. a student drops and a seat opens), an alert email is dispatched instantly.',

    // Card items
    statusSeatOpen: 'SEAT AVAILABLE RIGHT NOW!',
    statusFull: 'Full',
    statusActive: 'Active',
    statusOff: 'Paused',
    seatsEnrolled: 'Enrolled',
    seatsRemaining: 'Remaining',
    lastChecked: 'Last checked',
    justNow: 'Just now',
    btnCheckNow: 'Check Now',
    btnHistory: 'History',
    btnDelete: 'Delete',
    btnPause: 'Pause',
    btnResume: 'Resume',

    // Profile modal
    profileTitle: 'Student Profile',
    profileSubtitle: 'Account settings, language preference, and password management',
    profileName: 'Name:',
    profileEmail: 'Email:',
    profileVerifiedBadge: 'Verified',
    profileCoursesCount: 'Monitored Classes:',
    profileCoursesSuffix: 'Courses',
    profileRegisteredAt: 'Member Since:',
    profileLanguagePref: 'App Language:',
    changePasswordTitle: 'Change Password',
    currentPasswordLabel: 'Current Password',
    currentPasswordPlaceholder: 'Enter current password',
    newPasswordLabel: 'New Password',
    newPasswordPlaceholder: 'At least 4 characters',
    confirmNewPasswordLabel: 'Confirm New Password',
    confirmNewPasswordPlaceholder: 'Re-enter new password',
    btnUpdatePassword: 'Update Password',
    btnUpdatingPassword: 'Updating...',
    confirmDeletePrompt: 'Are you sure?',
    btnConfirmDelete: 'Yes, Delete',
    btnCancel: 'Cancel',
    deleteAccountLink: 'Delete Account',

    // Alerts and Toasts
    passwordUpdatedToast: 'Password Updated',
    passwordUpdatedToastTitle: 'Password Updated',
    passwordUpdatedToastDesc: 'Your password was successfully updated.',
    loggedOutToastTitle: 'Signed Out',
    loggedOutToastDesc: 'You have been signed out.',
    languageChangedToastTitle: 'Language Changed',
    languageChangedToastDesc: 'Application language set to English.',

    // Add CRN & Course Code Modal (EN)
    modalAddTitle: 'Add Class / CRN Tracker',
    modalAddSubtitle: 'Enter CRN or Course Code • Auto-gathered directly from obs.itu.edu.tr',
    tabByCrn: 'Track by Single CRN',
    tabByCourseCode: 'Track by Course Code (All Sections)',
    crnInputLabel: 'Course Reference Number (CRN)',
    crnInputHint: '5-digit code',
    crnPlaceholder: 'Enter 5-digit CRN',
    courseCodeInputLabel: 'Course Code',
    courseCodeInputHint: 'Covers all sections/CRNs',
    courseCodePlaceholder: 'Enter course code (e.g. MAT103E)',
    courseCodeExplanation: 'All sections (CRNs) under this course code in İTÜ OBS will be tracked. You will receive email alerts when any section opens a seat or if a new CRN is opened under this course.',
    quickTestSamples: 'Popular CRN samples:',
    quickCourseSamples: 'Popular course codes:',
    notificationDestination: 'Notification address:',
    deliveryFilterLabel: 'Teaching Delivery Mode / Filter',
    deliveryFilterAll: 'All (In-Person & Online)',
    deliveryFilterFaceToFace: 'In-Person Only',
    deliveryFilterOnline: 'Online Only (Çevrimiçi)',
    deliveryFilterHint: 'Sections with (Çevrimiçi) in their title or method in İTÜ OBS are considered online. New sections will also be checked against this preference.',
    courseGroupLabel: 'Course Code Tracker',
    sectionsCount: 'Sections',
    openSeatsInGroup: 'Open Seats',
    allSectionsFull: 'All Sections Full',
    simulateNewCrnFaceToFace: 'New CRN Opened (In-Person)',
    simulateNewCrnOnline: 'New CRN Opened (Online)',
    mismatchFilterNotice: 'The newly opened section does not match your filter ({filter}); no alert email was dispatched.',
    gatheredFromObs: 'Gathered from İTÜ OBS:',
    instructorLabel: 'Instructor',
    quotaLabel: 'Quota',
    remainingLabel: 'Remaining',
    infoNotice: 'Course title, department, instructor, schedule, and real-time quota are gathered directly from obs.itu.edu.tr using this CRN.',
    infoNoticeCourseCode: 'All sections of this course code in İTÜ OBS will be polled. If a new CRN is opened under this code, you will immediately receive a "New CRN Opened" email alert.',
    btnBrowseObs: 'Browse OBS catalog →',
    btnTrackCrnSubmit: 'Track CRN',
    btnTrackCourseCodeSubmit: 'Track Course & All CRNs',
    gatheringFromObsModal: 'Gathering from İTÜ OBS...',
    errorEnterCrn: 'Please enter a 5-digit CRN code.',
    errorInvalidCrn: 'CRN must be a 5-digit number (e.g. 12486).',
    errorEnterCourseCode: 'Please enter a course code (e.g. CEV103 or MAT103E).',
    errorNoCrnsFoundForCourse: 'No sections found for this course code. Please verify the course code.',
    discoveredCrnsCount: 'sections (CRNs) discovered and ready to track.',
    newCrnEmailNotice: 'A dedicated email alert will be sent immediately if a new CRN opens under this course code.'
  }
};
