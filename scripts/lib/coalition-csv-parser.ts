/**
 * Coalition CSV Parser
 *
 * Parses coalition-members.csv and extracts MK data
 * for historical comment collection.
 */

import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

export interface CoalitionMK {
  mkId: number;
  nameHebrew: string;
  faction: string;
  position: string;
  xAccount: string | null;
  phone: string;
  email: string;
  profileUrl: string;
}

/**
 * Parse coalition CSV file
 */
export function parseCoalitionCSV(filePath: string): CoalitionMK[] {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');

    // Remove BOM if present
    const cleanContent = csvContent.replace(/^\uFEFF/, '');

    const records = parse(cleanContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    return records.map((record: any) => ({
      mkId: parseInt(record.MK_ID, 10),
      nameHebrew: record.Name_Hebrew,
      faction: record.Faction,
      position: record.Position,
      xAccount: record.X_Account || null,
      phone: record.Phone,
      email: record.Email,
      profileUrl: record.Profile_URL,
    }));
  } catch (error) {
    console.error('Error parsing coalition CSV:', error);
    throw new Error(`Failed to parse coalition CSV: ${error}`);
  }
}

/**
 * Get coalition CSV path
 */
export function getCoalitionCSVPath(): string {
  return path.join(process.cwd(), 'docs/mk-coalition/coalition-members.csv');
}

/**
 * Load all coalition members
 */
export function loadCoalitionMembers(): CoalitionMK[] {
  const csvPath = getCoalitionCSVPath();
  return parseCoalitionCSV(csvPath);
}

/**
 * Get single MK by ID
 */
export function getMKById(mkId: number, members?: CoalitionMK[]): CoalitionMK | null {
  const allMembers = members || loadCoalitionMembers();
  return allMembers.find(mk => mk.mkId === mkId) || null;
}

/**
 * Get MKs by faction
 */
export function getMKsByFaction(faction: string, members?: CoalitionMK[]): CoalitionMK[] {
  const allMembers = members || loadCoalitionMembers();
  return allMembers.filter(mk => mk.faction === faction);
}

/**
 * Get all unique factions
 */
export function getAllFactions(members?: CoalitionMK[]): string[] {
  const allMembers = members || loadCoalitionMembers();
  const factions = new Set(allMembers.map(mk => mk.faction));
  return Array.from(factions);
}
