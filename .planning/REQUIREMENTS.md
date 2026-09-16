# Milestone v1.1 Requirements: Database Cleanup & Migration Simplification

## Overview
Supabase üzerindeki test/geçmiş kayıtların temizlenmesi, askıdaki projenin uyandırılması ve veritabanı migration süreçlerinin sadeleştirilmesi.

## Requirements

### Database Cleanup & Management

- [x] **DB-01**: Askıda olan `nakit-akisi` (`xwggnghdazogaxcmunci`) Supabase projesi restore edilmeli ve aktif duruma getirilmelidir.
- [x] **DB-02**: `likit_transactions` tablosundaki tüm eski/test veriler temizlenmeli (TRUNCATE), tablo boş ve temiz bir başlangıç durumuna getirilmelidir.
- [x] **DB-03**: Veritabanı şeması ve migration adımları sadeleştirilerek standart `supabase/migrations/` yapısına taşınmalı, idempotent SQL ile kurulum tek adıma indirgenmelidir.
- [x] **DB-04**: Proje dokümantasyonu (README.md) ve SQL dosyaları güncellenmeli, Next.js derleme ve API kontrolleri doğrulanmalıdır.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Completed |
| DB-02 | Phase 1 | Completed |
| DB-03 | Phase 2 | Completed |
| DB-04 | Phase 2 | Completed |
