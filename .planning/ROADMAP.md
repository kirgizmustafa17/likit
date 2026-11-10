# Roadmap: Milestone v1.2 Credit Card Support (Kredi Kartı Desteği)

## Roadmap

**2 phases** | **7 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Database Schema & Calculation Engine | Kredi kartı şemasını oluşturmak, taksit ve ekstre vadelerini kuruş hassasiyetiyle hesaplayan motoru kurmak ve test etmek | CC-01, CC-02, CC-03 | 3 |
| 2 | Credit Card Management & Transaction UI | Kart tanımlama modalı, görsel kartlar görünümü, taksitli harcama formu ve filtreli işlem listesini geliştirmek | CC-04, CC-05, CC-06, CC-07 | 4 |

### Phase Details

**Phase 1: Database Schema & Calculation Engine**
- **Goal:** Veritabanı tablolarını (`likit_credit_cards`, `likit_transactions` ilişkisi) ve matematiksel/tarihsel taksit-vade hesaplama motorunu inşa etmek.
- **Requirements:** CC-01, CC-02, CC-03
- **Success criteria:**
  1. `supabase/migrations/20260205000001_create_likit_credit_cards.sql` idempotent DDL ve RLS politikaları hazır olmalı.
  2. `creditCardUtils.ts` modülü ay uzunlukları, artık yıllar ve kuruş dağıtımı dahil 19 adet birim testiyle doğrulanmalı (`npm test`).

**Phase 2: Credit Card Management & Transaction UI**
- **Goal:** Kullanıcı arayüzünde kredi kartı yönetimini, görsel kartları, taksitli harcama girişini ve kart bazlı filtrelemeyi devreye almak.
- **Requirements:** CC-04, CC-05, CC-06, CC-07
- **Success criteria:**
  1. Kart ekleme/düzenleme (`CreditCardModal`) ve kartlar görünümü (`CreditCardsView`) aktif olmalı.
  2. Harcama formu (`TransactionForm`) kredi kartı seçimi, taksit sayısı ve otomatik vade hesaplama önizlemesi sunmalı.
  3. Dashboard sekmeleri ve işlem listesi rozet/filtre mekanizması Next.js üretim derlemesinde (`npm run build`) hatasız derlenmeli.
