# Milestone v1.0 Requirements: Supabase Keep-Alive Automation

## Overview
Supabase'in ücretsiz plandaki projeleri 7 gün inaktivite sonrası duraklatmasını önlemek için Next.js API Route ve Vercel Cron altyapısı kurma gereksinimleri.

## Requirements

### Cron & API Infrastructure

- [x] **CRON-01**: Next.js App Router altında `/api/keep-alive` Route Handler oluşturulmalı ve bu endpoint `likit_transactions` tablosundan tek satırlık bir sorgu (`select('id').limit(1)`) çekerek Supabase veritabanını tetiklemelidir.
- [x] **CRON-02**: Proje kökünde `vercel.json` dosyası oluşturulmalı ve Vercel Cron mekanizması ile günde 1 kez (örn: `0 5 * * *`) `/api/keep-alive` endpoint'i otomatik çağrılacak şekilde tanımlanmalıdır.
- [x] **CRON-03**: Endpoint yanıtı `status 200` ve `{ success: true, timestamp: "..." }` formatında JSON dönmeli, olası veritabanı hatalarında ise `status 500` ile detay döndürmelidir.

## Future Requirements

- **CRON-04**: İsteğe bağlı olarak `CRON_SECRET` header kontrolü ile endpoint'in sadece Vercel Cron ve yetkili çağrılar tarafından tetiklenmesini sağlama.

## Out of Scope

- Üçüncü parti harici cron ve uptime servisleri (Cron-job.org vb. harici hesap gerektiren servisler).
- Supabase ücretli Pro plan aboneliği.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRON-01 | Phase 1 | Completed |
| CRON-02 | Phase 1 | Completed |
| CRON-03 | Phase 1 | Completed |
