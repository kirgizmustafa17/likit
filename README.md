# Likit - Nakit Akışı Takip Uygulaması

Next.js (App Router), Supabase (PostgreSQL), Tailwind CSS ve Recharts ile geliştirilmiş modern nakit akışı ve finansal işlem takip uygulaması.

---

## 🚀 Başlarken

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Ortam Değişkenlerini Tanımlayın
`.env.local` dosyası oluşturarak Supabase bilgilerinizi ekleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

---

## 🗄️ Veritabanı ve Migration Yapısı

Veritabanı migration ve SQL dosyaları standart `supabase/` dizini altında toplanmıştır:

```text
supabase/
├── migrations/
│   └── 20260205000000_create_likit_transactions.sql  # Ana şema, indeksler ve RLS
└── reset-data.sql                                    # Test/geçmiş kayıtları sıfırlama (TRUNCATE)
```

### Şema Kurulumu
1. **Supabase SQL Editor Üzerinden:**
   - `supabase/migrations/20260205000000_create_likit_transactions.sql` dosyasının içeriğini kopyalayıp Supabase panelinizdeki SQL Editor alanına yapıştırın ve **Run** butonuna basın.
   - Script *idempotent* (tekrarlanabilir) yapıdadır; birden fazla çalıştırılsa bile hata vermez.

2. **Supabase CLI ile (Opsiyonel):**
   ```bash
   npx supabase db push
   ```

### Veritabanını Sıfırlama (Verileri Temizleme)
Test veya geçmiş işlem verilerini sıfırlamak için `supabase/reset-data.sql` scriptini SQL Editor'de çalıştırabilirsiniz:
```sql
TRUNCATE TABLE public.likit_transactions;
```

---

## ⏰ Supabase Otomatik Uyandırma (Keep-Alive)

Supabase ücretsiz planında inaktivite nedeniyle projenin askıya alınmasını (paused) önlemek için:
- **Next.js API Route:** `/api/keep-alive` (`src/app/api/keep-alive/route.ts`)
- **Vercel Cron:** Proje kökündeki `vercel.json` dosyası aracılığıyla her gün `05:00 UTC`'de otomatik olarak tetiklenir.
- Vercel'e deploy edildiğinde sıfır konfigürasyonla otomatik devreye girer.

---

## 📦 Üretim Derlemesi (Build)

```bash
npm run build
npm start
```
