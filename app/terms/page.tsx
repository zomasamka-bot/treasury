import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Treasury Action",
  description: "Terms of Service for Treasury Action application on Pi Network",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing and using Treasury Action ("Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1.5. Pi Network Testnet and Payment Notice</h2>
            <p>
              <strong>IMPORTANT - TESTNET OPERATIONS:</strong> By using Treasury Action, you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Treasury Action operates exclusively on the Pi Network Testnet environment</li>
              <li>All payment transactions processed through this Service occur on Pi Testnet using test coins with no real monetary value</li>
              <li>The app integrates with your Pi Wallet to authenticate users and process payment transactions</li>
              <li>You consent to authorizing payment transactions on Pi Testnet through your connected Pi Wallet</li>
              <li>All transactions are non-reversible and recorded on the Pi Testnet blockchain</li>
              <li>Although operations occur on Testnet, you should treat all actions as if they were real for the purpose of understanding the transaction flow</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use License and Pi Wallet Authorization</h2>
            <p>
              Permission is granted to use Treasury Action for creating and approving treasury actions through Pi Wallet integration. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Connect your Pi Wallet and authorize payment transactions on Pi Testnet</li>
              <li>Use the Service only for legitimate treasury action approvals and payment processing</li>
              <li>Not attempt to bypass wallet authentication or payment verification mechanisms</li>
              <li>Accept responsibility for all actions authorized through your connected Pi Wallet</li>
              <li>Understand that all operations are on Pi Testnet with test coins of no real value</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
            <p>
              The materials on Treasury Action are provided on an 'as is' basis. Treasury Action makes no warranties, 
              expressed or implied, regarding payment processing or Testnet transaction guarantees. Treasury Action hereby 
              disclaims and negates all warranties including fitness for a particular purpose or non-infringement of rights.
            </p>
            <p className="mt-2">
              <strong>Payment Disclaimer:</strong> Treasury Action does not guarantee payment approvals or completions. All Pi Wallet 
              operations are subject to Pi Network infrastructure, Testnet availability, and blockchain confirmation. Users acknowledge 
              that payment transactions may fail or be delayed due to network conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
            <p>
              Users of Treasury Action are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Maintaining the security of their Pi Wallet and authentication credentials</li>
              <li>Reviewing all treasury action details before authorizing payment transactions</li>
              <li>Understanding that all operations occur on Pi Testnet with test coins</li>
              <li>Not using the Service for any unlawful or fraudulent purposes</li>
              <li>Accepting all consequences of authorized payment transactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
            <p>
              In no event shall Treasury Action or its suppliers be liable for any damages arising out of payment failures, 
              Testnet unavailability, or inability to use the Service, even if notified of the possibility of such damage. 
              Users acknowledge that Pi Testnet operations are subject to Pi Network infrastructure limitations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Links and External Services</h2>
            <p>
              Treasury Action integrates with the Pi Network and Pi Wallet services. Treasury Action is not responsible for 
              Pi Network availability, Testnet functionality, or Pi Wallet operations. Use of Pi services is subject to Pi's 
              terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Modifications</h2>
            <p>
              Treasury Action may revise these terms of service at any time without notice. By using this Service, 
              you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with applicable law, and you irrevocably 
              submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through the Treasury Action application.
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
