import {
  parsePlannerDocumentImport,
  validatePlannerDocumentImport,
  type PlannerDocumentImportResult,
  type PlannerImportValidationResult,
} from "../model";

function parsePlannerImportText(text: string): unknown {
  return JSON.parse(text);
}

function validationFailure(message: string): PlannerImportValidationResult {
  return { valid: false, errors: [message] };
}

export function parsePlannerDocumentImportText(text: string): PlannerDocumentImportResult {
  try {
    return parsePlannerDocumentImport(parsePlannerImportText(text));
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "Invalid planner import JSON."],
    };
  }
}

export async function parsePlannerDocumentImportFile(file: File): Promise<PlannerDocumentImportResult> {
  return parsePlannerDocumentImportText(await file.text());
}

export function parsePlannerDocumentImportValue(value: unknown): PlannerDocumentImportResult {
  return parsePlannerDocumentImport(value);
}

export function validatePlannerDocumentImportText(text: string): PlannerImportValidationResult {
  try {
    return validatePlannerDocumentImport(parsePlannerImportText(text));
  } catch (error) {
    return validationFailure(error instanceof Error ? error.message : "Invalid planner import JSON.");
  }
}

export function validatePlannerDocumentImportValue(value: unknown): PlannerImportValidationResult {
  return validatePlannerDocumentImport(value);
}
