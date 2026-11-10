# Roadmap: Milestone v1.4 Card Network Badges & Dynamic Card Theming

## Roadmap

**2 phases** | **4 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Database Migration, Types & Utility Helpers | Veritabanında `card_network` alanını açmak, 7 kartı taşımak, tip ve yardımcı fonksiyonları testlerle inşa etmek | NET-01, NET-02 | 2 |
| 2 | Impeccable Badges, Card Theming & UI Integration | Vektörel ağ rozetleri üretmek, görsel kartları ve modalları dinamik renk temalarıyla donatmak | NET-03, NET-04 | 2 |

### Phase Details

**Phase 1: Database Migration, Types & Utility Helpers**
- **Goal:** Veritabanına `card_network` alanını eklemek, mevcut 7 kartın isimlerindeki Troy/Visa/Mastercard ibarelerini temizleyip ağlarını güncellemek, `CardNetwork` tiplerini ve isim temizleme/tema fonksiyonlarını unit testlerle güvenceye almak.
- **Requirements:** NET-01, NET-02
- **Success criteria:**
  1. `supabase/migrations/20260205000002_add_card_network.sql` ve Supabase live DB üzerinde `card_network` kolonu açılmış ve 7 kart güncellenmiş olmalı.
  2. `tests/cardNetwork.test.ts` ile `detectCardNetwork`, `cleanCardName` ve tema fonksiyonları %100 test edilmiş olmalı.

**Phase 2: Impeccable Badges, Card Theming & UI Integration**
- **Goal:** Vektörel `CardNetworkBadge` bileşenini tasarlamak, görsel kartların sağ alt köşesinde rozeti göstermek, kart renklerini ağa göre dinamik renklendirmek, `CreditCardModal`, `CreditCardsView`, `TransactionList` ve `TransactionForm` bileşenlerine entegre etmek.
- **Requirements:** NET-03, NET-04
- **Success criteria:**
  1. Kartların üzerinde, filtre sekmelerinde ve harcama listelerinde zarif ağ rozetleri görünmeli.
  2. Yeni kart eklerken kart ismi yazıldığında otomatik ağ tespiti ve ağ teması uygulanmalı.
  3. `npm test` ve `npm run build` sıfır hatayla tamamlanmalı.
