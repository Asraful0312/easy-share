export default function TermsAndConditions() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">Terms & Conditions</h1>
      <p className="mb-4">
        By using EasyShare, you agree to the following terms:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>Do not upload illegal, harmful, or explicit content.</li>
        <li>
          All uploads are temporary and may be removed at any time after 24
          hours (Unless extended by the premium plan).
        </li>
        <li>We are not responsible for loss of data. Always keep a backup.</li>
        <li>We reserve the right to block users who abuse the service.</li>
        <li>
          Use at your own risk. We provide the service "as-is" without
          warranties.
        </li>
      </ul>
      <h2 className="text-2xl font-semibold mt-6 mb-2">
        Subscriptions & Billing
      </h2>
      <p className="mb-4">
        EasyShare offers optional paid subscription plans that provide enhanced
        features such as increased file size limits, extended file retention
        time, and additional upload options. By subscribing, you agree to pay
        the specified monthly or yearly fee in exchange for access to those
        features.
      </p>
      <p className="mb-4">
        Subscriptions are billed in advance on a recurring basis (e.g., monthly
        or annually) and will automatically renew unless canceled before the
        renewal date. You may cancel your subscription at any time via your
        account settings.
      </p>
      <p className="mb-4">
        We reserve the right to modify pricing or subscription features at any
        time. If we do, we will provide advance notice. Continued use of the
        subscription constitutes acceptance of any updated terms.
      </p>
      <p>
        No refunds are issued for unused portions of the billing cycle unless
        required by law.
      </p>

      <p>
        These terms may change at any time. Continued use of the service implies
        agreement to the latest terms.
      </p>
    </div>
  );
}
