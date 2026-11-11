# Milestone v1.5 Requirements: Default Credit Card for Transactions

## Overview
Harcama ekleme işleminde varsayılan ödeme yöntemi olarak kredi kartının seçilmesi, varsayılan kredi kartı seçiminin yapılabilmesi ve başlangıçta Sağlam Kart'ın varsayılan kart olarak ayarlanması.

## Requirements

### Phase 1: Database Migration, Types & Server Actions
- [x] **DEF-01**: `likit_credit_cards` tablosuna `is_default BOOLEAN NOT NULL DEFAULT FALSE` kolonu eklenmeli ve mevcut "Sağlam Kart" varsayılan (`TRUE`) olarak işaretlenmelidir.
- [x] **DEF-02**: `src/lib/types.ts` içinde `is_default` alanı eklenmeli, `src/lib/actions.ts` içine `setDefaultCreditCard` servisi eklenmelidir.

### Phase 2: Form Defaults, Card View Management & Testing
- [x] **DEF-03**: `TransactionForm` yeni harcama modunda açıldığında ödeme yöntemi varsayılan olarak Kredi Kartı ve kart seçimi varsayılan kart olmalıdır.
- [x] **DEF-04**: `CreditCardsView` kart bileşeninde varsayılan rozet (`⭐ Varsayılan`) ve "Varsayılan Yap" aksiyon butonu eklenmeli, `CreditCardModal` içinde varsayılan kart seçeneği sunulmalıdır.
- [x] **DEF-05**: Tüm işlevler için birim testler (`tests/defaultCard.test.ts`), canlı DB entegrasyon testi ve `npm run build` doğrulanmalıdır.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEF-01 | Phase 1 | Completed |
| DEF-02 | Phase 1 | Completed |
| DEF-03 | Phase 2 | Completed |
| DEF-04 | Phase 2 | Completed |
| DEF-05 | Phase 2 | Completed |
