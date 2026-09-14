# DRF فارسی 🇮🇷

پلتفرم آموزشی مستقل و فارسی برای یادگیری **Django REST Framework (DRF)** از مبانی تا مباحث پیشرفته و تولید.

این پروژه یک وب‌اپلیکیشن کاملاً **Static** است و برای اجرا به Backend یا Database نیاز ندارد. محتوای آموزشی در فایل‌های JSON نگهداری می‌شود و با JavaScript در مرورگر بارگذاری و رندر می‌شود.

## ✨ امکانات

- 📚 مسیر آموزشی مرحله‌به‌مرحله برای DRF
- 🔎 جستجوی فارسی و انگلیسی
- ⌨️ جستجو با میانبر `Ctrl + K`
- 🌙 سیستم Theme
- 📊 ذخیره پیشرفت یادگیری در `localStorage`
- 📝 Quiz و Exercise
- 🧪 Labs و پروژه‌های آموزشی
- 🗂️ Cheatsheet
- 📖 FAQ و منابع
- 📝 آزمون نهایی
- 🔗 مسیریابی بدون Backend با URL Hash
- ⚡ Cache و Prefetch محتوای فصل بعد
- 📱 رابط Responsive برای موبایل
- ♿ قابلیت‌های پایه Accessibility
- 💻 نمایش و Highlight کدهای آموزشی
- 🇮🇷 رابط کاربری RTL و فارسی

## 🧱 معماری

پروژه بدون React، Vue، Vite یا Build Step ساخته شده است.

```text
Browser
   │
   ├── index.html
   │
   ├── assets/css/
   │      ├── main.css
   │      ├── themes.css
   │      ├── components.css
   │      └── code.css
   │
   └── assets/js/
          ├── app.js
          ├── router.js
          ├── loader.js
          ├── renderer.js
          ├── search.js
          ├── progress.js
          ├── quiz.js
          ├── exercise.js
          ├── sidebar.js
          ├── toc.js
          ├── theme.js
          ├── codeblocks.js
          └── utils.js

content/
├── manifest.json
├── chapters/
├── labs/
├── projects/
├── cheatsheets/
├── labs-debug/
├── labs-performance/
├── labs-security/
├── faq/
├── exam/
└── resources/
```

## 🛠️ تکنولوژی‌ها

- HTML5
- CSS3
- Vanilla JavaScript (ES Modules)
- JSON
- Browser LocalStorage
- SVG
- Vazirmatn

هیچ Runtime Dependency یا Package Manager برای اجرای نسخه فعلی لازم نیست.

## 🚀 اجرا

### روش ساده

اگر مرورگر اجازه `fetch()` روی فایل‌های محلی را بدهد، می‌توان پروژه را مستقیماً باز کرد؛ با این حال اجرای آن از طریق HTTP Server پیشنهاد می‌شود.

### Python HTTP Server

```bash
python -m http.server 8000
```

سپس:

```text
http://localhost:8000
```

### VS Code

می‌توان پروژه را با Live Server یا هر Static HTTP Server دیگری اجرا کرد.

## 📦 ساختار محتوا

محتوای اصلی در `content/` قرار دارد.

### فصل‌ها

فصل‌ها با الگوی زیر نام‌گذاری شده‌اند:

```text
ch-000-home.json
ch-001-python-for-drf.json
ch-002-django-for-drf.json
...
```

مسیر آموزشی فعلی از مبانی Python و Django شروع می‌شود و به مباحثی مثل:

- HTTP
- API
- REST
- Serializer
- ModelSerializer
- Validation
- Relationships
- Request / Response
- APIView
- Generic Views
- ViewSet
- Router
- Authentication
- JWT
- Permissions
- Filtering
- Search
- Pagination
- File Upload
- Parsers / Renderers
- Exceptions
- Throttling
- Caching
- Versioning
- API Design
- OpenAPI

می‌رسد.

## 🔎 سیستم جستجو

جستجو در سمت Client انجام می‌شود و Index از `content/manifest.json` ساخته می‌شود.

موارد قابل جستجو شامل:

- عنوان
- slug
- توضیح
- tags
- keywords

است.

سیستم Search دارای Ranking، Highlight، Keyboard Navigation و Debounce است.

## 📊 سیستم Progress

پیشرفت کاربر در Browser LocalStorage ذخیره می‌شود.

کلید ذخیره‌سازی:

```text
drf-fa-progress-v1
```

اطلاعاتی مانند موارد زیر نگهداری می‌شود:

- فصل‌های تکمیل‌شده
- Labs تکمیل‌شده
- پروژه‌های تکمیل‌شده
- امتیاز Quizها
- امتیاز آزمون نهایی
- آخرین صفحه بازدیدشده
- زمان شروع و آخرین بروزرسانی

همچنین امکان Export پیشرفت به JSON و Reset کامل وجود دارد.

## 🧭 Routing

Routing با `location.hash` انجام می‌شود.

نمونه مسیرها:

```text
#home
#chapter/serialization
#chapter/ch-013
#lab/01-first-api
#project/01-todo-api
#cheatsheet/http
#cheatsheets
#faq
#exam
#resources
#search?q=serializer
```

این روش باعث می‌شود پروژه بدون Backend نیز قابل Deploy باشد.

## ⚡ Loading و Cache

`loader.js` مسئول بارگذاری JSONها است.

ویژگی‌ها:

- بارگذاری Manifest فقط یک بار
- Cache فایل‌های JSON
- جلوگیری از Fetchهای تکراری
- Prefetch فصل بعدی
- پاک‌سازی Cache در صورت نیاز

## 🖥️ Renderer

`renderer.js` محتوای JSON را به DOM تبدیل می‌کند.

Renderer از Blockهای مختلف آموزشی پشتیبانی می‌کند و مسئول تبدیل ساختار محتوایی به رابط قابل نمایش است.

## 🧩 ماژول‌های JavaScript

| فایل | مسئولیت |
|---|---|
| `app.js` | Bootstrap و اتصال اجزای برنامه |
| `router.js` | Routing و Navigation |
| `loader.js` | Fetch، Cache و Prefetch |
| `renderer.js` | تبدیل Content JSON به DOM |
| `search.js` | Search و Ranking |
| `progress.js` | مدیریت Progress |
| `quiz.js` | Quiz |
| `exercise.js` | Exercise |
| `sidebar.js` | Sidebar و Navigation |
| `toc.js` | Table of Contents و Navigation |
| `theme.js` | مدیریت Theme |
| `codeblocks.js` | نمایش و Highlight کد |
| `utils.js` | توابع عمومی |

## 📁 اضافه کردن فصل جدید

1. یک JSON جدید داخل `content/chapters/` ایجاد کنید.
2. ساختار محتوایی فصل را مطابق فصل‌های موجود قرار دهید.
3. Metadata فصل را به `content/manifest.json` اضافه کنید.
4. در صورت نیاز آن را به `learningPath` اضافه کنید.
5. صفحه را Refresh کنید.

نمونه Metadata:

```json
{
  "id": "ch-053",
  "slug": "testing",
  "title": "Testing در DRF",
  "level": "advanced",
  "difficulty": 4,
  "estimatedMinutes": 45,
  "file": "content/chapters/ch-053-testing.json",
  "tags": ["testing", "pytest", "api"],
  "description": "آموزش تست APIهای Django REST Framework"
}
```

## 🌐 Deployment

چون پروژه Static است، می‌توان آن را روی سرویس‌های Static Hosting اجرا کرد.

گزینه‌های مناسب:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel Static Hosting
- هر Web Server ساده

برای GitHub Pages کافی است فایل‌های پروژه در Repository قرار بگیرند و Pages روی Branch/Folder موردنظر فعال شود.

## ⚠️ نکته درباره Manifest

در نسخه فعلی Repository، فایل‌های زیادی برای Labs، Projects و Cheatsheetها وجود دارند؛ اما آرایه‌های مربوط به بعضی از این بخش‌ها در `content/manifest.json` کامل Populate نشده‌اند.

بنابراین اگر یک بخش در UI خالی نمایش داده شد، ابتدا `manifest.json` را بررسی کنید.

این موضوع با فایل‌های موجود در Repository متفاوت است و باید هنگام توسعه نسخه بعدی اصلاح شود.

## 🎯 هدف پروژه

هدف این پروژه ساخت یک محیط آموزشی فارسی و مستقل برای یادگیری DRF است؛ به‌گونه‌ای که کاربر بتواند:

```text
Python
  ↓
Django
  ↓
Web / HTTP
  ↓
API
  ↓
DRF
  ↓
Serializer
  ↓
Views
  ↓
ViewSets
  ↓
Authentication
  ↓
Permissions
  ↓
Filtering / Pagination
  ↓
Testing / Security / Performance
  ↓
Production
```

را به‌صورت مرحله‌ای یاد بگیرد.

## 📜 مجوز

مجوز پروژه در Repository باید به‌صورت مستقل مشخص شود.

Django و Django REST Framework پروژه‌های متن‌باز جداگانه هستند و این پروژه ادعای مالکیت نسبت به نام‌ها، APIها یا کدهای آن‌ها ندارد.

---

**DRF فارسی — Persian Django REST Framework Learning Platform**
