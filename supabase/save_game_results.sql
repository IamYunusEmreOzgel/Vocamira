-- Run this file once in Supabase SQL Editor.
-- It saves the game summary and every word result in one database transaction.

create or replace function public.save_game_results(p_results jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  result_item jsonb;
  result_word_id integer;
  result_mode text;
  result_is_correct boolean;
  definition_correct_increment integer := 0;
  definition_wrong_increment integer := 0;
  fill_blank_correct_increment integer := 0;
  fill_blank_wrong_increment integer := 0;
  total_question_increment integer := 0;
  correct_increment integer := 0;
  wrong_increment integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication is required to save game results.';
  end if;

  if p_results is null or jsonb_typeof(p_results) <> 'array' then
    raise exception 'p_results must be a JSON array.';
  end if;

  total_question_increment := jsonb_array_length(p_results);

  if total_question_increment = 0 then
    raise exception 'At least one question result is required.';
  end if;

  for result_item in select value from jsonb_array_elements(p_results)
  loop
    result_word_id := (result_item ->> 'wordId')::integer;
    result_mode := result_item ->> 'mode';
    result_is_correct := (result_item ->> 'isCorrect')::boolean;

    if result_word_id is null then
      raise exception 'Every result must contain a valid wordId.';
    end if;

    if result_mode not in ('definition', 'fill-blank') then
      raise exception 'Invalid game mode: %', result_mode;
    end if;

    if result_is_correct then
      correct_increment := correct_increment + 1;

      if result_mode = 'definition' then
        definition_correct_increment := definition_correct_increment + 1;
      else
        fill_blank_correct_increment := fill_blank_correct_increment + 1;
      end if;
    else
      wrong_increment := wrong_increment + 1;

      if result_mode = 'definition' then
        definition_wrong_increment := definition_wrong_increment + 1;
      else
        fill_blank_wrong_increment := fill_blank_wrong_increment + 1;
      end if;
    end if;

    insert into public.user_word_progress (
      user_id,
      word_id,
      definition_correct_count,
      fill_blank_correct_count,
      wrong_count,
      status,
      last_seen_at
    )
    values (
      current_user_id,
      result_word_id,
      case when result_is_correct and result_mode = 'definition' then 1 else 0 end,
      case when result_is_correct and result_mode = 'fill-blank' then 1 else 0 end,
      case when not result_is_correct then 1 else 0 end,
      'learning',
      now()
    )
    on conflict (user_id, word_id)
    do update set
      definition_correct_count = public.user_word_progress.definition_correct_count
        + excluded.definition_correct_count,
      fill_blank_correct_count = public.user_word_progress.fill_blank_correct_count
        + excluded.fill_blank_correct_count,
      wrong_count = public.user_word_progress.wrong_count + excluded.wrong_count,
      last_seen_at = now(),
      status = case
        when (
          public.user_word_progress.wrong_count + excluded.wrong_count >= 2
          and public.user_word_progress.wrong_count + excluded.wrong_count >=
            public.user_word_progress.definition_correct_count
            + excluded.definition_correct_count
            + public.user_word_progress.fill_blank_correct_count
            + excluded.fill_blank_correct_count
        ) then 'difficult'
        when (
          public.user_word_progress.definition_correct_count
            + excluded.definition_correct_count
            + public.user_word_progress.fill_blank_correct_count
            + excluded.fill_blank_correct_count >= 3
          and public.user_word_progress.definition_correct_count
            + excluded.definition_correct_count
            + public.user_word_progress.fill_blank_correct_count
            + excluded.fill_blank_correct_count >
            public.user_word_progress.wrong_count + excluded.wrong_count
        ) then 'learned'
        else 'learning'
      end;
  end loop;

  insert into public.user_stats (
    user_id,
    games_played,
    total_questions,
    correct_answers,
    wrong_answers,
    definition_correct,
    definition_wrong,
    fill_blank_correct,
    fill_blank_wrong,
    updated_at
  )
  values (
    current_user_id,
    1,
    total_question_increment,
    correct_increment,
    wrong_increment,
    definition_correct_increment,
    definition_wrong_increment,
    fill_blank_correct_increment,
    fill_blank_wrong_increment,
    now()
  )
  on conflict (user_id)
  do update set
    games_played = public.user_stats.games_played + 1,
    total_questions = public.user_stats.total_questions + excluded.total_questions,
    correct_answers = public.user_stats.correct_answers + excluded.correct_answers,
    wrong_answers = public.user_stats.wrong_answers + excluded.wrong_answers,
    definition_correct = public.user_stats.definition_correct + excluded.definition_correct,
    definition_wrong = public.user_stats.definition_wrong + excluded.definition_wrong,
    fill_blank_correct = public.user_stats.fill_blank_correct + excluded.fill_blank_correct,
    fill_blank_wrong = public.user_stats.fill_blank_wrong + excluded.fill_blank_wrong,
    updated_at = now();

  return jsonb_build_object(
    'saved', true,
    'questions', total_question_increment,
    'correct', correct_increment,
    'wrong', wrong_increment
  );
end;
$$;

grant execute on function public.save_game_results(jsonb) to authenticated;
revoke execute on function public.save_game_results(jsonb) from anon;
