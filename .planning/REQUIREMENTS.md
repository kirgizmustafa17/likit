# Milestone v1.4 Requirements: Card Network Badges & Dynamic Card Theming

## Overview
Kart isimlerinde yer alan "Troy", "Visa" ve "Mastercard" ibarelerinin isimden temizlenmesi, bu ibarelerin kart üzerinde ve işlem listelerinde zarif bir ödeme ağı etiketi/logosu (badge) olarak gösterilmesi ve kart renk/tema sisteminin bu ağ etiketine göre dinamik olarak yapılandırılması.

## Requirements

### Phase 1: Database Migration, Types & Utility Helpers

- [x] **NET-01**: `likit_credit_cards` tablosuna `card_network` kolonu eklenmeli ve mevcut 7 kartın veritabanındaki isimleri temizlenip ağ değerleri (`troy`, `visa`, `mastercard`) ve temaları atanmalıdır.
- [x] **NET-02**: `src/lib/types.ts` içinde `CardNetwork` tipi tanımlanmalı; `src/lib/creditCardUtils.ts` içinde `detectCardNetwork`, `cleanCardName` ve `NETWORK_THEMES` fonksiyonları geliştirilmeli ve testlerle doğrulanmalıdır.

### Phase 2: Impeccable Badges, Card Theming & UI Integration

- [x] **NET-03**: Troy, Visa ve Mastercard için SVG bazlı `CardNetworkBadge` bileşeni geliştirilmeli; `CreditCardsView`, `TransactionList` ve `TransactionForm` bileşenlerine entegre edilmelidir.
- [x] **NET-04**: `CreditCardModal` içinde etkileşimli ağ seçici, kart ismi yazılırken otomatik algılama/temizleme ve ağ bazlı renk paleti seçimi entegre edilmeli; tüm testler (`npm test`) ve `npm run build` hatasız tamamlanmalıdır.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NET-01 | Phase 1 | Completed |
| NET-02 | Phase 1 | Completed |
| NET-03 | Phase 2 | Completed |
| NET-04 | Phase 2 | Completed |
