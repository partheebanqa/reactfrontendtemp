import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ContactFormData, ContactFormErrors } from '@/shared/types/contact';
import { submitContactForm } from '@/lib/contactService';
import { validateContactForm } from '@/utils/validation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

// Custom form field components that handle errors
const FormField = ({ 
  label, 
  error, 
  children 
}: { 
  label?: string; 
  error?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-purple-200 mb-1">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'AT', label: 'Austria' }
];

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  country: '',
  company: '',
  message: '',
  subscribe: false
};

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const { locationData, isLoading: isLocationLoading } = useGeolocation();

  const mutation = useMutation({
    mutationFn: submitContactForm,
    onSuccess: () => {
      setSubmitted(true);
      setFormData(initialFormData);
      setErrors({});
    },
    onError: (error) => {
      console.error('Submission failed:', error);
    }
  });

  // Auto-set country when location is detected
  React.useEffect(() => {
    if (locationData && !locationDetected && !formData.country) {
      const detectedCountry = countries.find(
        country => country.value === locationData.countryCode
      );
      
      if (detectedCountry) {
        setFormData(prev => ({
          ...prev,
          country: detectedCountry.value
        }));
        setLocationDetected(true);
      }
    }
  }, [locationData, locationDetected, formData.country]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof ContactFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateContactForm(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    mutation.mutate(formData);
  };

  if (submitted && !mutation.error) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="mx-auto text-green-400" size={64} />
        <h3 className="text-2xl font-bold text-cyan-100">Thank You!</h3>
        <p className="text-purple-200">
          Your message has been sent successfully. We'll get back to you soon!
        </p>
        <Button 
          onClick={() => setSubmitted(false)}
          variant="secondary"
          className="mt-6"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField error={errors.name}>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter your full name"
            autoComplete="name"
            className={errors.name ? "border-red-500" : ""}
          />
        </FormField>
        
        <FormField error={errors.email}>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="Enter your email address"
            autoComplete="email"
            className={errors.email ? "border-red-500" : ""}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField error={errors.phone}>
          <Input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            required
            placeholder="Enter your phone number"
            autoComplete="tel"
            className={errors.phone ? "border-red-500" : ""}
          />
        </FormField>
        
        <FormField label="Country">
          <select
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {isLocationLoading && !formData.country && (
        <div className="flex items-center space-x-2 text-cyan-300 text-sm">
          <MapPin size={16} className="animate-pulse" />
          <span>Detecting your location...</span>
        </div>
      )}

      {locationDetected && (
        <div className="flex items-center space-x-2 text-green-300 text-sm bg-green-900/20 p-2 rounded-lg">
          <MapPin size={16} />
          <span>Country auto-detected from your location</span>
        </div>
      )}

      <FormField label="Company" error={errors.company}>
        <Input
          name="company"
          value={formData.company}
          onChange={handleInputChange}
          required
          placeholder="Enter your company name"
          autoComplete="organization"
          className={errors.company ? "border-red-500" : ""}
        />
      </FormField>

      <FormField label="Message" error={errors.message}>
        <Textarea
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          required
          placeholder="Tell us how we can help you..."
          className={errors.message ? "border-red-500" : ""}
        />
      </FormField>

      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="subscribe"
          name="subscribe"
          checked={formData.subscribe}
          onChange={handleInputChange}
          className="mt-1 w-4 h-4 text-cyan-400 bg-transparent border-2 border-purple-400 rounded focus:ring-cyan-400 focus:ring-2"
        />
        <label htmlFor="subscribe" className="text-sm text-purple-200 leading-5">
          I want to receive news and updates once in a while
          <br />
          <span className="text-purple-300 text-xs">
            We'll save your details in our system so we can follow up with you.
          </span>
        </label>
      </div>

      {mutation.error && (
        <div className="flex items-center space-x-2 text-red-300 bg-red-900/20 p-3 rounded-lg">
          <AlertCircle size={20} />
          <span>An error occurred. Please try again.</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full md:w-auto"
        size="lg"
      >
        {mutation.isPending ? 'Sending Message...' : 'SEND MESSAGE'}
      </Button>
    </form>
  );
};
