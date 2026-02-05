import React from 'react';
import LandingLayout from '@/components/LandingLayout/LandingLayout';

const PrivacyPage: React.FC = () => {
  return (
    <LandingLayout>
      <section className='container mx-auto px-4 max-w-4xl mt-20'>
        {/* Title */}
        <h1 className='text-4xl font-bold text-foreground mb-2'>
          Optraflow Privacy Policy
        </h1>

        {/* Effective Date */}
        <p className='text-muted-foreground mb-8'>Last Updated: Nov 21, 2025</p>

        {/* Introduction */}
        <p className='text-muted-foreground mb-10 leading-relaxed'>
          This Data Privacy Policy ("Policy") outlines how Optraflow ("we,"
          "us," or "our") collects, uses, discloses, and protects personal
          information when you use our product/service/Extension. By accessing
          or using the Product, you consent to the practices described in this
          Policy.
        </p>

        {/* Section 1 */}
        <div className='mb-10'>
          <h2 className='text-xl font-semibold text-foreground mb-4'>
            1. Information We Collect
          </h2>
          <p className='text-muted-foreground mb-4 uppercase tracking-wide text-sm'>
            What information we collect, why we collect it, and how it is used
          </p>

          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold text-foreground mb-3'>
                1.1. When You Browse or Visit Our Website
              </h3>
              <div className='space-y-3 text-muted-foreground'>
                <p>
                  When you browse or visit our website,
                  https://www.optraflow.com, we collect information such as your
                  name, email address, domain and contact details.
                </p>
                <p>
                  We collect data related to your interactions with our product,
                  including log files, usage patterns, and preferences.
                </p>
                <p>
                  If you subscribe to our Product, we collect payment details
                  such as credit card information. [We don't store the card
                  details in our system.]
                </p>
                <p>
                  We may retain communications you send to us, including emails
                  and messages through our product.
                </p>
                <p>
                  No information will be shared with 3rd party/affiliates for
                  marketing/promotional purposes.
                </p>
                <p>
                  When you attend a marketing event and/or we exchange business
                  cards and you provide us with your Personal Data
                </p>
                <p>
                  When you contact us (e.g. customer support, need help, submit
                  a request)
                </p>
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold text-foreground mb-3'>
                1.2. When You Make Use of Our Browser Extension
              </h3>
              <div className='space-y-3 text-muted-foreground'>
                <p>
                  <span className='font-semibold text-foreground'>
                    Extension:
                  </span>{' '}
                  We don't collect any information of user, session or data
                </p>
                <p>
                  "All network data recorded via the extension is stored locally
                  on the user's device. Optraflow does not transmit, access, or
                  store this data on its servers."
                </p>
                <p>
                  "The extension may request browser permissions necessary to
                  capture and display network activity. These permissions are
                  used solely for local functionality and are not used to
                  transmit data externally."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className='mb-10'>
          <h2 className='text-xl font-semibold text-foreground mb-4'>
            2. How We Use Your Information
          </h2>
          <p className='text-muted-foreground mb-4'>
            We use your personal information for the following purposes:
          </p>
          <div className='space-y-3 text-muted-foreground'>
            <p>
              To provide, operate, and maintain the product and to fulfill your
              requests.
            </p>
            <p>
              To respond to your inquiries, provide technical support, and
              address your concerns.
            </p>
            <p>To process payments, send invoices, and manage billing.</p>
            <p>
              To send you updates, execution results, notifications, and
              information related to the product.
            </p>
            <p>
              To analyze usage patterns, improve the product, and develop new
              features.
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <div className='mb-10'>
          <h2 className='text-xl font-semibold text-foreground mb-4'>
            3. Sharing of Information
          </h2>
          <p className='text-muted-foreground mb-4'>
            We may share your personal information with:
          </p>
          <div className='space-y-3 text-muted-foreground'>
            <p>
              <span className='text-foreground'>Service Providers:</span>{' '}
              Third-party service providers who assist us in operating the
              product and delivering our services.
            </p>
            <p>
              <span className='text-foreground'>Legal Compliance:</span> When
              required by law or to protect our rights, privacy, safety, or
              property.
            </p>
            <p>
              <span className='text-foreground'>Business Transfers:</span> In
              connection with a merger, acquisition, or sale of assets, your
              information may be transferred.
            </p>
          </div>
        </div>

        {/* Section 4 */}
        <div className='mb-10'>
          <h2 className='text-xl font-semibold text-foreground mb-4'>
            4. Data Security
          </h2>
          <p className='text-muted-foreground leading-relaxed'>
            We implement reasonable security measures to protect your personal
            information from unauthorized access, alteration, disclosure, or
            destruction.
          </p>
        </div>

        {/* Section 5 */}
        <div className='mb-10'>
          <h2 className='text-xl font-semibold text-foreground mb-4'>
            5. Your Choices
          </h2>
          <div className='space-y-3 text-muted-foreground'>
            <p>
              <span className='text-foreground'>Access and Correction:</span>{' '}
              You may access, update, or correct your personal information by
              logging into your account.
            </p>
            <p>
              <span className='text-foreground'>Marketing Communications:</span>{' '}
              You can opt-out of receiving marketing communications from us by
              following the instructions provided in the communication.
            </p>
          </div>
        </div>

        {/* Section 6 */}
        <div className='mb-10'>
          <h2 className='text-xl font-semibold text-foreground mb-4'>
            6. Children's Privacy
          </h2>
          <div className='space-y-3 text-muted-foreground'>
            <p>
              The product is not intended for individuals under the age of 18.
              We do not knowingly collect personal information from children.
            </p>
            <p>
              "Our browser extension is also not intended for individuals under
              the age of 18."
            </p>
          </div>
        </div>

        {/* Section 7 */}
        <div className='mb-10'>
          <h2 className='text-xl font-semibold text-foreground mb-4'>
            7. Changes to this Policy
          </h2>
          <p className='text-muted-foreground leading-relaxed'>
            We may update this Policy from time to time. The updated Policy will
            be posted on our website, and the date of the latest revision will
            be indicated.
          </p>
        </div>

        {/* Section 8 */}
        <div className='mb-10'>
          <h2 className='text-xl font-semibold text-foreground mb-4'>
            8. Contact Us
          </h2>
          <p className='text-muted-foreground'>
            If you have any questions or concerns about this Policy or our data
            practices, please contact us at{' '}
            <a
              href='mailto:support@optraflow.com'
              className='text-primary hover:underline'
            >
              support@optraflow.com
            </a>
            .
          </p>
        </div>
      </section>
    </LandingLayout>
  );
};

export default PrivacyPage;
