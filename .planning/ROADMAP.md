# Roadmap: Milestone v1.0 Supabase Keep-Alive

## Proposed Roadmap

**1 phase** | **3 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Supabase Keep-Alive via Vercel Cron | Vercel Cron ve Next.js API route entegrasyonu ile Supabase'in uykuya geçmesini önlemek | CRON-01, CRON-02, CRON-03 | 3 |

### Phase Details

**Phase 1: Supabase Keep-Alive via Vercel Cron**
- **Goal:** Vercel Cron ve Next.js API Route entegrasyonu ile Supabase veritabanına periyodik hafif sorgu göndererek projenin askıya alınmasını kalıcı olarak önlemek.
- **Requirements:** CRON-01, CRON-02, CRON-03
- **Success criteria:**
  1. `src/app/api/keep-alive/route.ts` dosyası oluşturulmuş ve `likit_transactions` tablosuna hafif sorgu atan Route Handler yazılmış olmalı.
  2. Kök dizinde `vercel.json` oluşturulmuş ve her gün `/api/keep-alive` endpoint'ini çalıştıran Vercel Cron konfigürasyonu tanımlanmış olmalı.
  3. `npm run build` veya route testi hatasız geçmeli, Next.js derleme kontrolü başarılı olmalı.
