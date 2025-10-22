export default function Terms() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-3">Acceptance of Terms</h2>
          <p>
            By accessing and using this service, you accept and agree to be bound by the terms and provisions of this agreement.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Description of Service</h2>
          <p>
            Our service provides automated invoice processing and billing management for logistics companies.
            We access your Gmail account to scan for invoice-related emails and extract relevant data.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">User Responsibilities</h2>
          <p>
            You agree to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Use the service only for lawful purposes</li>
            <li>Not attempt to interfere with the service's operation</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Gmail Access</h2>
          <p>
            By connecting your Gmail account, you authorize us to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Read emails from your inbox</li>
            <li>Access attachments that may contain invoices</li>
            <li>Store extracted invoice data</li>
          </ul>
          <p>
            You can revoke this access at any time through your Google Account settings or our application.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Limitation of Liability</h2>
          <p>
            The service is provided "as is" without warranties of any kind. We are not liable for:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Errors in invoice data extraction</li>
            <li>Service interruptions or downtime</li>
            <li>Loss of data due to technical issues</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Data Processing</h2>
          <p>
            We process your email data solely for the purpose of invoice extraction and management.
            See our Privacy Policy for details on how we handle your data.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Termination</h2>
          <p>
            We reserve the right to terminate or suspend your access to the service at any time.
            You may terminate your account at any time by discontinuing use and revoking Gmail access.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time.
            Continued use of the service after changes constitutes acceptance of the new terms.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-3">Contact Information</h2>
          <p>
            For questions about these Terms of Service, contact us at support@arkya.ai
          </p>
        </div>
      </div>
    </div>
  );
}
