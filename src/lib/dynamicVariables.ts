// Dynamic Variable Generator Functions for API Testing

export interface DynamicVariableGenerator {
  name: string;
  label: string;
  description: string;
  category:
    | 'basic'
    | 'random'
    | 'date'
    | 'auth'
    | 'network'
    | 'custom'
    | 'personal'
    | 'internet'
    | 'datetime'
    | 'location'
    | 'financial';
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
    generate: () => Date.now(),
  },
  {
    name: 'iso_date',
    label: 'ISO Date',
    description: 'Generate current date in ISO format',
    category: 'date',
    generate: () => new Date().toISOString(),
  },
  {
    name: 'date_formatted',
    label: 'Formatted Date',
    description: 'Generate formatted date (YYYY-MM-DD)',
    category: 'date',
    generate: () => new Date().toISOString().split('T')[0],
  },
];

// Random Data Generators
export const randomGenerators: DynamicVariableGenerator[] = [
  {
    name: 'random_uuid',
    label: 'Random UUID',
    description: 'Generate a random UUID v4',
    category: 'random',
    generate: () => crypto.randomUUID(),
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
    },
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
    },
  },
  {
    name: 'random_boolean',
    label: 'Random Boolean',
    description: 'Generate random true/false value',
    category: 'random',
    generate: () => Math.random() < 0.5,
  },
  {
    name: 'random_float',
    label: 'Random Float',
    description: 'Generate random decimal number',
    category: 'random',
    configSchema: {
      min: { type: 'number', default: 0 },
      max: { type: 'number', default: 100 },
      decimals: { type: 'number', default: 2, min: 0, max: 10 },
    },
    generate: (config = { min: 0, max: 100, decimals: 2 }) => {
      const value = Math.random() * (config.max - config.min) + config.min;
      return Number.parseFloat(value.toFixed(config.decimals));
    },
  },
];

// Custom Generators (Your Backend API Generators)
export const customGenerators: DynamicVariableGenerator[] = [
  {
    name: 'randomInteger',
    label: 'Random Integer',
    description: 'Generate random integer within range',
    category: 'custom',
    configSchema: {
      min: { type: 'number', default: 1 },
      max: { type: 'number', default: 1000 },
    },
    generate: (config = { min: 1, max: 1000 }) =>
      Math.floor(Math.random() * (config.max - config.min + 1)) + config.min,
  },
  {
    name: 'randomString',
    label: 'Random String',
    description: 'Generate random alphanumeric string',
    category: 'custom',
    configSchema: {
      length: { type: 'number', default: 10, min: 1, max: 100 },
    },
    generate: (config = { length: 10 }) => {
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < config.length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
  },
  {
    name: 'randomAlphaNumeric',
    label: 'Alphanumeric String',
    description: 'Generate random alphanumeric string',
    category: 'custom',
    configSchema: {
      length: { type: 'number', default: 10, min: 1, max: 100 },
    },
    generate: (config = { length: 10 }) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < config.length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
  },
  {
    name: 'password',
    label: 'Password',
    description: 'Generate secure password with custom options',
    category: 'custom',
    configSchema: {
      length: { type: 'number', default: 12, min: 4, max: 128 },
      includeUpper: { type: 'boolean', default: true },
      includeLower: { type: 'boolean', default: true },
      includeDigit: { type: 'boolean', default: true },
      includeSpecial: { type: 'boolean', default: true },
    },
    generate: (
      config = {
        length: 12,
        includeUpper: true,
        includeLower: true,
        includeDigit: true,
        includeSpecial: true,
      }
    ) => {
      let chars = '';
      if (config.includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (config.includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (config.includeDigit) chars += '0123456789';
      if (config.includeSpecial) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

      if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz'; // fallback

      let result = '';
      for (let i = 0; i < config.length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
  },
  {
    name: 'bearerToken',
    label: 'Bearer Token',
    description: 'Generate random bearer token',
    category: 'custom',
    configSchema: {
      length: { type: 'number', default: 32, min: 16, max: 128 },
    },
    generate: (config = { length: 32 }) => {
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < config.length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
  },
  {
    name: 'price',
    label: 'Price',
    description: 'Generate random price within range',
    category: 'custom',
    configSchema: {
      min: { type: 'number', default: 1 },
      max: { type: 'number', default: 1000 },
    },
    generate: (config = { min: 1, max: 1000 }) => {
      const value = Math.random() * (config.max - config.min) + config.min;
      return Number.parseFloat(value.toFixed(2));
    },
  },
  {
    name: 'emailWithDomain',
    label: 'Email with Domain',
    description: 'Generate email with specific domain',
    category: 'custom',
    configSchema: {
      domain: { type: 'string', default: 'example.com' },
    },
    generate: (config = { domain: 'example.com' }) => {
      const randomString = Math.random().toString(36).substring(2, 10);
      return `${randomString}@${config.domain}`;
    },
  },
  {
    name: 'randomDate',
    label: 'Random Date',
    description: 'Generate random date in specified format',
    category: 'custom',
    configSchema: {
      format: { type: 'string', default: 'YYYY-MM-DD' },
    },
    generate: (config = { format: 'YYYY-MM-DD' }) => {
      const start = new Date(2020, 0, 1);
      const end = new Date();
      const randomDate = new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );

      if (config.format === 'YYYY-MM-DD') {
        return randomDate.toISOString().split('T')[0];
      } else if (config.format === 'ISO') {
        return randomDate.toISOString();
      } else {
        return randomDate.toLocaleDateString();
      }
    },
  },
  {
    name: 'pastDate',
    label: 'Past Date',
    description: 'Generate past date within specified years',
    category: 'custom',
    configSchema: {
      format: { type: 'string', default: 'YYYY-MM-DD' },
      years: { type: 'number', default: 1, min: 1, max: 10 },
    },
    generate: (config = { format: 'YYYY-MM-DD', years: 1 }) => {
      const date = new Date();
      const pastDate = new Date(
        date.getFullYear() - config.years,
        date.getMonth(),
        date.getDate()
      );
      const randomPastDate = new Date(
        pastDate.getTime() +
          Math.random() * (date.getTime() - pastDate.getTime())
      );

      if (config.format === 'YYYY-MM-DD') {
        return randomPastDate.toISOString().split('T')[0];
      } else if (config.format === 'ISO') {
        return randomPastDate.toISOString();
      } else {
        return randomPastDate.toLocaleDateString();
      }
    },
  },
  {
    name: 'futureDate',
    label: 'Future Date',
    description: 'Generate future date within specified years',
    category: 'custom',
    configSchema: {
      format: { type: 'string', default: 'YYYY-MM-DD' },
      years: { type: 'number', default: 1, min: 1, max: 10 },
    },
    generate: (config = { format: 'YYYY-MM-DD', years: 1 }) => {
      const date = new Date();
      const futureDate = new Date(
        date.getFullYear() + config.years,
        date.getMonth(),
        date.getDate()
      );
      const randomFutureDate = new Date(
        date.getTime() + Math.random() * (futureDate.getTime() - date.getTime())
      );

      if (config.format === 'YYYY-MM-DD') {
        return randomFutureDate.toISOString().split('T')[0];
      } else if (config.format === 'ISO') {
        return randomFutureDate.toISOString();
      } else {
        return randomFutureDate.toLocaleDateString();
      }
    },
  },
];

// Personal Data Generators
export const personalGenerators: DynamicVariableGenerator[] = [
  {
    name: 'name',
    label: 'Full Name',
    description: 'Generate random full name',
    category: 'personal',
    generate: () => {
      const firstNames = [
        'John',
        'Jane',
        'Michael',
        'Sarah',
        'David',
        'Emily',
        'James',
        'Jessica',
        'Robert',
        'Ashley',
      ];
      const lastNames = [
        'Smith',
        'Johnson',
        'Williams',
        'Brown',
        'Jones',
        'Garcia',
        'Miller',
        'Davis',
        'Rodriguez',
        'Martinez',
      ];
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      return `${firstName} ${lastName}`;
    },
  },
  {
    name: 'firstName',
    label: 'First Name',
    description: 'Generate random first name',
    category: 'personal',
    generate: () => {
      const names = [
        'John',
        'Jane',
        'Michael',
        'Sarah',
        'David',
        'Emily',
        'James',
        'Jessica',
        'Robert',
        'Ashley',
        'Christopher',
        'Amanda',
        'Matthew',
        'Stephanie',
        'Anthony',
      ];
      return names[Math.floor(Math.random() * names.length)];
    },
  },
  {
    name: 'lastName',
    label: 'Last Name',
    description: 'Generate random last name',
    category: 'personal',
    generate: () => {
      const names = [
        'Smith',
        'Johnson',
        'Williams',
        'Brown',
        'Jones',
        'Garcia',
        'Miller',
        'Davis',
        'Rodriguez',
        'Martinez',
        'Hernandez',
        'Lopez',
        'Gonzalez',
        'Wilson',
        'Anderson',
      ];
      return names[Math.floor(Math.random() * names.length)];
    },
  },
  {
    name: 'gender',
    label: 'Gender',
    description: 'Generate random gender',
    category: 'personal',
    generate: () => {
      const genders = ['Male', 'Female', 'Non-binary', 'Other'];
      return genders[Math.floor(Math.random() * genders.length)];
    },
  },
  {
    name: 'ssn',
    label: 'SSN',
    description: 'Generate random Social Security Number',
    category: 'personal',
    generate: () => {
      const area = Math.floor(Math.random() * 899) + 100;
      const group = Math.floor(Math.random() * 99) + 1;
      const serial = Math.floor(Math.random() * 9999) + 1;
      return `${area}-${group.toString().padStart(2, '0')}-${serial
        .toString()
        .padStart(4, '0')}`;
    },
  },
  {
    name: 'email',
    label: 'Email Address',
    description: 'Generate random email address',
    category: 'personal',
    generate: () => {
      const domains = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'test.com',
      ];
      const randomString = Math.random().toString(36).substring(2, 10);
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `${randomString}@${domain}`;
    },
  },
  {
    name: 'phone',
    label: 'Phone Number',
    description: 'Generate random phone number',
    category: 'personal',
    generate: () => {
      const areaCode = Math.floor(Math.random() * 900) + 100;
      const exchange = Math.floor(Math.random() * 900) + 100;
      const number = Math.floor(Math.random() * 9000) + 1000;
      return `(${areaCode}) ${exchange}-${number}`;
    },
  },
  {
    name: 'username',
    label: 'Username',
    description: 'Generate random username',
    category: 'personal',
    generate: () => {
      const adjectives = [
        'cool',
        'awesome',
        'swift',
        'brave',
        'smart',
        'quick',
        'happy',
        'lucky',
      ];
      const nouns = [
        'tiger',
        'eagle',
        'wolf',
        'lion',
        'shark',
        'falcon',
        'bear',
        'hawk',
      ];
      const adjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const number = Math.floor(Math.random() * 999) + 1;
      return `${adjective}${noun}${number}`;
    },
  },
];

// Internet Generators
export const internetGenerators: DynamicVariableGenerator[] = [
  {
    name: 'domain',
    label: 'Domain Name',
    description: 'Generate random domain name',
    category: 'internet',
    generate: () => {
      const words = [
        'tech',
        'web',
        'digital',
        'online',
        'cyber',
        'net',
        'data',
        'cloud',
        'smart',
        'fast',
      ];
      const tlds = [
        '.com',
        '.org',
        '.net',
        '.io',
        '.co',
        '.tech',
        '.app',
        '.dev',
      ];
      const word = words[Math.floor(Math.random() * words.length)];
      const tld = tlds[Math.floor(Math.random() * tlds.length)];
      const number = Math.floor(Math.random() * 99) + 1;
      return `${word}${number}${tld}`;
    },
  },
  {
    name: 'url',
    label: 'URL',
    description: 'Generate random URL',
    category: 'internet',
    generate: () => {
      const protocols = ['https', 'http'];
      const subdomains = ['www', 'api', 'app', 'portal'];
      const domains = ['example.com', 'test.org', 'demo.net', 'sample.io'];
      const paths = [
        '/home',
        '/about',
        '/contact',
        '/api/v1',
        '/dashboard',
        '/profile',
      ];

      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const subdomain =
        Math.random() > 0.5
          ? subdomains[Math.floor(Math.random() * subdomains.length)] + '.'
          : '';
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const path =
        Math.random() > 0.5
          ? paths[Math.floor(Math.random() * paths.length)]
          : '';

      return `${protocol}://${subdomain}${domain}${path}`;
    },
  },
  {
    name: 'ipv4',
    label: 'IPv4 Address',
    description: 'Generate random IPv4 address',
    category: 'internet',
    generate: () => {
      return Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 256)
      ).join('.');
    },
  },
  {
    name: 'uuid',
    label: 'UUID',
    description: 'Generate random UUID',
    category: 'internet',
    generate: () => crypto.randomUUID(),
  },
  {
    name: 'boolean',
    label: 'Boolean',
    description: 'Generate random boolean value',
    category: 'internet',
    generate: () => Math.random() < 0.5,
  },
];

// DateTime Generators
export const datetimeGenerators: DynamicVariableGenerator[] = [
  {
    name: 'date',
    label: 'Date',
    description: 'Generate random date',
    category: 'datetime',
    generate: () => {
      const start = new Date(2020, 0, 1);
      const end = new Date();
      const randomDate = new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );
      return randomDate.toISOString().split('T')[0];
    },
  },
  {
    name: 'month',
    label: 'Month',
    description: 'Generate random month name',
    category: 'datetime',
    generate: () => {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return months[Math.floor(Math.random() * months.length)];
    },
  },
  {
    name: 'year',
    label: 'Year',
    description: 'Generate random year',
    category: 'datetime',
    generate: () => {
      const currentYear = new Date().getFullYear();
      return Math.floor(Math.random() * (currentYear - 1990 + 1)) + 1990;
    },
  },
];

// Location Generators
export const locationGenerators: DynamicVariableGenerator[] = [
  {
    name: 'address',
    label: 'Address',
    description: 'Generate random street address',
    category: 'location',
    generate: () => {
      const numbers = Math.floor(Math.random() * 9999) + 1;
      const streets = [
        'Main St',
        'Oak Ave',
        'First St',
        'Second Ave',
        'Park Rd',
        'Washington Blvd',
        'Lincoln Way',
        'Maple Dr',
        'Elm St',
        'Cedar Ave',
      ];
      const street = streets[Math.floor(Math.random() * streets.length)];
      return `${numbers} ${street}`;
    },
  },
  {
    name: 'city',
    label: 'City',
    description: 'Generate random city name',
    category: 'location',
    generate: () => {
      const cities = [
        'New York',
        'Los Angeles',
        'Chicago',
        'Houston',
        'Phoenix',
        'Philadelphia',
        'San Antonio',
        'San Diego',
        'Dallas',
        'San Jose',
        'Austin',
        'Jacksonville',
        'Fort Worth',
        'Columbus',
        'Charlotte',
      ];
      return cities[Math.floor(Math.random() * cities.length)];
    },
  },
  {
    name: 'state',
    label: 'State',
    description: 'Generate random state name',
    category: 'location',
    generate: () => {
      const states = [
        'California',
        'Texas',
        'Florida',
        'New York',
        'Pennsylvania',
        'Illinois',
        'Ohio',
        'Georgia',
        'North Carolina',
        'Michigan',
        'New Jersey',
        'Virginia',
        'Washington',
        'Arizona',
        'Massachusetts',
      ];
      return states[Math.floor(Math.random() * states.length)];
    },
  },
  {
    name: 'country',
    label: 'Country',
    description: 'Generate random country name',
    category: 'location',
    generate: () => {
      const countries = [
        'United States',
        'Canada',
        'Mexico',
        'United Kingdom',
        'Germany',
        'France',
        'Italy',
        'Spain',
        'Japan',
        'Australia',
        'Brazil',
        'India',
        'China',
        'South Korea',
        'Netherlands',
      ];
      return countries[Math.floor(Math.random() * countries.length)];
    },
  },
  {
    name: 'zip',
    label: 'ZIP Code',
    description: 'Generate random ZIP code',
    category: 'location',
    generate: () => {
      const zip5 = Math.floor(Math.random() * 90000) + 10000;
      const zip4 = Math.floor(Math.random() * 9000) + 1000;
      return Math.random() > 0.5 ? zip5.toString() : `${zip5}-${zip4}`;
    },
  },
  {
    name: 'latitude',
    label: 'Latitude',
    description: 'Generate random latitude coordinate',
    category: 'location',
    generate: () => {
      return Number((Math.random() * 180 - 90).toFixed(6));
    },
  },
  {
    name: 'longitude',
    label: 'Longitude',
    description: 'Generate random longitude coordinate',
    category: 'location',
    generate: () => {
      return Number((Math.random() * 360 - 180).toFixed(6));
    },
  },
];

// Financial Generators
export const financialGenerators: DynamicVariableGenerator[] = [
  {
    name: 'creditCard',
    label: 'Credit Card',
    description: 'Generate random credit card with expiry and CVV',
    category: 'financial',
    generate: () => {
      // Generate a Visa-like number (starts with 4)
      const cardNumber =
        '4' +
        Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join(
          ''
        );
      const month = Math.floor(Math.random() * 12) + 1;
      const year = new Date().getFullYear() + Math.floor(Math.random() * 5) + 1;
      const cvv = Math.floor(Math.random() * 900) + 100;
      const cardTypes = ['Visa', 'MasterCard', 'American Express', 'Discover'];
      const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];

      return `${cardNumber.replace(/(.{4})/g, '$1 ').trim()} ${month
        .toString()
        .padStart(2, '0')}/${year.toString().slice(-2)}/${cvv} ${cardType}`;
    },
  },
  {
    name: 'creditCardNumber',
    label: 'Credit Card Number',
    description: 'Generate random credit card number',
    category: 'financial',
    generate: () => {
      // Generate a Visa-like number (starts with 4)
      const cardNumber =
        '4' +
        Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join(
          ''
        );
      return cardNumber.replace(/(.{4})/g, '$1 ').trim();
    },
  },
  {
    name: 'creditCardExp',
    label: 'Credit Card Expiry',
    description: 'Generate random credit card expiry date',
    category: 'financial',
    generate: () => {
      const month = Math.floor(Math.random() * 12) + 1;
      const year = new Date().getFullYear() + Math.floor(Math.random() * 5) + 1;
      return `${month.toString().padStart(2, '0')}/${year
        .toString()
        .slice(-2)}`;
    },
  },
  {
    name: 'currency',
    label: 'Currency',
    description: 'Generate random currency code',
    category: 'financial',
    generate: () => {
      const currencies = [
        'USD',
        'EUR',
        'GBP',
        'JPY',
        'CAD',
        'AUD',
        'CHF',
        'CNY',
        'SEK',
        'NZD',
        'MXN',
        'SGD',
        'HKD',
        'NOK',
        'TRY',
      ];
      return currencies[Math.floor(Math.random() * currencies.length)];
    },
  },
];

// Authentication Generators
export const authGenerators: DynamicVariableGenerator[] = [
  {
    name: 'bearer_token',
    label: 'Bearer Token',
    description: 'Generate random bearer token (legacy)',
    category: 'auth',
    generate: () => {
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      return Array.from(randomBytes, (byte) =>
        byte.toString(16).padStart(2, '0')
      ).join('');
    },
  },
  {
    name: 'api_key',
    label: 'API Key',
    description: 'Generate random API key',
    category: 'auth',
    configSchema: {
      prefix: { type: 'string', default: 'ak_' },
      length: { type: 'number', default: 32, min: 16, max: 64 },
    },
    generate: (config = { prefix: 'ak_', length: 32 }) => {
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = config.prefix;
      for (let i = 0; i < config.length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
  },
];

// Network Generators
export const networkGenerators: DynamicVariableGenerator[] = [
  {
    name: 'random_ip',
    label: 'Random IP Address',
    description: 'Generate random IPv4 address',
    category: 'network',
    generate: () => {
      return Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 256)
      ).join('.');
    },
  },
  {
    name: 'random_port',
    label: 'Random Port',
    description: 'Generate random port number',
    category: 'network',
    generate: () => Math.floor(Math.random() * (65535 - 1024) + 1024),
  },
];

// Date/Time Generators
export const dateGenerators: DynamicVariableGenerator[] = [
  {
    name: 'future_date',
    label: 'Future Date (Legacy)',
    description: 'Generate future date',
    category: 'date',
    configSchema: {
      days: { type: 'number', default: 30, min: 1, max: 365 },
    },
    generate: (config = { days: 30 }) => {
      const date = new Date();
      date.setDate(date.getDate() + config.days);
      return date.toISOString();
    },
  },
  {
    name: 'past_date',
    label: 'Past Date (Legacy)',
    description: 'Generate past date',
    category: 'date',
    configSchema: {
      days: { type: 'number', default: 30, min: 1, max: 365 },
    },
    generate: (config = { days: 30 }) => {
      const date = new Date();
      date.setDate(date.getDate() - config.days);
      return date.toISOString();
    },
  },
];

// All generators combined
export const allGenerators: DynamicVariableGenerator[] = [
  ...basicGenerators,
  ...randomGenerators,
  ...customGenerators,
  ...personalGenerators,
  ...internetGenerators,
  ...datetimeGenerators,
  ...locationGenerators,
  ...financialGenerators,
  ...authGenerators,
  ...networkGenerators,
  ...dateGenerators,
];

// Get generator by name
export const getGenerator = (
  name: string
): DynamicVariableGenerator | undefined => {
  return allGenerators.find((gen) => gen.name === name);
};

// Generate value for a variable
export const generateVariableValue = (
  generatorName: string,
  config?: any
): any => {
  const generator = getGenerator(generatorName);
  if (!generator) {
    throw new Error(`Unknown generator: ${generatorName}`);
  }
  return generator.generate(config);
};

// Replace variables in text
export const replaceVariables = (
  text: string,
  variables: Record<string, any>
): string => {
  let result = text;

  // Replace static variables first
  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(pattern, String(value));
  });

  // Replace dynamic variables
  const dynamicPattern = /{{(\w+)(?:$$(.*?)$$)?}}/g;
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
export const parseJsonWithVariables = (
  jsonString: string,
  variables: Record<string, any>
): any => {
  const replacedString = replaceVariables(jsonString, variables);
  try {
    return JSON.parse(replacedString);
  } catch (error) {
    throw new Error(`Invalid JSON after variable replacement: ${error}`);
  }
};
