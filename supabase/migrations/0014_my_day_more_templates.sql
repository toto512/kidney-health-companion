-- "My day": more menu tasks and an Afternoon time of day. Requires 0013.
-- The 12 original template keys stay valid so tasks people already saved keep working. Six of them (meal, bed, pillbox, groceries, laundry,
-- appointments) are no longer offered on the menu but remain allowed here. Safe to run more than once.

alter table public.my_day_tasks drop constraint if exists my_day_tasks_template_key_check;
alter table public.my_day_tasks add constraint my_day_tasks_template_key_check check (template_key in (
  'bathroom','wash-dress','breakfast','medicines','blood-pressure','calendar',
  'lunch','water','walk','chore','mail',
  'rest','social','afternoon-medicines',
  'dinner','evening-medicines','call',
  'night-medicines','walkways','clothes',
  'meal','bed','pillbox','groceries','laundry','appointments'
));

alter table public.my_day_tasks drop constraint if exists my_day_tasks_time_of_day_check;
alter table public.my_day_tasks add constraint my_day_tasks_time_of_day_check check (time_of_day in ('morning','midday','afternoon','evening','bedtime'));
