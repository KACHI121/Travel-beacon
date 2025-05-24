import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "@/integrations/supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fetch data from a Supabase table.
 * @param tableName - The name of the table to fetch data from.
 * @param filters - Optional filters to apply to the query.
 */
export async function fetchFromTable(
  tableName: string,
  filters?: Record<string, any>
) {
  let query = supabase.from(tableName).select("*");

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return null;
  }
  return data;
}

/**
 * Insert data into a Supabase table.
 * @param tableName - The name of the table to insert data into.
 * @param payload - The data to insert.
 */
export async function insertIntoTable(
  tableName: string,
  payload: Record<string, any>
) {
  const { error } = await supabase.from(tableName).insert(payload);
  if (error) {
    console.error(`Error inserting data into ${tableName}:`, error);
    return false;
  }
  return true;
}

/**
 * Update data in a Supabase table.
 * @param tableName - The name of the table to update data in.
 * @param payload - The data to update.
 * @param filters - Filters to identify the rows to update.
 */
export async function updateTable(
  tableName: string,
  payload: Record<string, any>,
  filters: Record<string, any>
) {
  let query = supabase.from(tableName).update(payload);

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { error } = await query;
  if (error) {
    console.error(`Error updating data in ${tableName}:`, error);
    return false;
  }
  return true;
}

/**
 * Delete data from a Supabase table.
 * @param tableName - The name of the table to delete data from.
 * @param filters - Filters to identify the rows to delete.
 */
export async function deleteFromTable(
  tableName: string,
  filters: Record<string, any>
) {
  let query = supabase.from(tableName).delete();

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { error } = await query;
  if (error) {
    console.error(`Error deleting data from ${tableName}:`, error);
    return false;
  }
  return true;
}
