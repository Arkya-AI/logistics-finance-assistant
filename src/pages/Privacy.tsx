export default function Privacy() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-3">Information We Collect</h2>
          <p>
            When you connect your Gmail account, we collect and process:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Your Gmail email address</li>
            <li>Email messages and attachments containing invoices</li>
            <li>OAuth access tokens to access your Gmail account</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-3">How We Use Your Information</h2>
          <p>
            We use your information to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Scan your Gmail inbox for invoice documents</li>
            <li>Extract and process invoice data for your finance workflows</li>
            <li>Provide automated billing and payment tracking</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Data Security</h2>
          <p>
            Your data is encrypted in transit and at rest. We use industry-standard security measures to protect your information.
            OAuth tokens are stored securely and are never shared with third parties.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Data Retention</h2>
          <p>
            We retain your email data and extracted invoice information only as long as necessary to provide our services.
            You can request deletion of your data at any time.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Third-Party Services</h2>
          <p>
            We use Google OAuth for authentication and Gmail API for accessing your emails.
            We do not share your personal information with any other third parties.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal data</li>
            <li>Request correction of your data</li>
            <li>Request deletion of your data</li>
            <li>Revoke Gmail access at any time</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at support@arkya.ai
          </p>
        </div>
      </div>
    </div>
  );
}
