# Roadmap: Milestone v1.5 Default Credit Card for Transactions

## Roadmap

**2 phases** | **5 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Database Migration, Types & Server Actions | Veritabanında `is_default` alanını açmak, Sağlam Kart'ı varsayılan yapmak, tip ve sunucu aksiyonlarını hazırlamak | DEF-01, DEF-02 | 2 |
| 2 | Form Defaults, Card View Management & Testing | Harcama ekleme formunda varsayılan kartı seçili getirmek, kart görünümünde varsayılan rozet/butonları eklemek ve testleri tamamlamak | DEF-03, DEF-04, DEF-05 | 3 |

### Phase Details

**Phase 1: Database Migration, Types & Server Actions**
- **Goal:** Veritabanına `is_default` alanını eklemek, Sağlam Kart'ı varsayılan yapmak, `CreditCard` tipini güncellemek ve `setDefaultCreditCard` servisini yazmak.
- **Requirements:** DEF-01, DEF-02
- **Success criteria:**
  1. `supabase/migrations/20260205000003_add_default_credit_card.sql` çalıştırılarak canlı veritabanında `is_default` alanı açılmış ve Sağlam Kart `is_default = true` yapılmış olmalı.
  2. `src/lib/types.ts` ve `src/lib/actions.ts` güncellenmiş, `setDefaultCreditCard` fonksiyonu çalışır durumda olmalı.

**Phase 2: Form Defaults, Card View Management & Testing**
- **Goal:** `TransactionForm` bileşeninde varsayılan ödeme yöntemini Kredi Kartı yapmak ve varsayılan kartı otomatik seçmek; `CreditCardsView` ve `CreditCardModal` içine varsayılan kart yönetimi eklemek; testleri ve derlemeyi doğrulamak.
- **Requirements:** DEF-03, DEF-04, DEF-05
- **Success criteria:**
  1. Yeni harcama formunda doğrudan Kredi Kartı ve Sağlam Kart seçili gelmeli.
  2. Kartlar görünümünde Sağlam Kart'ta `⭐ Varsayılan` rozeti, diğer kartlarda "Varsayılan Yap" butonu çalışmalı.
  3. `tests/defaultCard.test.ts`, canlı DB testi ve `npm run build` hatasız tamamlanmalı.
