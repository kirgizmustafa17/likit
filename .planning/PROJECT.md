# Likit - Cash Flow Tracker

## What This Is

Likit, Next.js (App Router), Supabase (PostgreSQL), Tailwind CSS ve Recharts kullanılarak geliştirilmiş modern bir nakit akışı ve finansal işlem takip uygulamasıdır. Kullanıcıların gelir ve giderlerini planlamasını, kredi kartı ekstre ve taksitlerini yönetmesini, gerçekleşen işlemleri işaretlemesini ve nakit akışını görselleştirmesini sağlar.

## Core Value

Güvenilir, kesintisiz ve net bir nakit akışı takibi sunmak; hem banka/nakit işlemlerini hem de kredi kartı ekstre/taksit yükümlülüklerini tek bir bütünleşik finansal projeksiyonda doğru tarihlerle göstermek; mobil cihazlarda bağımsız bir yerel uygulama konforunda kullanılabilmek.

## Current Milestone: v1.4 Card Network Badges & Dynamic Card Theming (Kart İsimlerinden Network Etiketleme ve Dinamik Kart Renkleri)

**Goal:** Kart isimlerinde yer alan "Troy", "Visa", "Mastercard" ibarelerinin isimden temizlenmesi, bu ibarelerin kart üzerinde ve işlem listelerinde zarif bir ödeme ağı etiketi/logosu (badge) olarak gösterilmesi ve kart renk/tema sisteminin bu ağ etiketine göre dinamik olarak yapılandırılması.

**Target features:**
- `likit_credit_cards` tablosuna `card_network` desteği ve mevcut 7 kartın veritabanında isimlerinin temizlenip ağlarının atanması
- Kart ağı tespit ve isim temizleme yardımcı fonksiyonları (`detectCardNetwork`, `cleanCardName`)
- Troy (turkuaz/marine), Mastercard (ember/obsidian) ve Visa (royal/gold) dinamik renk temaları ve gradient paletleri
- Vektörel SVG `CardNetworkBadge` bileşeni (kart üzeri kabartma logo, işlem listesi mikro rozet, form seçim hapları)
- `CreditCardModal` içinde akıllı otomatik ağ tespiti, otomatik isim temizleme ve ağ bazlı renk paleti seçimi
- `CreditCardsView`, `TransactionList` ve `TransactionForm` bileşenlerinde ağ rozeti entegrasyonu
- Kapsamlı test paketi (`tests/cardNetwork.test.ts`) ve canlı DB testi

## Requirements

### Validated

- [x] Temel gelir/gider listeleme ve filtreleme
- [x] İşlem ekleme, silme, güncelleme ve tamamlama
- [x] Nakit akışı grafiği (Recharts) ve periyot navigasyonu
- [x] **v1.0**: Supabase Keep-Alive via Vercel Cron (`/api/keep-alive` ve `vercel.json`)
- [x] **v1.1**: Veritabanı temizleme ve migration mimarisini sadeleştirme (`DB-01` .. `DB-04`)
- [x] **v1.2**: Kredi kartı desteği (`CC-01` .. `CC-07`)
- [x] **v1.3**: Android PWA & Native Mobile Experience (`PWA-01` .. `PWA-06`)
- [x] **NET-01**: `likit_credit_cards` tablosuna `card_network` kolonu eklenmeli ve mevcut 7 kartın veritabanındaki isimleri temizlenip ağ değerleri (`troy`, `visa`, `mastercard`) ve temaları atanmalıdır.
- [x] **NET-02**: `src/lib/types.ts` içinde `CardNetwork` tipi tanımlanmalı; `src/lib/creditCardUtils.ts` içinde `detectCardNetwork`, `cleanCardName` ve `NETWORK_THEMES` fonksiyonları geliştirilmeli ve testlerle doğrulanmalıdır.
- [x] **NET-03**: Troy, Visa ve Mastercard için SVG bazlı `CardNetworkBadge` bileşeni geliştirilmeli; `CreditCardsView`, `TransactionList` ve `TransactionForm` bileşenlerine entegre edilmelidir.
- [x] **NET-04**: `CreditCardModal` içinde etkileşimli ağ seçici, kart ismi yazılırken otomatik algılama/temizleme ve ağ bazlı renk paleti seçimi entegre edilmeli; tüm testler (`npm test`) ve `npm run build` hatasız tamamlanmalıdır.

### Active

None (Tüm v1.4 gereksinimleri tamamlandı ve doğrulandı)

### Out of Scope

- Otomatik BIN (ilk 6 hane) sorgulama API entegrasyonu (kullanıcı yalnızca son 4 haneyi girer, kart ağı isimden veya formdaki seçimden belirlenir)

## Context

- **Frontend / Fullstack:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Database:** Supabase (PostgreSQL - Project Ref: `xwggnghdazogaxcmunci`)
- **Deployment:** Vercel
- **Test Runner:** Node.js native test runner (`tsx --test`)
- **Design System:** Impeccable Craft UI, Dark Mode Glassmorphism, Modern Financial Gradient Themes

---
*Last updated: 2026-11-10 after completing Milestone v1.4*
