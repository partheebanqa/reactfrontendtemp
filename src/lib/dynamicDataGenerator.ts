import { DataVariable, DataVariableType } from '@/shared/types/collection';
import { faker } from '@faker-js/faker';

function generatePassword(length: number, specialChars: string): string {
  const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const chars = alpha + numbers + specialChars;
  
  // Ensure at least one character from each category
  let password = '';
  password += alpha[Math.floor(Math.random() * alpha.length)];
  password += alpha.toUpperCase()[Math.floor(Math.random() * alpha.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest randomly
  while (password.length < length) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function generateDynamicValue(type: DataVariableType, config?: DataVariable['config']): string {
  switch (type) {
    case 'firstName':
      return faker.person.firstName();
    case 'lastName':
      return faker.person.lastName();
    case 'fullName':
      return faker.person.fullName();
    case 'email': {
      const username = faker.string.alphanumeric(10).toLowerCase();
      const domain = faker.internet.domainName();
      return `${username}_aut@${domain}`;
    }
    case 'emailWithDomain': {
      if (config?.emailDomain) {
        const username = faker.string.alphanumeric(10).toLowerCase();
        return `${username}_aut@${config.emailDomain}`;
      }
      const username = faker.string.alphanumeric(10).toLowerCase();
      const domain = faker.internet.domainName();
      return `${username}_aut@${domain}`;
    }
    case 'staticPassword':
      return config?.staticValue || '';
    case 'dynamicPassword':
      return generatePassword(
        config?.passwordLength || 10,
        config?.specialChars || '!@#$%^&*'
      );
    case 'phoneNumber':
      return faker.phone.number();
    case 'date':
      return faker.date.recent().toISOString();
    case 'pastDate':
      return faker.date.past().toISOString();
    case 'futureDate':
      return faker.date.future().toISOString();
    case 'city':
      return faker.location.city();
    case 'state':
      return faker.location.state();
    case 'country':
      return faker.location.country();
    case 'countryCode':
      return faker.location.countryCode();
    case 'zipCode':
      return faker.location.zipCode();
    case 'uuid':
      return faker.string.uuid();
    case 'color':
      return faker.color.rgb();
    case 'url':
      return faker.internet.url();
    case 'ipv4':
      return faker.internet.ipv4();
    case 'ipv6':
      return faker.internet.ipv6();
    case 'number':
      return faker.number.int({ min: 1, max: 1000 }).toString();
    case 'singleDigit':
      return faker.number.int({ min: 0, max: 9 }).toString();
    case 'string':
      return faker.lorem.word();
    case 'boolean':
      return faker.datatype.boolean().toString();
    case 'alphanumeric':
      return faker.string.alphanumeric(10);
    case 'object':
      return JSON.stringify({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email()
      });
    default:
      return '';
  }
}