import CustomerQueriesOpsPageView from "@/features/ops/CustomerQueriesOpsPageView";

export default function AdminCustomerQueriesPage() {
  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Operations</p>
          <h1 className="admin-page__title">Customer queries</h1>
          <p className="admin-page__copy">
            Review inbound contact form submissions, update status, and record follow-up notes.
          </p>
        </div>
      </header>
      <CustomerQueriesOpsPageView embedded />
    </div>
  );
}
