# Likit - Cash Flow Tracker

## What This Is

Likit, Next.js (App Router), Supabase (PostgreSQL), Tailwind CSS ve Recharts kullanılarak geliştirilmiş modern bir nakit akışı ve finansal işlem takip uygulamasıdır. Kullanıcıların gelir ve giderlerini planlamasını, kredi kartı ekstre ve taksitlerini yönetmesini, gerçekleşen işlemleri işaretlemesini ve nakit akışını görselleştirmesini sağlar.

## Core Value

Güvenilir, kesintisiz ve net bir nakit akışı takibi sunmak; hem banka/nakit işlemlerini hem de kredi kartı ekstre/taksit yükümlülüklerini tek bir bütünleşik finansal projeksiyonda doğru tarihlerle göstermek; mobil cihazlarda bağımsız bir yerel uygulama konforunda kullanılabilmek.

## Current Milestone: v1.5 Default Credit Card for Transactions (Harcamalarda Varsayılan Kredi Kartı Tercihi)

**Goal:** Harcama ekleme işleminde varsayılan ödeme yöntemi olarak kredi kartının seçilmesi, varsayılan kredi kartı seçiminin yapılabilmesi ve başlangıçta Sağlam Kart'ın varsayılan kart olarak ayarlanması.

**Target features:**
- `likit_credit_cards` tablosuna `is_default` kolonu eklenmesi ve canlı veritabanında "Sağlam Kart"ın varsayılan olarak atanması (`DEF-01`)
- TypeScript tipleri ve `actions.ts` üzerinde `setDefaultCreditCard` fonksiyonunun tanımlanması (`DEF-02`)
- `TransactionForm` bileşeninde harcama açıldığında otomatik olarak kredi kartı ve varsayılan kartın seçili gelmesi (`DEF-03`)
- `CreditCardsView` üzerinde varsayılan kart için yıldız rozeti (`⭐ Varsayılan`), diğer kartlarda "Varsayılan Yap" butonu ve `CreditCardModal` içinde varsayılan kart seçeneği (`DEF-04`)
- Birim ve canlı DB testleri ile doğrulama (`DEF-05`)

## Requirements

### Validated

- [x] Temel gelir/gider listeleme ve filtreleme
- [x] İşlem ekleme, silme, güncelleme ve tamamlama
- [x] Nakit akışı grafiği (Recharts) ve periyot navigasyonu
- [x] **v1.0**: Supabase Keep-Alive via Vercel Cron (`/api/keep-alive` ve `vercel.json`)
- [x] **v1.1**: Veritabanı temizleme ve migration mimarisini sadeleştirme (`DB-01` .. `DB-04`)
- [x] **v1.2**: Kredi kartı desteği (`CC-01` .. `CC-07`)
- [x] **v1.3**: Android PWA & Native Mobile Experience (`PWA-01` .. `PWA-06`)
- [x] **v1.4**: Card Network Badges & Dynamic Card Theming (`NET-01` .. `NET-04`)
- [x] **DEF-01**: `likit_credit_cards` tablosuna `is_default BOOLEAN NOT NULL DEFAULT FALSE` kolonu eklendi ve mevcut "Sağlam Kart" varsayılan (`TRUE`) olarak işaretlendi.
- [x] **DEF-02**: `src/lib/types.ts` içinde `is_default` alanı eklendi, `src/lib/actions.ts` içine tek bir kartı varsayılan yapıp diğerlerini sıfırlayan `setDefaultCreditCard` servisi eklendi.
- [x] **DEF-03**: `TransactionForm` yeni harcama modunda açıldığında ödeme yöntemi varsayılan olarak Kredi Kartı ve kart seçimi varsayılan kart (Sağlam Kart) olarak yapılandırıldı.
- [x] **DEF-04**: `CreditCardsView` kart bileşeninde varsayılan rozet (`⭐ Varsayılan`) ve "Varsayılan Yap" aksiyon butonu eklendi, `CreditCardModal` içinde varsayılan kart seçeneği sunuldu.
- [x] **DEF-05**: Tüm işlevler için birim testler (`tests/defaultCard.test.ts`), canlı DB entegrasyon testi ve `npm run build` hatasız doğrulandı.

### Active

None (Tüm v1.5 gereksinimleri tamamlandı ve doğrulandı)

### Out of Scope

- Kullanıcı bazlı çoklu hesap oturumu (uygulama şu anda tek kullanıcılı ve anonim anahtarlı yerel/özel kullanım modelindedir)

## Context

- **Frontend / Fullstack:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Database:** Supabase (PostgreSQL - Project Ref: `xwggnghdazogaxcmunci`)
- **Deployment:** Vercel
- **Test Runner:** Node.js native test runner (`tsx --test`)
- **Design System:** Impeccable Craft UI, Dark Mode Glassmorphism, Modern Financial Gradient Themes

---
*Last updated: 2026-11-11 after completing Milestone v1.5*
