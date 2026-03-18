import { supabase } from './supabase';
import type { Week } from '../types';

export const getCurrentWeek = async (): Promise<Week | null> => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .lte('start_date', today)
    .gte('end_date', today)
    .maybeSingle();

  if (error) {
    console.error('Error fetching current week:', error);
    return null;
  }

  return data;
};

export const getOrCreateCurrentWeek = async (): Promise<Week | null> => {
  let currentWeek = await getCurrentWeek();

  if (!currentWeek) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const { data, error } = await supabase
      .from('weeks')
      .insert({
        start_date: startOfWeek.toISOString().split('T')[0],
        end_date: endOfWeek.toISOString().split('T')[0],
        reserved_slots: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating week:', error);
      return null;
    }

    currentWeek = data;
  }

  return currentWeek;
};

export const getNextWeek = async (): Promise<Week | null> => {
  const currentWeek = await getCurrentWeek();

  if (!currentWeek) {
    return null;
  }

  const { data: existingNextWeek } = await supabase
    .from('weeks')
    .select('*')
    .gt('start_date', currentWeek.end_date)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingNextWeek) {
    return existingNextWeek;
  }

  const nextWeekStart = new Date(currentWeek.end_date);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);

  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

  const { data, error } = await supabase
    .from('weeks')
    .insert({
      start_date: nextWeekStart.toISOString().split('T')[0],
      end_date: nextWeekEnd.toISOString().split('T')[0],
      reserved_slots: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating next week:', error);
    return null;
  }

  return data;
};

export const getWeekRequestCount = async (weekId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('week_id', weekId);

  if (error) {
    console.error('Error counting requests:', error);
    return 0;
  }

  return count || 0;
};

export const getAvailableSlots = async (week: Week): Promise<number> => {
  const requestCount = await getWeekRequestCount(week.id);
  return 10 - week.reserved_slots - requestCount;
};

export const uploadFile = async (
  file: File,
  bucket: string,
  path: string
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  return data.path;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
