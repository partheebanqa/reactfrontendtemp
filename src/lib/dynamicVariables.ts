// Dynamic Variable Generator Functions for API Testing

export interface DynamicVariableGenerator {
  name: string;
  label: string;
  description: string;
  category: 'basic' | 'random' | 'date' | 'auth' | 'network' | 'custom';
  configSchema?: any; // For generators that need configuration
  generate: (config?: any) => string | number | boolean;
}

// Basic Generators
export const basicGenerators: DynamicVariableGenerator[] = [
  {
    name: 'timestamp',
    label: 'Current Timestamp',
    description: 'Generate current Unix timestamp',
    category: 'basic',
    generate: () => Date.now()
  },
  {
    name: 'iso_date',
    label: 'ISO Date',
    description: 'Generate current date in ISO format',
    category: 'date',
    generate: () => new Date().toISOString()
  },
  {
    name: 'date_formatted',
    label: 'Formatted Date',
    description: 'Generate formatted date (YYYY-MM-DD)',
    category: 'date',
    generate: () => new Date().toISOString().split('T')[0]
  }
];

// Random Data Generators
export const randomGenerators: DynamicVariableGenerator[] = [
  {
    name: 'random_uuid',
    label: 'Random UUID',
    description: 'Generate a random UUID v4',
    category: 'random',
    generate: () => crypto.randomUUID()
  },
  {
    name: 'random_string',
    label: 'Random String',
    description: 'Generate random alphanumeric string',
    category: 'random',
    configSchema: {
      length: { type: 'number', default: 10, min: 1, max: 100 }
    },
    generate: (config = { length: 10 }) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < config.length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  },
  {
    name: 'random_int',
    label: 'Random Integer',
    description: 'Generate random integer within range',
    category: 'random',
    configSchema: {
      min: { type: 'number', default: 1 },
      max: { type: 'number', default: 1000 }
    },
    generate: (config = { min: 1, max: 1000 }) => 
      Math.floor(Math.random() * (config.max - config.min + 1)) + config.min
  },
  {
    name: 'random_float',
    label: 'Random Float',
    description: 'Generate random decimal number',
    category: 'random',
    configSchema: {
      min: { type: 'number', default: 0 },
      max: { type: 'number', default: 100 },
      decimals: { type: 'number', default: 2, min: 0, max: 10 }
    },
    generate: (config = { min: 0, max: 100, decimals: 2 }) => {
      const value = Math.random() * (config.max - config.min) + config.min;
      return parseFloat(value.toFixed(config.decimals));
    }
  },
  {
    name: 'random_email',
    label: 'Random Email',
    description: 'Generate random email address',
    category: 'random',
    generate: () => {
      const domains = ['example.com', 'test.com', 'demo.org', 'sample.net'];
      const randomString = Math.random().toString(36).substring(2, 10);
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `${randomString}@${domain}`;
    }
  },
  {
    name: 'random_phone',
    label: 'Random Phone',
    description: 'Generate random phone number',
    category: 'random',
    generate: () => {
      const areaCode = Math.floor(Math.random() * 900) + 100;
      const exchange = Math.floor(Math.random() * 900) + 100;
      const number = Math.floor(Math.random() * 9000) + 1000;
      return `+1-${areaCode}-${exchange}-${number}`;
    }
  },
  {
    name: 'random_boolean',
    label: 'Random Boolean',
    description: 'Generate random true/false value',
    category: 'random',
    generate: () => Math.random() < 0.5
  }
];

// Authentication Generators
export const authGenerators: DynamicVariableGenerator[] = [
  {
    name: 'bearer_token',
    label: 'Bearer Token',
    description: 'Generate random bearer token',
    category: 'auth',
    generate: () => {
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
  },
  {
    name: 'api_key',
    label: 'API Key',
    description: 'Generate random API key',
    category: 'auth',
    configSchema: {
      prefix: { type: 'string', default: 'ak_' },
      length: { type: 'number', default: 32, min: 16, max: 64 }
    },
    generate: (config = { prefix: 'ak_', length: 32 }) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = config.prefix;
      for (let i = 0; i < config.length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  }
];

// Network Generators
export const networkGenerators: DynamicVariableGenerator[] = [
  {
    name: 'random_ip',
    label: 'Random IP Address',
    description: 'Generate random IPv4 address',
    category: 'network',
    generate: () => {
      return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
    }
  },
  {
    name: 'random_port',
    label: 'Random Port',
    description: 'Generate random port number',
    category: 'network',
    generate: () => Math.floor(Math.random() * (65535 - 1024) + 1024)
  }
];

// Date/Time Generators
export const dateGenerators: DynamicVariableGenerator[] = [
  {
    name: 'future_date',
    label: 'Future Date',
    description: 'Generate future date',
    category: 'date',
    configSchema: {
      days: { type: 'number', default: 30, min: 1, max: 365 }
    },
    generate: (config = { days: 30 }) => {
      const date = new Date();
      date.setDate(date.getDate() + config.days);
      return date.toISOString();
    }
  },
  {
    name: 'past_date',
    label: 'Past Date',
    description: 'Generate past date',
    category: 'date',
    configSchema: {
      days: { type: 'number', default: 30, min: 1, max: 365 }
    },
    generate: (config = { days: 30 }) => {
      const date = new Date();
      date.setDate(date.getDate() - config.days);
      return date.toISOString();
    }
  }
];

// All generators combined
export const allGenerators: DynamicVariableGenerator[] = [
  ...basicGenerators,
  ...randomGenerators,
  ...authGenerators,
  ...networkGenerators,
  ...dateGenerators
];

// Get generator by name
export const getGenerator = (name: string): DynamicVariableGenerator | undefined => {
  return allGenerators.find(gen => gen.name === name);
};

// Generate value for a variable
export const generateVariableValue = (generatorName: string, config?: any): any => {
  const generator = getGenerator(generatorName);
  if (!generator) {
    throw new Error(`Unknown generator: ${generatorName}`);
  }
  return generator.generate(config);
};

// Replace variables in text
export const replaceVariables = (text: string, variables: Record<string, any>): string => {
  let result = text;
  
  // Replace static variables first
  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(pattern, String(value));
  });
  
  // Replace dynamic variables
  const dynamicPattern = /{{(\w+)(?:\((.*?)\))?}}/g;
  result = result.replace(dynamicPattern, (match, generatorName, configStr) => {
    try {
      const config = configStr ? JSON.parse(configStr) : undefined;
      return String(generateVariableValue(generatorName, config));
    } catch (error) {
      console.warn(`Failed to generate value for ${generatorName}:`, error);
      return match; // Return original if generation fails
    }
  });
  
  return result;
};

// Parse JSON with variable replacement
export const parseJsonWithVariables = (jsonString: string, variables: Record<string, any>): any => {
  const replacedString = replaceVariables(jsonString, variables);
  try {
    return JSON.parse(replacedString);
  } catch (error) {
    throw new Error(`Invalid JSON after variable replacement: ${error}`);
  }
};