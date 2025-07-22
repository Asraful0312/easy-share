export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">
        All uploaded content is deleted automatically after 24 hours (Unless
        extended by the premium plan). We do not sell or share your data with
        third parties. Uploaded files are stored securely using Cloudflare R2,
        and we do not index or track their contents.
      </p>
      <p className="mb-4">
        We may collect anonymous analytics to improve service performance (e.g.
        page views, error rates), but we do not use cookies for advertising or
        behavioral tracking.
      </p>
      <p>
        If you have any questions about privacy, please contact us at
        <a href="mailto:asrafulislam0312@gmail.com">
          asrafulislam0312@gmail.com
        </a>
        .
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">
        Subscription Information
      </h2>
      <p className="mb-4">
        If you choose to subscribe to a paid plan, we may collect limited
        billing information such as your email address and transaction data
        through our secure payment provider (e.g., Polar). We do not store any
        credit card information on our servers.
      </p>
      <p>
        This information is used solely for billing and account management
        purposes and is never sold or shared with third parties.
      </p>
    </div>
  );
}
