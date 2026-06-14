# DBスキーマ案

## 方針

Supabase PostgreSQLを使用する。v0.1はsingle store前提だが、将来の拡張に備えて主要テーブルは `store_id` を持つ。認証はSupabase Authを利用し、業務データはRLSでログイン済みスタッフに限定する。

## テーブル一覧

### `stores`

- `id uuid primary key`
- `name text not null`
- `business_start time not null`
- `business_end time not null`
- `slot_minutes integer not null default 30`
- `created_at timestamptz not null default now()`

### `staff`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `auth_user_id uuid references auth.users(id)`
- `display_name text not null`
- `role text not null default 'staff'`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`

### `customers`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `name text not null`
- `name_kana text`
- `phone text`
- `email text`
- `birthday date`
- `notes text`
- `alert_note text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `service_menus`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `name text not null`
- `duration_minutes integer not null`
- `price integer`
- `is_active boolean not null default true`

### `booths`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `name text not null`
- `description text`
- `is_active boolean not null default true`

### `staff_shifts`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `staff_id uuid references staff(id)`
- `work_date date not null`
- `start_time time not null`
- `end_time time not null`
- `note text`

### `reservations`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `customer_id uuid references customers(id)`
- `staff_id uuid references staff(id)`
- `booth_id uuid references booths(id)`
- `service_menu_id uuid references service_menus(id)`
- `start_at timestamptz not null`
- `end_at timestamptz not null`
- `status text not null default 'booked'`
- `memo text`
- `created_by uuid references staff(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`status` は `booked`, `arrived`, `completed`, `cancelled`, `no_show` を想定する。

### `karte_entries`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `customer_id uuid references customers(id)`
- `reservation_id uuid references reservations(id)`
- `staff_id uuid references staff(id)`
- `body text not null`
- `created_at timestamptz not null default now()`

## インデックス

- `customers(store_id, name)`
- `customers(store_id, name_kana)`
- `customers(store_id, phone)`
- `reservations(store_id, start_at)`
- `reservations(store_id, staff_id, start_at)`
- `reservations(store_id, booth_id, start_at)`
- `staff_shifts(store_id, staff_id, work_date)`

## 制約・検証

- `reservations.end_at > reservations.start_at`
- 同一スタッフ、同一ブースの重複予約はアプリ側で検知し、必要ならDB制約を追加する。
- `staff_shifts.end_time > staff_shifts.start_time`
- 削除は原則物理削除せず、`is_active` や `status` で扱う。

## RLS方針

v0.1ではログイン済みスタッフのみが単一店舗データを読める。更新は `staff.auth_user_id = auth.uid()` でスタッフとして紐付くユーザーに限定する。管理者ロールが必要になった時点で `role` ベースのポリシーを追加する。
