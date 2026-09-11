export { applyProgramPreset } from "@/lib/workout/apply-preset";
export {
  getNextTemplate,
  saveRotation,
  templateAfter,
} from "@/lib/workout/rotation";
export {
  type RotationPatch,
  rotationPatchSchema,
  TemplateNotFoundError,
  type TemplateWriteInput,
  templateWriteSchema,
} from "@/lib/workout/template-schema";
export {
  createTemplate,
  getTemplate,
  listActiveTemplates,
  listTemplates,
  updateTemplate,
} from "@/lib/workout/template-store";
