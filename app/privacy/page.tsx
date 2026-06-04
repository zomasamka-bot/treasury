import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Treasury Action",
  description: "Privacy Policy for Treasury Action application on Pi Network",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Treasury Action ("we", "us", "our", or "Company") operates the Treasury Action application (the "Service"). 
              This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Pi Network Integration and Payment Processing</h2>
            <p>
              Treasury Action is a Pi Network application that integrates with the Pi Wallet for user authentication and payment processing.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Pi Wallet Connection:</strong> When you use Treasury Action, you connect your Pi Wallet to authorize transactions and sign actions.</li>
              <li><strong>Testnet Payments:</strong> All payment processing in Treasury Action occurs exclusively on the Pi Network Testnet. These are test transactions with no real monetary value.</li>
              <li><strong>Transaction Processing:</strong> When you create a treasury action requiring approval, the app initiates and processes payment transactions on Pi Testnet through your connected Pi Wallet.</li>
              <li><strong>Non-Custodial:</strong> Treasury Action does not store or control your private keys. Your Pi Wallet maintains full control over all wallet operations and transactions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Collection and Use</h2>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Pi Network wallet address and user identification</li>
              <li>Transaction data related to treasury actions you create</li>
              <li>Action descriptions, types, and amounts you submit</li>
              <li>Approval and signature data from payment transactions on Pi Testnet</li>
              <li>Pi Wallet authentication tokens and payment approval signatures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Use of Data</h2>
            <p>
              Treasury Action uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>To provide and maintain the Service</li>
              <li>To process treasury action requests and payment approvals on Pi Testnet</li>
              <li>To manage user accounts and institutional reviews</li>
              <li>To initiate and track test transactions on the Pi Network Testnet</li>
              <li>To track and log transaction history and payment signatures</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Security of Data</h2>
            <p>
              The security of your data is important to us but remember that no method of transmission over the Internet 
              or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect 
              your personal data, we cannot guarantee its absolute security.
            </p>
            <p className="mt-2">
              <strong>Important:</strong> Treasury Action is a non-custodial application. Your private keys are stored only in your Pi Wallet and are never transmitted to or stored by Treasury Action servers. All transactions are signed by your Pi Wallet locally.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through the Treasury Action application.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </main>
  );
}
