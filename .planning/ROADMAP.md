# Roadmap: Milestone v1.1 Database Cleanup & Migration Simplification

## Proposed Roadmap

**2 phases** | **4 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Database Restoration & Records Cleanup | Projeyi restore etmek ve geçmiş test verilerini temizlemek | DB-01, DB-02 | 2 |
| 2 | Migration Architecture Simplification | Migration ve şema yapısını modernize ve sade hale getirmek | DB-03, DB-04 | 2 |

### Phase Details

**Phase 1: Database Restoration & Records Cleanup**
- **Goal:** Askıya alınmış Supabase projesini ayağa kaldırmak ve `likit_transactions` tablosundaki eski verileri silmek.
- **Requirements:** DB-01, DB-02
- **Success criteria:**
  1. `xwggnghdazogaxcmunci` projesi `ACTIVE_HEALTHY` durumuna geçmiş olmalı.
  2. `likit_transactions` tablosundaki kayıt sayısı 0 olmalı.

**Phase 2: Migration Architecture Simplification**
- **Goal:** Veritabanı şemasını ve migration adımlarını sade, anlaşılır ve yeniden üretilebilir kılmak.
- **Requirements:** DB-03, DB-04
- **Success criteria:**
  1. Standart `supabase/migrations/` yapısı altında sadeleştirilmiş şema dosyası oluşturulmuş olmalı.
  2. README ve veritabanı kurulum adımları tek adıma indirgenmeli, Next.js derlemesi hatasız çalışmalı.
