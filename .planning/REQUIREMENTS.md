# Milestone v1.2 Requirements: Credit Card Support (Kredi Kartı Desteği)

## Overview
Likit uygulamasına çoklu kredi kartı tanımlama, kart limit ve ekstre kesim/son ödeme günleri yönetimi, tek çekim ve taksitli harcamaların otomatik vadeli nakit akışı takvimi olarak işlenmesi yeteneklerinin kazandırılması.

## Requirements

### Data Model & Calculation Engine

- [x] **CC-01**: `likit_credit_cards` tablosu oluşturulmalı, RLS ve anonim erişim izinleri tanımlanmalı, `likit_transactions` tablosuna `card_id`, `purchase_date`, `installment_no`, `total_installments`, `parent_transaction_id` kolonları eklenmelidir.
- [x] **CC-02**: Kartın `cutoff_day` ve `due_day` değerlerine göre harcama tarihinden ekstrenin kesim tarihi ve son ödeme tarihini (vade) hesaplayan, ay uzunluklarını ve artık yılları dikkate alan hesaplama fonksiyonları geliştirilmelidir.
- [x] **CC-03**: Çoklu taksitli harcamalarda toplam tutarı kuruş kaybı olmadan taksitlere paylaştıran (`distributeInstallmentAmounts`) ve ardışık ayların son ödeme tarihlerini oluşturan mantık kurulmalıdır.

### UI & Interaction

- [x] **CC-04**: Kullanıcıların kart ekleyip düzenleyebileceği, renk paleti ve anlık görsel önizleme sunan `CreditCardModal` ve kartların kullanım oranını, borcunu ve vadelerini gösteren `CreditCardsView` bileşenleri eklenmelidir.
- [x] **CC-05**: `TransactionForm` bileşenine "Banka/Nakit" ve "Kredi Kartı" seçim toggle'ı, kart seçici, taksit sayısı (1-12) ve anlık vade/taksit hesaplama önizleme kutusu eklenmelidir.
- [x] **CC-06**: `TransactionList` üzerinde kart harcamalarına kart ismi ve taksit rozeti (`1/3 Taksit`) eklenmeli, ayrıca kart bazlı filtreleme çubuğu sunulmalıdır.
- [x] **CC-07**: `Dashboard` üzerinde "Nakit Akışı" ve "Kredi Kartları" arasında geçiş sağlayan sekme menüsü kurulmalı, kart borçları ve kullanılabilir limit özetleri entegre edilmelidir.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CC-01 | Phase 1 | Completed |
| CC-02 | Phase 1 | Completed |
| CC-03 | Phase 1 | Completed |
| CC-04 | Phase 2 | Completed |
| CC-05 | Phase 2 | Completed |
| CC-06 | Phase 2 | Completed |
| CC-07 | Phase 2 | Completed |
