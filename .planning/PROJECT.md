# Likit - Cash Flow Tracker

## What This Is

Likit, Next.js (App Router), Supabase (PostgreSQL), Tailwind CSS ve Recharts kullanılarak geliştirilmiş modern bir nakit akışı ve finansal işlem takip uygulamasıdır. Kullanıcıların gelir ve giderlerini planlamasını, gerçekleşen işlemleri işaretlemesini ve nakit akışını görselleştirmesini sağlar.

## Core Value

Güvenilir, kesintisiz ve net bir nakit akışı takibi sunmak; veritabanının ve uygulamanın her zaman erişilebilir kalmasını sağlamak.

## Current Milestone: v1.0 Supabase Keep-Alive via Vercel Cron

**Goal:** Supabase'in inaktivite nedeniyle projeyi askıya almasını (paused) önlemek için Vercel Cron ve Next.js API Route tabanlı otomatik ping mekanizması kurmak.

**Target features:**
- `/api/keep-alive` Next.js Route Handler oluşturulması (hafif Supabase sorgusu)
- `vercel.json` ile günde 1 kez otomatik tetiklenecek Cron Job yapılandırması
- Endpoint testi ve doğrulama

## Requirements

### Validated

- [x] Temel gelir/gider listeleme ve filtreleme
- [x] İşlem ekleme, silme, güncelleme ve tamamlama
- [x] Nakit akışı grafiği (Recharts) ve periyot navigasyonu

### Active

- [ ] **CRON-01**: `/api/keep-alive` route handler'ı Supabase'e hafif bir sorgu (`select id limit 1`) atmalıdır.
- [ ] **CRON-02**: `vercel.json` içerisinde günde 1 kez (örn. `0 5 * * *`) `/api/keep-alive` yolunu tetikleyen Vercel Cron konfigürasyonu tanımlanmalıdır.
- [ ] **CRON-03**: Endpoint yanıtı ve hata yönetimi düzgün yapılandırılmalı, yerel ve Vercel ortamında test edilmelidir.

### Out of Scope

- Harici ücretli monitor servisleri (Cron-job.org, UptimeRobot vb. harici hesap gerektiren araçlar; her şey repo içinde çözülecek)
- Supabase Pro plana geçiş maliyeti

## Context

- **Frontend / Fullstack:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Kısıt:** Supabase ücretsiz planında 7 gün işlem yapılmazsa proje donduruluyor. Vercel Hobby planında günde 1 cron job ücretsiz sunuluyor.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js API Route + Vercel Cron | Proje halihazırda Vercel üzerinde barındığı için üçüncü parti bir araç veya ek hesap açmadan repo içinde sıfır maliyetle çalışır | ✓ Good |

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
*Last updated: 2026-09-16 after starting Milestone v1.0*
