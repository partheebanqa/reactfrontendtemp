import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: 'Free',
    description: 'Perfect for getting started',
    features: [
      '20 test generations for work email',
      '1 test generation for non-work email',
      'Individual user',
      'Environments and variables config',
    ],
    buttonText: 'Current Plan',
    buttonVariant: 'outline' as const,
    popular: false,
  },
  {
    name: 'PRO',
    price: '$20',
    period: '/ month',
    description: 'Everything in FREE +',
    features: [
      '50 test generations per month',
      'Exhaustive functional and security test suites',
      'Unlimited AI-generated assertions for each test',
      'Single-click execution, editing, and assertions for tests',
    ],
    buttonText: 'Buy Now',
    buttonVariant: 'default' as const,
    popular: true,
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    description: 'Everything in PRO +',
    features: [
      'Unlimited test generations and users',
      'Integrate with your CI/CD',
      'End-to-end testing of API workflows',
      'Access control via Workspaces',
      'Enterprise-grade security',
      'Reporting and analytics',
      'Dedicated technical account manager and priority support',
      'Third-party integrations',
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'outline' as const,
    popular: false,
  },
];

const faqs = [
  {
    question: 'Can I change plans anytime?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
  },
  {
    question: 'What happens after my trial ends?',
    answer:
      'Your account will automatically switch to the Free plan. No charges will be made without your explicit consent.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans.',
  },
  {
    question: 'Is there a setup fee?',
    answer:
      'No, there are no setup fees or hidden charges. You only pay the monthly subscription fee.',
  },
];

export default function Plan() {
  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='border-b border-border bg-card'>
        <div className='container mx-auto px-6 py-8 text-center'>
          <h1 className='text-4xl font-bold text-foreground mb-2'>
            Choose Your Plan
          </h1>
          <p className='text-lg text-muted-foreground'>
            Scale your API testing with the right plan for your needs
          </p>
        </div>
      </div>

      <div className='container mx-auto px-6 py-12'>
        {/* Trial Banner */}
        <Card className='mb-12 bg-primary text-primary-foreground border-primary animate-fade-in'>
          <CardContent className='p-8 text-center'>
            <div className='flex items-center justify-center mb-4'>
              <div className='w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center mr-3'>
                <Check className='w-5 h-5' />
              </div>
              <h2 className='text-2xl font-semibold'>Start Your Free Trial</h2>
            </div>
            <p className='text-primary-foreground/90 mb-6'>
              Try any paid plan free for 15 days. No credit card required.
            </p>
            <Button
              variant='secondary'
              size='lg'
              className='bg-primary-foreground text-primary hover:bg-primary-foreground/90'
            >
              Start 15-Day Trial
            </Button>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-16'>
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative transition-all duration-300 hover:scale-105 animate-fade-in ${plan.popular
                ? 'border-primary shadow-lg ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
                }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <Badge className='absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground'>
                  Most Popular
                </Badge>
              )}

              <CardHeader className='text-center pb-8'>
                <CardTitle className='text-2xl font-bold text-foreground mb-2'>
                  {plan.name}
                </CardTitle>
                <div className='mb-4'>
                  {plan.name === "ENTERPRISE" ? (
                    <span className="text-xl font-semibold text-muted-foreground">
                      Contact us for pricing
                    </span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}S
                      </span>
                      {plan.period && (
                        <span className="text-muted-foreground">{plan.period}</span>
                      )}
                    </>
                  )}
                </div>
                <p className='text-muted-foreground'>{plan.description}</p>
              </CardHeader>

              <CardContent className='space-y-4'>
                <ul className='space-y-3'>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className='flex items-start'>
                      <Check className='w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0' />
                      <span className='text-sm text-muted-foreground'>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.buttonVariant}
                  className='w-full mt-8 transition-all duration-200'
                  size='lg'
                >
                  {plan.buttonText}
                  {plan.buttonText === 'Buy Now' && (
                    <ArrowRight className='w-4 h-4 ml-2' />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div
          className='max-w-4xl mx-auto animate-fade-in'
          style={{ animationDelay: '400ms' }}
        >
          <h2 className='text-3xl font-bold text-foreground text-center mb-12'>
            Frequently Asked Questions
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className='border-border hover:border-primary/50 transition-colors'
              >
                <CardContent className='p-6'>
                  <h3 className='font-semibold text-foreground mb-3'>
                    {faq.question}
                  </h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
