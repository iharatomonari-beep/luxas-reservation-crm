-- ⑤ オンライン予約の一時オンオフ: online_blocks にスタッフ別ロック用カラムを追加
-- ・staff_id … スタッフ個別のオンライン受付停止（NULL＝従来の店舗/時間帯ブロック）。当日単位で使う。
-- ・profile  … アプリ側ID（staffId=staffのlegacy_id / storeId=店舗code）を往復保持する。
--             online_blocks の mapper は fromRow が ctx を持たず uuid→code/legacy 逆引きできないため、
--             profile に保存して復元する（staff/services と同方式）。
--             ※これにより、多店舗で online_blocks の storeId が往復で失われていた問題も解消する。
-- ・空になり得る列は NULL 許容（room_id事件の教訓）。冪等（再実行安全）。

alter table public.online_blocks add column if not exists staff_id uuid references public.staff(id) on delete cascade;
alter table public.online_blocks add column if not exists profile  jsonb not null default '{}'::jsonb;

create index if not exists idx_online_blocks_staff on public.online_blocks(staff_id);
