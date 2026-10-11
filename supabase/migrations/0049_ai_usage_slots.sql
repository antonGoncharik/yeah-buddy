-- Атомарное списание и возврат слотов AI-квоты (без гонки peek/update).

create or replace function public.take_ai_slot(
  p_user_id uuid,
  p_kind text,
  p_used_on date,
  p_limit integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage (user_id, kind, used_on, count)
  values (p_user_id, p_kind, p_used_on, 1)
  on conflict (user_id, kind, used_on) do update
    set count = ai_usage.count + 1
    where ai_usage.count < p_limit
  returning count into new_count;

  return new_count;
end;
$$;

create or replace function public.refund_ai_slot(
  p_user_id uuid,
  p_kind text,
  p_used_on date
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ai_usage
  set count = greatest(count - 1, 0)
  where user_id = p_user_id
    and kind = p_kind
    and used_on = p_used_on;
$$;
