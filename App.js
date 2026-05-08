// رابط السيرفر
const BASE_URL = 'https://semischool.onrender.com';

// متغيرات النظام
let currentUserId = localStorage.getItem('userId') || null;
let currentUserToken = localStorage.getItem('userToken') || null;
let currentProfileData = null;

// العناصر البرمجية واجهات المستخدم
const sections = document.querySelectorAll('.app-section');
const navLinks = document.querySelectorAll('.nav-link');
const navLoginBtn = document.getElementById('nav-login-btn');
const navSignupBtn = document.getElementById('nav-signup-btn');
const navDashboardBtn = document.getElementById('nav-dashboard-btn');
const logoutBtn = document.getElementById('logout-btn');
const mobileMenuToggle = document.getElementById('mobile-menu');
const navLinksContainer = document.querySelector('.nav-links');

// بدء التشغيل
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupAuthForms();
  setupDashboardEdit();
  checkAuthStatus();
});

// دالة إظهار التنبيهات المنبثقة
function showToast(message, isError = false) {
  const toast = document.getElementById('toast-notification');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  toastMsg.textContent = message;
  if (isError) {
    toastIcon.className = 'fa-solid fa-circle-exclamation error';
  } else {
    toastIcon.className = 'fa-solid fa-circle-check';
  }

  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// دالة التنقل بين الصفحات
function showSection(sectionId) {
  sections.forEach(section => {
    if (section.id === sectionId) {
      section.classList.add('active');
    } else {
      section.classList.remove('active');
    }
  });

  // تحديث الرابط النشط في القائمة
  navLinks.forEach(link => {
    if (link.getAttribute('data-target') === sectionId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // إغلاق القائمة الجانبية للموبايل
  navLinksContainer.classList.remove('show');

  // جلب البيانات عند الدخول للوحة التحكم
  if (sectionId === 'dashboard-section' && currentUserId) {
    fetchUserProfile(currentUserId);
  }
}

// إعداد أحداث التنقل
function setupNavigation() {
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      showSection(target);
    });
  });

  mobileMenuToggle.addEventListener('click', () => {
    navLinksContainer.classList.toggle('show');
  });

  logoutBtn.addEventListener('click', () => {
    handleLogout();
  });

  document.getElementById('nav-logo').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('home-section');
  });
}

// التحقق من حالة تسجيل الدخول
function checkAuthStatus() {
  if (currentUserId) {
    // إظهار أزرار التحكم وإخفاء التسجيل
    navLoginBtn.classList.add('hidden');
    navSignupBtn.classList.add('hidden');
    navDashboardBtn.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    showSection('dashboard-section');
    // إظهار أزرار التسجيل وإخفاء التحكم
    navLoginBtn.classList.remove('hidden');
    navSignupBtn.classList.remove('hidden');
    navDashboardBtn.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    showSection('home-section');
  }
}

// التحكم في النماذج (تسجيل الدخول وإنشاء الحساب)
function setupAuthForms() {
  // نموذج تسجيل الدخول
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const submitBtn = document.getElementById('login-submit');
    toggleLoading(submitBtn, true);

    try {
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'خطأ في عملية تسجيل الدخول');
      }

      // نجاح تسجيل الدخول
      showToast('تم تسجيل الدخول بنجاح! مرحباً بك 👋');
      
      // حفظ بيانات الهوية والتوكن
      const token = data.token || (data.access_token ? `${data.prefix_user || ''} ${data.access_token}` : null);
      const userId = data.user?._id || data._id || data.user?.id || data.id;

      if (token) {
        localStorage.setItem('userToken', token);
        currentUserToken = token;
      }
      if (userId) {
        localStorage.setItem('userId', userId);
        currentUserId = userId;
      }

      checkAuthStatus();
    } catch (error) {
      showToast(error.message, true);
    } finally {
      toggleLoading(submitBtn, false);
    }
  });

  // نموذج إنشاء الحساب
  const signupForm = document.getElementById('signup-form');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fName = document.getElementById('signup-fname').value.trim();
    const lName = document.getElementById('signup-lname').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const cPassword = document.getElementById('signup-cpassword').value;
    const gender = document.getElementById('signup-gender').value;
    const grade = document.getElementById('signup-grade').value.trim();
    // تحويل حقول المواد والهوايات لمصفوفات
    const subjectsRaw = document.getElementById('signup-subjects').value;
    const hobbiesRaw = document.getElementById('signup-hobbies').value;

    const subjects = subjectsRaw ? subjectsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
    const hobbies = hobbiesRaw ? hobbiesRaw.split(',').map(h => h.trim()).filter(Boolean) : [];

    if (password !== cPassword) {
      showToast('كلمات المرور غير متطابقة!', true);
      return;
    }

    const payload = { fName, lName, email, password, cPassword, gender, grade, subjects, hobbies };
    const submitBtn = document.getElementById('signup-submit');
    toggleLoading(submitBtn, true);

    try {
      const response = await fetch(`${BASE_URL}/user/signUp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل في إنشاء الحساب');
      }

      showToast('تم إنشاء الحساب بنجاح! قم بتسجيل الدخول الآن 🎓');
      signupForm.reset();
      showSection('login-section');
    } catch (error) {
      showToast(error.message, true);
    } finally {
      toggleLoading(submitBtn, false);
    }
  });
}

// جلب بيانات ملف المستخدم من السيرفر
async function fetchUserProfile(userId) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (currentUserToken) {
      headers['authentication'] = currentUserToken;
    }

    const response = await fetch(`${BASE_URL}/user/profile/${userId}`, {
      method: 'GET',
      headers: headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'فشل جلب بيانات الملف الشخصي');
    }

    const user = data.user || data;
    currentProfileData = user;
    renderUserProfile(user);
  } catch (error) {
    showToast(error.message, true);
  }
}

// عرض بيانات المستخدم في الواجهة
function renderUserProfile(user) {
  document.getElementById('profile-fullname').textContent = `${user.fName || ''} ${user.lName || ''}`;
  document.getElementById('profile-email-text').textContent = user.email || '';
  document.getElementById('profile-grade-badge').textContent = `الصف الدراسي: ${user.grade || '-'}`;
  document.getElementById('profile-avatar').textContent = user.fName ? user.fName[0].toUpperCase() : 'U';

  document.getElementById('profile-fname-val').textContent = user.fName || '-';
  document.getElementById('profile-lname-val').textContent = user.lName || '-';
  document.getElementById('profile-gender-val').textContent = user.gender === 'male' ? 'ذكر' : 'أنثى';

  // عرض المواد الدراسية
  const subjectsContainer = document.getElementById('profile-subjects-tags');
  subjectsContainer.innerHTML = '';
  if (user.subjects && user.subjects.length > 0) {
    user.subjects.forEach(subject => {
      const tag = document.createElement('span');
      tag.className = 'tag-item';
      tag.textContent = subject;
      subjectsContainer.appendChild(tag);
    });
  } else {
    subjectsContainer.innerHTML = '<span class="text-muted">لا توجد مواد دراسية مسجلة</span>';
  }

  // عرض الهوايات
  const hobbiesContainer = document.getElementById('profile-hobbies-tags');
  hobbiesContainer.innerHTML = '';
  if (user.hobbies && user.hobbies.length > 0) {
    user.hobbies.forEach(hobby => {
      const tag = document.createElement('span');
      tag.className = 'tag-item hobby';
      tag.textContent = hobby;
      hobbiesContainer.appendChild(tag);
    });
  } else {
    hobbiesContainer.innerHTML = '<span class="text-muted">لا توجد هوايات مسجلة</span>';
  }
}

// تعديل بيانات المستخدم
function setupDashboardEdit() {
  const editCard = document.getElementById('edit-profile-card');
  const editBtn = document.getElementById('edit-profile-btn');
  const cancelBtn = document.getElementById('edit-cancel-btn');
  const editForm = document.getElementById('edit-profile-form');

  // إظهار نموذج التعديل
  editBtn.addEventListener('click', () => {
    if (currentProfileData) {
      document.getElementById('edit-fname').value = currentProfileData.fName || '';
      document.getElementById('edit-grade').value = currentProfileData.grade || '';
      document.getElementById('edit-email').value = currentProfileData.email || '';
    }
    editCard.classList.toggle('hidden');
    editCard.scrollIntoView({ behavior: 'smooth' });
  });

  cancelBtn.addEventListener('click', () => {
    editCard.classList.add('hidden');
  });

  // إرسال التعديلات الجديدة للسيرفر
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fName = document.getElementById('edit-fname').value.trim();
    const grade = document.getElementById('edit-grade').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const oldPassword = document.getElementById('edit-old-password').value;
    const newPassword = document.getElementById('edit-new-password').value;

    const payload = { fName, grade, email };

    // تضمين كلمات المرور إذا تم إدخالها
    if (oldPassword && newPassword) {
      payload.oldPassword = oldPassword;
      payload.newPassword = newPassword;
    }

    const submitBtn = document.getElementById('edit-submit');
    toggleLoading(submitBtn, true);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (currentUserToken) {
        headers['authentication'] = currentUserToken;
      }

      const response = await fetch(`${BASE_URL}/user/updateProfile`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل في تعديل البيانات');
      }

      showToast('تم تحديث البيانات بنجاح! ✨');
      editCard.classList.add('hidden');
      editForm.reset();

      // تحديث البيانات المعروضة مجدداً
      if (currentUserId) {
        fetchUserProfile(currentUserId);
      }
    } catch (error) {
      showToast(error.message, true);
    } finally {
      toggleLoading(submitBtn, false);
    }
  });
}

// دالة تسجيل الخروج
function handleLogout() {
  localStorage.removeItem('userId');
  localStorage.removeItem('userToken');
  currentUserId = null;
  currentUserToken = null;
  currentProfileData = null;
  showToast('تم تسجيل الخروج بنجاح. نراك لاحقاً!');
  checkAuthStatus();
}

// دالة لتفعيل/تعطيل حالة التحميل في الأزرار
function toggleLoading(button, isLoading) {
  const textSpan = button.querySelector('.btn-text');
  const spinner = button.querySelector('.spinner');

  if (isLoading) {
    button.disabled = true;
    if (textSpan) textSpan.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
  } else {
    button.disabled = false;
    if (textSpan) textSpan.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
  }
}
