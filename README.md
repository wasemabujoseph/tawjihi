# محاكي توجيهي 2026

نظام امتحانات إلكتروني للتوجيهي الأردني - بسيط وسريع التجهيز

## الهيكل

```
tawjihi-simulator/
├── index.html          # الواجهة الأمامية
├── Code.gs             # Google Apps Script - Backend
├── appsscript.json     # إعدادات Apps Script
└── README.md           # هذا الملف
```

## المتطلبات

- حساب Google
- متصفح حديث

## خطوات الإعداد

### 1) إنشاء Google Sheet

1. افتح [Google Sheets](https://sheets.new)
2. سمِّه: `Tawjihi2026DB`
3. من القائمة: **Extensions → Apps Script**

### 2) إعداد Google Apps Script

1. في محرر Apps Script، الصق محتوى ملف `Code.gs`
2. أنشئ ملف جديد: **+ → Script** وسمِّه `appsscript.json`
3. الصق محتوى ملف `appsscript.json`
4. احفظ المشروع: **Ctrl+S**

### 3) نشر Web App

1. اضغط **Deploy → New deployment**
2. اختر **Type: Web app**
3. الإعدادات:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. اضغط **Deploy** وانسخ الرابط

### 4) تعديل index.html

افتح `index.html` وابحث عن هذا السطر:

```javascript
API_BASE: "PUT_YOUR_APPS_SCRIPT_WEBAPP_URL_HERE",
```

استبدله بالرابط الذي نسخته من Apps Script:

```javascript
API_BASE: "https://script.google.com/macros/s/XXXXXXXX/exec",
```

### 5) رفع الموقع

ارفع ملف `index.html` إلى:
- **GitHub Pages**
- **Netlify**
- **أي استضافة ثابتة**

## مثال على JSON الامتحان

```json
{
  "subject": "كيمياء - نموذج 1",
  "duration": 7200,
  "questions": [
    {
      "id": 1,
      "text": "ما قيمة $pH$ لمحلول متعادل؟",
      "options": ["5", "6", "7", "8"],
      "correctIndex": 2,
      "explanation": "المحلول المتعادل عند 25°C يكون $pH = 7$."
    },
    {
      "id": 2,
      "text": "الصيغة الكيميائية للماء هي:",
      "options": ["$H_2O$", "$CO_2$", "$NaCl$", "$O_2$"],
      "correctIndex": 0,
      "explanation": "الماء يتكون من ذرتي هيدروجين وذرة أكسجين."
    }
  ],
  "openQuestions": [
    {
      "id": "oq1",
      "prompt": "اشرح آلية تكوّن الرابطة التساهمية.",
      "idealAnswer": "تنشأ الرابطة التساهمية من تشارك الذرات بأزواج إلكترونية لتحقيق الاستقرار.",
      "explanation": "يُراعى تعريف الرابطة وذكر مفهوم مشاركة الإلكترونات والاستقرار."
    }
  ]
}
```

## المميزات

- ✅ دخول بالاسم فقط
- ✅ أسئلة اختيار من متعدد مع تصحيح فوري
- ✅ أسئلة مقالية مع إجابات نموذجية
- ✅ مؤقت زمني للامتحان
- ✅ حفظ النتائج في Google Sheets
- ✅ تتبع نقاط الضعف
- ✅ لوحة إدارة لرفع الامتحانات
- ✅ دعم KaTeX للصيغ الرياضية
- ✅ وضع داكن/فاتح
- ✅ متجاوب مع الجوال

## كلمة مرور الأدمن

الافتراضية: `admin`

يمكن تغييرها في ملف `Code.gs`:

```javascript
const ADMIN_PASSWORD = 'admin';
```

وكذلك في `index.html`:

```javascript
ADMIN_PASSWORD: "admin",
```

## ملاحظات أمان

⚠️ هذا النظام مصمم للاستخدام **المغلق/الخاص**. كلمة مرور الأدمن ظاهرة في كود الواجهة.

للاستخدام العام، يُنصح بنقل التحقق من كلمة المرور بالكامل إلى Apps Script.

## الترخيص

مشروع مفتوح المصدر للاستخدام الشخصي والتعليمي.
