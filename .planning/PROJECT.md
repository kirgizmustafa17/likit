# Likit - Cash Flow Tracker

## What This Is

Likit, Next.js (App Router), Supabase (PostgreSQL), Tailwind CSS ve Recharts kullanılarak geliştirilmiş modern bir nakit akışı ve finansal işlem takip uygulamasıdır. Kullanıcıların gelir ve giderlerini planlamasını, gerçekleşen işlemleri işaretlemesini ve nakit akışını görselleştirmesini sağlar.

## Core Value

Güvenilir, kesintisiz ve net bir nakit akışı takibi sunmak; veritabanının ve uygulamanın her zaman erişilebilir kalmasını sağlamak.

## Current Milestone: v1.1 Database Cleanup & Migration Simplification

**Goal:** Supabase'deki geçmiş/test kayıtlarını temizlemek, askıdaki veritabanını aktif hale getirmek ve migration/şema yönetim adımlarını tek bir standartta sadeleştirmek.

**Target features:**
- Askıya alınmış Supabase projesini (`nakit-akisi`) restore edip aktif duruma getirmek
- `likit_transactions` tablosundaki geçmiş/test kayıtlarını güvenle temizlemek (truncate/reset)
- Veritabanı şemasını ve migration adımlarını sadeleştirip standart bir yapıya (`supabase/migrations/`) kavuşturmak
- Şema dosyalarını, RLS ve indeksleri modernize etmek

## Requirements

### Validated

- [x] Temel gelir/gider listeleme ve filtreleme
- [x] İşlem ekleme, silme, güncelleme ve tamamlama
- [x] Nakit akışı grafiği (Recharts) ve periyot navigasyonu
- [x] **v1.0**: Supabase Keep-Alive via Vercel Cron (`/api/keep-alive` ve `vercel.json`)

### Active

- [ ] **DB-01**: Askıdaki `nakit-akisi` (`xwggnghdazogaxcmunci`) Supabase projesini restore edip bağlantıyı doğrulamak.
- [ ] **DB-02**: `likit_transactions` tablosundaki eski/test veritabanı kayıtlarını sıfırlamak (TRUNCATE).
- [ ] **DB-03**: Veritabanı şema ve migration adımlarını sadeleştirerek standart bir yapıya dönüştürmek (idempotent DDL, net RLS ve indeksler).
- [ ] **DB-04**: Proje içi veritabanı yönetim adımlarını dokümante edip Next.js uygulamasının ve keep-alive servisinin sorunsuz çalıştığını doğrulamak.

### Out of Scope

- Harici ücretli monitor servisleri (Cron-job.org vb. harici hesap gerektiren servisler)
- Supabase Pro plana geçiş

## Context

- **Frontend / Fullstack:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Database:** Supabase (PostgreSQL - Project Ref: `xwggnghdazogaxcmunci`)
- **Deployment:** Vercel

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js API Route + Vercel Cron | Proje halihazırda Vercel üzerinde barındığı için üçüncü parti bir araç veya ek hesap açmadan repo içinde sıfır maliyetle çalışır | ✓ Good |
| Standart Supabase Migrations Klasörü | Ham dağınık SQL yerine standart `supabase/migrations/` ve sadeleştirilmiş tek kaynak DDL yapısı | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-16 after starting Milestone v1.1*
