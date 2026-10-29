نسخة GitHub Pages + Supabase الحقيقية
=====================================

هذه الحزمة هي التي ترفع إلى GitHub Pages. لا ترفع ملفات Flask القديمة معها.

1) في GitHub احذف من المستودع القديم خصوصاً:
   secret.key
   vouchers_online.db
   app.py
   Dockerfile
   requirements.txt
   requirements-local.txt
   docker-compose*.yml
   RUN_LOCAL.*
   Procfile
   ملفات .env

2) ارفع محتويات هذه الحزمة إلى جذر المستودع:
   index.html
   app.js
   style.css
   supabase-config.js
   .nojekyll
   assets/logo.png
   SUPABASE_SETUP.sql (يمكن إبقاؤه أو حذفه بعد الإعداد)

3) في Supabase > SQL Editor شغّل SUPABASE_SETUP.sql كاملاً.

4) في Supabase > Authentication > Users أنشئ حساب المدير بالبريد وكلمة المرور.

5) في SQL Editor اجعل الحساب مديراً:
   update public.profiles
   set role='admin', display_name='مدير النظام'
   where email='karbala.sewage@gmail.com';

6) من Supabase انسخ:
   Project URL
   Publishable Key
   ثم افتح supabase-config.js في GitHub وضعهما مكان القيم PASTE_...
   لا تضع Secret Key أو service_role في GitHub.

7) GitHub > Repository > Settings > Pages:
   Source = Deploy from a branch
   Branch = main
   Folder = /(root)
   Save

8) Supabase > Authentication > URL Configuration:
   Site URL = رابط GitHub Pages
   Redirect URLs = نفس الرابط مع /* في النهاية عند الحاجة.

9) افتح رابط GitHub Pages وسجل الدخول ببريد المدير وكلمة المرور.

إنشاء مستخدم جديد:
- Supabase > Authentication > Users > Add user.
- سيظهر تلقائياً في صفحة المستخدمين داخل البرنامج بدور Viewer.
- من حساب المدير غيّر دوره إلى Editor أو Admin عند الحاجة.

الصلاحيات:
Admin  : كل شيء + إدارة الأدوار والحالة والاستعادة.
Editor : الشركات والوصولات والتقارير والمخططات.
Viewer : مشاهدة وتقارير ومخططات فقط.

مهم جداً:
إذا كان secret.key الذي رفعته سابقاً يحتوي قيمة حقيقية، اعتبره مكشوفاً ولا تستخدمه مرة أخرى.
