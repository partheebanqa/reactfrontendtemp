import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ContactFormData, ContactFormErrors } from '@/shared/types/contact';
import { submitContactForm } from '@/lib/contactService';
import { validateContactForm } from '@/utils/validation';
import { CustomInput } from '../ui/custom-input';
import { CustomButton } from '../ui/custom-button';
import { CustomTextarea } from '../ui/custom-textarea';
import { CustomSelect } from '../ui/custom-select';

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

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  country: '',
  company: '',
  message: '',
  subscribe: false
};
interface ContactFormProps {
  submitted: boolean;
  setSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ContactForm: React.FC<ContactFormProps> = ({ submitted, setSubmitted }) => {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  // const [submitted, setSubmitted] = useState(false);
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

    if (name === 'phone' && !/^\d*$/.test(value)) {
      return;
    }

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
        <CustomButton
          onClick={() => setSubmitted(false)}
          variant="secondary"
          className="mt-6"
        >
          Send Another Message
        </CustomButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomInput
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          required
          placeholder="Enter your full name"
          autoComplete="name"
        />

        <CustomInput
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          required
          placeholder="Enter your email address"
          autoComplete="email"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomInput
          label="Phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          error={errors.phone}
          required
          placeholder="Enter your phone number"
          autoComplete="tel"
        />

        <CustomSelect
          label="Country"
          name="country"
          value={formData.country}
          onChange={handleInputChange}
          options={countries}
          required
        />
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

      <CustomInput
        label="Company"
        name="company"
        value={formData.company}
        onChange={handleInputChange}
        error={errors.company}
        required
        placeholder="Enter your company name"
        autoComplete="organization"
      />

      <CustomTextarea
        label="Message"
        name="message"
        value={formData.message}
        onChange={handleInputChange}
        error={errors.message}
        required
        placeholder="Tell us how we can help you..."
      />

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
          <span>{mutation.error.message}</span>
        </div>
      )}

      <CustomButton
        type="submit"
        loading={mutation.isPending}
        className="w-full md:w-auto"
        size="lg"
      >
        {mutation.isPending ? 'Sending Message...' : 'SEND MESSAGE'}
      </CustomButton>
      <p className="text-sm text-white">
        Response time: Usually within 2-4 hours during business hours
      </p>
    </form>
  );
};
