# Likit - Cash Flow Tracker

## What This Is

Likit, Next.js (App Router), Supabase (PostgreSQL), Tailwind CSS ve Recharts kullanılarak geliştirilmiş modern bir nakit akışı ve finansal işlem takip uygulamasıdır. Kullanıcıların gelir ve giderlerini planlamasını, kredi kartı ekstre ve taksitlerini yönetmesini, gerçekleşen işlemleri işaretlemesini ve nakit akışını görselleştirmesini sağlar.

## Core Value

Güvenilir, kesintisiz ve net bir nakit akışı takibi sunmak; hem banka/nakit işlemlerini hem de kredi kartı ekstre/taksit yükümlülüklerini tek bir bütünleşik finansal projeksiyonda doğru tarihlerle göstermek.

## Current Milestone: v1.2 Credit Card Support (Kredi Kartı Desteği)

**Goal:** Kullanıcıların kredi kartlarını tanımlayabilmesi, tek çekim ve taksitli harcamalarını kartın hesap kesim ve son ödeme günlerine göre otomatik taksitlendirip nakit akışı grafiğine yansıtabilmesi.

**Target features:**
- `likit_credit_cards` tablosu, CRUD işlemleri ve kart özeti hesaplama
- `likit_transactions` tablosuna `card_id`, `purchase_date`, taksit alanlarının eklenmesi
- Çoklu kredi kartı ekleme, limit ve kesim/son ödeme günleri yönetimi
- Harcama formunda kredi kartı seçimi, taksit sayısı (1-12) ve anlık son ödeme/taksit projeksiyonu
- İşlem listesinde kredi kartı ve taksit etiketleri, kart bazlı filtreleme
- Kredi kartları sekmesi ile görsel kartlar, kullanılabilir limit çubuğu ve yaklaşan vadeler

## Requirements

### Validated

- [x] Temel gelir/gider listeleme ve filtreleme
- [x] İşlem ekleme, silme, güncelleme ve tamamlama
- [x] Nakit akışı grafiği (Recharts) ve periyot navigasyonu
- [x] **v1.0**: Supabase Keep-Alive via Vercel Cron (`/api/keep-alive` ve `vercel.json`)
- [x] **v1.1**: Veritabanı temizleme ve migration mimarisini sadeleştirme (`DB-01` .. `DB-04`)
- [x] **CC-01**: `likit_credit_cards` tablosu, indeksleri, RLS ve `likit_transactions` ilişkisi
- [x] **CC-02**: Hesap kesim ve son ödeme günü hesaplama ve kuruş hassasiyetli taksit bölüştürme motoru (`creditCardUtils`)
- [x] **CC-03**: Kredi kartı CRUD işlemleri (`actions.ts`) ve görsel kart yönetimi modalı (`CreditCardModal.tsx`)
- [x] **CC-04**: Harcama formunda kredi kartı desteği, taksit seçimi ve otomatik son ödeme tarihi hesaplama (`TransactionForm.tsx`)
- [x] **CC-05**: Görsel kartlar görünümü (`CreditCardsView.tsx`), kart borcu/limiti hesaplama ve işlem listesi kart filtreleme

### Active

None (Tüm v1.2 gereksinimleri tamamlandı ve doğrulandı)

### Out of Scope

- Banka API'leri ile otomatik ekstre senkronizasyonu (Open Banking entegrasyonu)
- Kredi kartı asgari tutar faiz simülasyonu

## Context

- **Frontend / Fullstack:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Database:** Supabase (PostgreSQL - Project Ref: `xwggnghdazogaxcmunci`)
- **Deployment:** Vercel
- **Test Runner:** Node.js native test runner (`tsx --test`)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Son Ödeme Tarihi Odaklı Nakit Akışı | Kredi kartı harcaması yapıldığı gün değil, ekstrenin son ödeme tarihinde nakit hesaptan çıkar. Nakit akışı grafiğinde vadenin esas alınması projeksiyon doğruluğunu sağlar. | ✓ Good |
| Kuruş Hassasiyetli Taksit Bölüştürme | 1000 TL / 3 taksit gibi bölmelerde kuruş kaybı önlenerek toplam tutarın birebir tutması sağlandı. | ✓ Good |
| Soft Delete Kart Silme | Kart silindiğinde geçmiş taksit ve işlem kayıtlarının bozulmaması için `is_active: false` soft-delete uygulandı. | ✓ Good |
| Bağımsız Sekmeli Dashboard | Nakit akışı ve Kredi Kartları arasında kolay geçiş sağlayan şık sekme tasarımı uygulandı. | ✓ Good |

---
*Last updated: 2026-11-10 after completing Milestone v1.2*
