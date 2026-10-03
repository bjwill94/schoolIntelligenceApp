import { supabase } from '../lib/supabase';
import { ClassItem } from '../types';

/**
 * All signed-in staff share one set of classes. Each row's `updated_at` (set by a
 * database trigger) acts as a version token: an update only succeeds if the row
 * hasn't changed since we loaded it, so one teacher can't silently overwrite
 * another teacher's edits.
 */
export interface ClassRecord {
  cls: ClassItem;
  version: string;
}

export type SaveResult =
  | { status: 'saved'; version: string }
  | { status: 'conflict' }
  | { status: 'error' };

const TABLE = 'classes';
const COLUMNS = 'id, grade, section, exams, updated_at';

function rowToRecord(row: any): ClassRecord {
  return {
    cls: {
      id: row.id,
      grade: row.grade,
      section: row.section,
      exams: Array.isArray(row.exams) ? row.exams : [],
    },
    version: row.updated_at,
  };
}

/** Loads every class in the school. Throws on failure so callers never fall back to local data. */
export async function loadAllClasses(): Promise<ClassRecord[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(rowToRecord);
}

/** Returns the latest copy of one class, or null if it no longer exists. */
export async function fetchClass(classId: string): Promise<ClassRecord | null> {
  const { data, error } = await supabase.from(TABLE).select(COLUMNS).eq('id', classId).maybeSingle();

  if (error) throw error;
  return data ? rowToRecord(data) : null;
}

export async function insertClass(cls: ClassItem): Promise<SaveResult> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ id: cls.id, grade: cls.grade, section: cls.section, exams: cls.exams })
      .select('updated_at')
      .single();

    if (error) {
      console.error('Error inserting class:', error);
      return { status: 'error' };
    }
    return { status: 'saved', version: data.updated_at };
  } catch (err) {
    console.error('Exception in insertClass:', err);
    return { status: 'error' };
  }
}

/** Updates a class only if it still has the version we last saw. */
export async function updateClass(cls: ClassItem, expectedVersion: string): Promise<SaveResult> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ grade: cls.grade, section: cls.section, exams: cls.exams })
      .eq('id', cls.id)
      .eq('updated_at', expectedVersion)
      .select('updated_at');

    if (error) {
      console.error('Error updating class:', error);
      return { status: 'error' };
    }
    if (!data || data.length === 0) return { status: 'conflict' };
    return { status: 'saved', version: data[0].updated_at };
  } catch (err) {
    console.error('Exception in updateClass:', err);
    return { status: 'error' };
  }
}

export async function deleteClass(classId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLE).delete().eq('id', classId);
    if (error) {
      console.error('Error deleting class:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in deleteClass:', err);
    return false;
  }
}
