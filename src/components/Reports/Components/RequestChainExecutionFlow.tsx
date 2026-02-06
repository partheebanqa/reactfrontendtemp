import RequestTimeline from './RequestTimeline';

interface ExtractedVariable {
  key: string;
  value: string | number;
}

interface AssertionResultsMapped {
  actualValue: string;
  category: string;
  description: string;
  field: string;
  responseSize: number;
  responseStatus: number;
  responseTime: number;
  type: string;
  operator: string;
  status: string;
  expectedValue: string;
}

interface RequestStep {
  step: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  name: string;
  url: string;
  statusCode: number;
  responseSize: string;
  duration: string;
  extractedVars: ExtractedVariable[];
  status: 'success' | 'fail' | 'skipped';
  errorMessage?: string;
  requestCurl?: string;
  response?: string;
  substitutedVariables?: {
    name: string;
    value: string;
    usedIn: string;
  }[];
  assertionResults: AssertionResultsMapped[]
}

interface Props {
  steps: RequestStep[];
}

/**
 * Helper: parse "123ms" / "123 ms" / "123" -> 123
 */
const parseDurationMs = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const numeric = value.toString().match(/[\d.]+/);
  return numeric ? Math.round(parseFloat(numeric[0])) : 0;
};

/**
 * Helper: parse "123 B" / "1.25 KB" / "1 KB" -> bytes
 */
const parseSizeBytes = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const str = value.toString().trim();
  if (!str) return 0;

  const match = str.match(/([\d.]+)\s*([KkMmGg]?[Bb])?/);
  if (!match) return 0;

  const amount = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();

  switch (unit) {
    case 'KB':
      return Math.round(amount * 1024);
    case 'MB':
      return Math.round(amount * 1024 * 1024);
    case 'GB':
      return Math.round(amount * 1024 * 1024 * 1024);
    default:
      return Math.round(amount);
  }
};

const mapStatus = (
  status: RequestStep['status']
): 'passed' | 'failed' | 'skipped' => {
  if (status === 'success') return 'passed';
  if (status === 'fail') return 'failed';
  return 'skipped';
};

export default function RequestChainExecutionFlow({ steps }: Props) {

  // console.log(steps, "requests");
  const requests = steps.map((step, index) => {
    return {
      id: String(step.step ?? index + 1),
      order: step.step ?? index + 1,
      method: step.method,
      name: step.name,
      url: step.url,
      status: mapStatus(step.status),
      duration: parseDurationMs(step.duration),
      responseStatusCode: step.statusCode,
      responseSize: parseSizeBytes(step.responseSize),
      requestCurl: step.requestCurl ?? '',
      response: step.response ?? (step.errorMessage || ''),
      substitutedVariables: step.substitutedVariables ?? [],
      extractedVariables:
        step.extractedVars?.map((v) => ({
          name: v.key,
          value: String(v.value),
          usedIn: 'response',
        })) ?? [],
      assertionResults: step?.assertionResults?.map((v) => ({
        status: v.status,
        category: v.category,
        description: v.description,
        field: v.field,
        responseSize: v.responseSize,
        responseStatus: v.responseStatus,
        responseTime: v.responseTime,
        type: v.type,
        actualValue: v.actualValue,
        operator: v.operator,
        expectedValue: v.expectedValue

      })) ?? [],
    };
  });

  return <RequestTimeline requests={requests} />;
}
