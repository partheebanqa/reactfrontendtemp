import { DataVariable } from "@/shared/types/collection";
import { generateDynamicValue } from "./dynamicDataGenerator";

export function processVariables(
  text: string,
  variables: Record<string, any>,
  dataRepoVariables: DataVariable[] = []
): string {
  if (!text) return text;

  // Match ${varName} pattern for request chain variables
  const chainPattern = /\${([^}]+)}/g;
  
  // Match ${varName} pattern for data repo variables
  const repoPattern = /\${([^}]+)}/g;
  
  // First replace chain variables
  let processedText = text.replace(chainPattern, (_, varName) => {
    return variables[varName] ?? `\${${varName}}`;
  });

  // Then replace data repo variables
  processedText = processedText.replace(repoPattern, (_, varName) => {
    const repoVar = dataRepoVariables.find(v => v.name === varName);
    if (!repoVar) return `\${${varName}}`;

    // For dynamic variables, generate new value each time
    if (repoVar.isDynamic) {
      const newValue = generateDynamicValue(repoVar.type, repoVar.config);
      
      switch (repoVar.type) {
        case 'number':
          return Number(newValue).toString();
        case 'boolean':
          return newValue.toLowerCase() === 'true' ? 'true' : 'false';
        case 'object':
          try {
            return JSON.stringify(JSON.parse(newValue));
          } catch {
            return newValue;
          }
        default:
          return newValue;
      }
    }

    // For static variables, use stored value
    switch (repoVar.type) {
      case 'number':
        return Number(repoVar.value).toString();
      case 'boolean':
        return repoVar.value.toLowerCase() === 'true' ? 'true' : 'false';
      case 'object':
        try {
          return JSON.stringify(JSON.parse(repoVar.value));
        } catch {
          return repoVar.value;
        }
      default:
        return repoVar.value;
    }
  });

  return processedText;
}