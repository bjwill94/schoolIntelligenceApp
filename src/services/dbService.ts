import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ClassItem } from '../types';
import { createDemoSeedData, getInitialData, saveClassesData } from '../data/seed';

export interface DbSyncStatus {
  state: 'idle' | 'syncing' | 'saved' | 'error';
  lastSyncedAt?: Date;
  error?: string;
}

/**
 * Loads classes for a given user.
 * If Supabase is not configured or user is null, falls back to localStorage.
 */
export async function loadClassesForUser(userId?: string | null): Promise<ClassItem[]> {
  if (!isSupabaseConfigured || !userId) {
    return getInitialData();
  }

  try {
    const { data, error } = await supabase
      .from('user_classes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching classes from Supabase:', error);
      return getInitialData();
    }

    if (!data || data.length === 0) {
      // New user starts with clean slate without pre-seeded mock records
      return [];
    }

    // Map database rows back to ClassItem
    return data.map((row: any) => ({
      id: row.id,
      grade: row.grade,
      section: row.section,
      exams: Array.isArray(row.exams) ? row.exams : [],
    }));
  } catch (err) {
    console.error('Database connection error in loadClassesForUser:', err);
    return getInitialData();
  }
}

/**
 * Saves a single class to Supabase (upsert)
 */
export async function syncClassToSupabase(userId: string, cls: ClassItem): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    const { error } = await supabase.from('user_classes').upsert({
      id: cls.id,
      user_id: userId,
      grade: cls.grade,
      section: cls.section,
      exams: cls.exams,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error upserting class to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in syncClassToSupabase:', err);
    return false;
  }
}

/**
 * Saves all classes to Supabase (batch upsert)
 */
export async function syncAllClassesToSupabase(
  userId: string,
  classes: ClassItem[]
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    const records = classes.map((cls) => ({
      id: cls.id,
      user_id: userId,
      grade: cls.grade,
      section: cls.section,
      exams: cls.exams,
      updated_at: new Date().toISOString(),
    }));

    if (records.length === 0) {
      return true;
    }

    const { error } = await supabase.from('user_classes').upsert(records);
    if (error) {
      console.error('Error batch saving classes:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in syncAllClassesToSupabase:', err);
    return false;
  }
}

/**
 * Deletes a class from Supabase
 */
export async function deleteClassFromSupabase(userId: string, classId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    const { error } = await supabase
      .from('user_classes')
      .delete()
      .eq('id', classId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting class from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in deleteClassFromSupabase:', err);
    return false;
  }
}
